---
title: "dbus"
description: "System message bus: dbus-daemon vs dbus-broker, and Varlink."
category: utilities
tags: ["dbus", "varlink", "dbus-broker"]
---

Almost everything that happens on a modern Linux desktop is a conversation between programs: the network manager notifies the panel that the Wi-Fi changed, a portal asks the compositor for a screenshot, the greeter checks which sessions exist. Those conversations need a common channel, and that channel is the message bus. It is an invisible piece, but almost everything that follows in this section ([Network](../network/), [Greeter](../greeter/), [XDG Desktop Portals](../portals/)) depends on it, which is why it is explained first.

That channel has been D-Bus for nearly two decades, and on the desktop it still is. But since 2017 there has been a second protocol, Varlink, that `systemd` uses more and more for its own APIs. The section therefore comes in two parts: first D-Bus and its two implementations, which is what the desktop actually speaks; then Varlink, which is `systemd`'s bet on what comes next.

## D-Bus: dbus-daemon vs dbus-broker

D-Bus has two implementations. `dbus-daemon` is the reference one: it started in 2002 inside freedesktop.org (with Havoc Pennington, of Red Hat, as its main author), reached version 1.0 in 2006, and is what almost every distribution shipped by default. But it is the implementation of an old design, and on a modern system its limits show: it can drop messages without warning under certain conditions, and several of its internal lookups grow linearly with the number of clients.

`dbus-broker` is a reimplementation compatible with the D-Bus specification, written by David Rheinsberg (formerly Herrmann) and Tom Gundersen, `systemd` developers, with its first releases in late 2017. It was written exclusively for Linux and takes advantage of its modern features, with three goals: reliability, scalability, and security. Specifically:

- **It does not lose messages silently:** its architecture allows guaranteeing that no message is dropped unexpectedly.
- **It scales better:** the lookups that grow linearly in `dbus-daemon` grow logarithmically in `dbus-broker`.
- **Better isolation:** being built for Linux, it can mitigate several denial-of-service attacks.

Fedora 30 (April 2019) adopted it by default, and Arch took the same path: its RFC 0025 made `dbus-broker` the default implementation, with `dbus-broker-units` as the recommended provider of the `dbus-units` virtual package (which `systemd` now depends on). But it has a decisive condition for this guide: the part that launches services, `dbus-broker-launch`, works by activating services as `systemd` units and has no substitute for other inits. The authors themselves describe it as a launcher intended for `systemd`-based systems, and the Artix community confirms that it is not a full replacement there, although experimental third-party scripts exist.

The practical conclusion is simple. With `systemd` (Arch, CachyOS), use `dbus-broker`. Without `systemd` (Artix with OpenRC, runit, s6, or dinit, and Obarun; see [PID](../../iso/pid/)), use `dbus-daemon`, which works with any init.

| Fact                | dbus-daemon                                               | dbus-broker                                               |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| First release       | 2002 (start), version 1.0 in 2006                         | Late 2017; default in Fedora 30 (April 2019)              |
| Authors             | Havoc Pennington (Red Hat) and the freedesktop.org community | David Rheinsberg and Tom Gundersen                      |
| Messages            | Can drop them under certain conditions                    | Guarantees they are not lost silently                     |
| Scalability         | Some linear internal lookups                              | Logarithmic lookups                                       |
| Init required       | Any                                                       | `systemd` (due to its `dbus-broker-launch` launcher)      |
| License             | AFL-2.1 or GPL-2.0+                                       | Apache-2.0                                                |
| Documentation       | <https://www.freedesktop.org/wiki/Software/dbus/>         | <https://github.com/bus1/dbus-broker/wiki>                |
| Code                | <https://gitlab.freedesktop.org/dbus/dbus>                | <https://github.com/bus1/dbus-broker>                     |

**Installation.** With `systemd`, install the `dbus-broker` units package (it provides `dbus-units` and conflicts with `dbus-daemon-units`; pacman will ask you which of the two you want), enable it for the system and for user sessions, and reboot:

