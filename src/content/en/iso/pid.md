---
title: "PID"
description: "Process management and init: Systemd, S6 and 66."
category: iso
tags: ["systemd", "s6", "66", "init"]
---

PID 1 is the first process the kernel starts and the parent of all the others: it brings up the services, restarts them if they fall and shuts the system down in order. It is the piece that shapes the rest of the guide the most, because boot, user services, logs and even the desktop session all depend on it.

## Systemd

In Linux's early days the init was `SysV`: a collection of shell scripts run one after another. Booting was slow because everything was sequential, it could not tell whether a service was still alive once launched, it relied on fragile PID files to track it, and dependencies between services were resolved with ordering numbers. In response, Lennart Poettering and Kay Sievers (then at Red Hat) proposed in 2010, with the post "Rethinking PID 1", an init that would boot in parallel, track every service with cgroups and describe everything in declarative files.

- Parallel boot driven by a dependency graph, with socket activation and on-demand startup.
- Declarative unit files (`.service`, `.mount`, `.timer`, `.socket`) instead of imperative scripts.
- Process tracking with cgroups: stopping a service also stops all of its children.
- A single set of tools and logs (`systemctl`, `journalctl`) for services, sessions, mounts and timers.

It is the default init on Arch and CachyOS (see [Distro Base](./distro-base/)) and the one most packages assume, including many from the AUR and complete desktop environments. That makes it the option with the least friction.

| Fact                | Details                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| First release       | April 2010 (announcement), version 1 in May 2010                           |
| Authors             | Lennart Poettering and Kay Sievers (Red Hat), with community collaboration |
| Adoption milestones | Fedora 15 enabled it by default in May 2011; Arch Linux, in October 2012   |
| License             | LGPL-2.1+                                                                  |
| Documentation       | <https://systemd.io> and <https://wiki.archlinux.org/title/Systemd>        |
| Source              | <https://github.com/systemd/systemd>                                       |
| Foundational text   | <https://0pointer.net/blog/projects/systemd.html>                          |

**Installation.** It already comes included in Arch and CachyOS. If you need to install or update it:

```bash
sudo pacman -S systemd
```

Example of a declarative service (`/etc/systemd/system/my-app.service`) and its activation:

```ini
[Unit]
Description=My application
After=network-online.target

[Service]
ExecStart=/usr/bin/my-app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now my-app.service
```

It solved `SysV`'s problems, but it grew a lot in return. Besides being PID 1 it absorbed components like `logind`, `udev`, `journald`, `resolved` and `networkd`, which is criticized as coupling and a larger attack surface, and it limits its use outside Linux. That is where Artix and Obarun were born, and that is where the next section starts.

## S6

`systemd` solved `SysV`'s problems, but it did so by growing: today a single project is the init, the session manager, the log manager, the network manager and the name manager. A large PID 1 is hard to audit, and everything around it becomes dependent on it. In response, Laurent Bercot (skarnet.org) developed `s6`: a small, safe supervision suite that does one thing well, watch processes, and that composes with other tools following the Unix philosophy.

- Every service is a directory with a `run` script; `s6-supervise` watches it and restarts it if it dies, with no PID files.
- Small, separate tools: `s6-svc` (control), `s6-svstat` (query), `s6-log` (logs with rotation).
- `s6-rc` adds dependency management and _oneshot_ services, and `s6-linux-init` lets you use `s6` as a full init.
- Written in C with minimal dependencies (`skalibs`, `execline`), licensed ISC.

It is the technical base of Artix (as one of its init options) and of Obarun. On Artix, services are installed as `<service>-s6` packages, and `elogind` replaces what `logind` used to provide.

| Fact          | Details                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- |
| First release | Around 2011; `s6-rc` was announced in September 2015                                        |
| Author        | Laurent Bercot (skarnet.org)                                                                |
| License       | ISC                                                                                         |
| Documentation | <https://skarnet.org/software/s6/> and <https://skarnet.org/software/s6-rc/>                |
| Source        | <https://github.com/skarnet/s6> (mirror; original repository at `git://git.skarnet.org/s6`) |
| Community     | `supervision` mailing list at <https://skarnet.org/lists/supervision/>                      |

On Artix, install the `s6` base when creating the system (see [Distro Base](./distro-base/)):

```bash
basestrap /mnt base base-devel s6-base elogind-s6 linux-zen linux-zen-firmware
```

On other distributions it is built from source (requires `skalibs` and `execline`; check each package's `INSTALL` file before starting):

```bash
git clone https://github.com/skarnet/s6
cd s6 && ./configure && make && sudo make install
```

Example of a service (`/etc/s6/sv/sshd/run`, executable):

```sh
#!/bin/sh
exec /usr/bin/sshd -D -e
```

```bash
s6-svstat /run/service/sshd   # check status
s6-svc -r /run/service/sshd   # restart
```

`s6` is a low-level toolbox, not a finished product: services are written by hand, the documentation is technical and dense, and AUR packages that ship only `systemd` units do not work without adaptation.

## 66

`s6` is powerful, but writing and maintaining service directories by hand is not a comfortable experience for a daily-use distribution. In response, Eric Vidal created `66` in the Obarun project: a service manager built around `s6` that provides declarative service files (called _frontends_), boot trees, per-user services and high-level commands like `66 enable`.

- Declarative service files with `[main]`, `[start]` and `[stop]` sections, far more readable than loose scripts.
- Dependency and service tree management; since series 0.8 a dependency can point to any service, regardless of tree.
- System and user services with the same tool.
- It runs on `s6` and is not tied to Obarun: it can be used on other Unix systems.

It is the point where `s6`'s robust supervision and the comfort of a declarative frontend come together, and that is why it closes the thread that started with `SysV`. On Obarun, services come as `<service>-66serv` packages.

- Small community and a single main maintainer, which implies long-term risk.
- Series 0.8 (2024) required a manual system migration (removing `/etc/66`, `/var/lib/66` and `~/.66`), so it is worth reading each version's release notes before updating.
- Official alternative on the way: skarnet published `s6-frontend` 0.1.0.0 in July 2026, its own frontend for `s6-rc`. It is worth following closely, because it could compete with `66` as a convenience layer on top of `s6`.

| Fact          | Details                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| First release | Presented on skarnet's `supervision` list in April 2019; version 0.8 in 2024 |
| Author        | Eric Vidal (Obarun project)                                                  |
| License       | ISC                                                                          |
| Documentation | <https://wiki.obarun.org> and <https://web.obarun.org/software>              |
| Source        | <https://git.obarun.org/Obarun/66>                                           |
| News          | <https://news.obarun.org>                                                    |

The most direct way is Obarun, which already includes it: download the ISO from <https://web.obarun.org> (see [Distro Base](./distro-base/)). On an existing Obarun system, the tools are installed with `pacman`:

```bash
sudo pacman -S 66 66-tools oblibs
```

Example of a declarative service, taken from Obarun's conventions (`/etc/66/service/bluetoothd`):

```ini
[main]
@type = classic
@description = "bluetoothd daemon"
@version = 0.0.1
@user = ( root )

[start]
@execute = ( /usr/lib/bluetooth/bluetoothd )
```

```bash
sudo 66 enable bluetoothd
sudo 66 start bluetoothd
```