```bash
sudo pacman -S dbus-broker-units
sudo systemctl enable dbus-broker.service
sudo systemctl --global enable dbus-broker.service
```

Verify with `busctl`, which is part of `systemd` and works with both implementations:

```bash
busctl list
busctl --user list
```

**Watch out for `libdbus`.** Choosing `dbus-broker` does not remove the `dbus` package. The only thing that changes is who implements the daemon and which `systemd` units start it; the `dbus` package stays installed because it is the one that provides `libdbus` (`libdbus-1.so`), the client library that hundreds of packages in the repository link against —PipeWire, CUPS, BlueZ, Avahi, `colord`, much of the audio and printing stack, to name a few— and because it ships tools that work equally well with either implementation: `dbus-monitor`, `dbus-send`, `dbus-run-session`, and `dbus-launch`. In fact, on Arch `dbus-broker-units` depends on `dbus`. In short: both get installed, but only one runs as a daemon; the `dbus-daemon` binary sits on disk with nobody starting it.

On Artix and Obarun, the bus is installed like any other init service (see [PID](../../iso/pid/)): the `dbus` package plus its service package, with the `dbus-<init>` pattern on Artix and `dbus-66serv` on Obarun.

```bash
# Example on Artix with s6
sudo pacman -S dbus dbus-s6
```

## Varlink

D-Bus works well for the desktop, but `systemd` found it annoying in three respects. It is not available until well into the boot process, when `systemd` already needs to communicate. It cannot be used for functions the bus itself depends on (for example, `journald` registration or user resolution), which creates circular dependencies. And since it multiplexes many calls over a single connection, it forces small run-and-finish tools to become full-fledged daemons.

In response, Harald Hoyer announced Varlink in December 2017, with Kay Sievers and Lars Karlitski as authors of much of the work. It was born after two failed attempts to bring D-Bus into the kernel (kdbus and Bus1), when the team decided to simplify the problem at the protocol level.

Its main traits are:

- **Point-to-point:** there is no intermediate daemon; the client connects directly to the service, normally over a Unix socket.
- **JSON over text:** messages are JSON, which allows testing a service from the shell without special libraries.
- **Self-describing interfaces:** each service exposes its own definition (`org.varlink.service`), which can be queried at runtime.
- **One process per connection:** writing a service is simpler because it does not need a shared event loop.

The result is a protocol that `systemd` already uses increasingly: in version 257 (December 2024) it had 19 Varlink interfaces or services versus 11 services with D-Bus APIs, and its developers have said that new APIs will tend to be Varlink.

Even so, Varlink does not replace D-Bus on the desktop, and nothing indicates it will do so soon: its original design does not contemplate passing file descriptors, serialization is slower than D-Bus with large objects, and almost no desktop application speaks it. That is why D-Bus remains the desktop's bus and Varlink coexists with it instead of replacing it: on a system with `systemd` you will have both protocols running at the same time, and neither requires you to do anything special.

| Fact                | Detail                                                              |
| ------------------- | ------------------------------------------------------------------- |
| First release       | December 18, 2017 (announcement)                                    |
| Authors             | Harald Hoyer, with Kay Sievers and Lars Karlitski (Red Hat)          |
| Adoption            | `systemd` v257 (December 2024): 19 Varlink interfaces/services      |
| Documentation       | <https://varlink.org>                                               |
| Code                | <https://github.com/varlink>                                        |

**Installation.** Varlink is a protocol, not a program; on Arch the `varlinkctl` client comes with `systemd`. With it you can inspect the services your system already uses:

```bash
varlinkctl info /run/systemd/userdb/io.systemd.Multiplexer
varlinkctl list-methods /run/systemd/userdb/io.systemd.Multiplexer
```

To write your own services, there are implementations in several languages at <https://github.com/varlink>.
