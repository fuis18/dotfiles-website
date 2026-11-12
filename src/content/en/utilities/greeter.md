---
title: "Greeter"
description: "Login greeter with ReGreet."
category: utilities
tags: ["regreet", "greeter", "login"]
---

The greeter is the first thing you see at boot and the last thing to leave the [tty](../../iso/install-media/): the screen where you pick a user, type the password, and decide which session to start. It looks like an appearance detail, but it is the point where the system goes from being a set of services to being your desktop, which is why it should be small and not impose anything on what comes after.

## ReGreet

Traditional login managers (GDM, SDDM, LightDM) were born tied to a full desktop environment. GDM drags in GNOME, SDDM drags in Qt and KDE, and nearly all of them assume they themselves start the graphics server and know every possible session. For a desktop made of loose pieces, like the one in this guide, that is a huge dependency just to show a password window.

In response, Kenny Levinsen designed `greetd`, a minimal login daemon written in Rust that assumes nothing about what will be launched. Its central idea is to separate two roles: `greetd` only authenticates and starts sessions, and the interface is a separate program, the _greeter_, which talks to it over a simple JSON protocol. Anything you can run from a tty, `greetd` can start; and any program that speaks that protocol can be a greeter. There are terminal greeters (`agreety`, `tuigreet`), GTK ones (`gtkgreet`), Qt ones, and Wayland ones (`wlgreet`).

ReGreet is this guide's greeter: a clean, customizable GTK4 interface, written in Rust with Relm4. Since GTK4 is the foundation of the rest of the applications we use, it looks and behaves like one more of them. Its main traits are:

- **Remembers** the last user and session chosen.
- **Detects the sessions** that are installed by reading `/usr/share/wayland-sessions` and `/usr/share/xsessions`, so Hyprland and Niri show up on their own, without listing them by hand.
- **Is customizable** with a TOML file (background, GTK theme, icons, font) and with custom CSS.
- **Runs inside a minimal compositor**, whichever you prefer: Cage (the recommended option, since it shows only one window), Sway, [Hyprland or Niri](../window-manager/), or Gamescope.

To work it needs `greetd`, GTK 4.16 or later, D-Bus (see [dbus](../dbus/)), AccountsService, and a compositor to run in. It is in Arch's official repositories, so there is no need to go through the AUR (see [Package Management](../package-management/)).

With `systemd`, `greetd` occupies the first virtual console and replaces `getty@tty1`; without it, `greetd` works the same with whatever init you use, since it does not depend on `systemd`.

| Fact                | greetd                                                                                | ReGreet                                      |
| ------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| Author              | Kenny Levinsen                                                                        | rharish101 (GitHub)                          |
| Development         | Since 2019                                                                            | Version 0.2.0 (the most recent checked)      |
| Language and license | Rust; GPL-3.0                                                                        | Rust (Relm4, GTK4); GPL-3.0-or-later         |
| Documentation       | <https://man.sr.ht/~kennylevinsen/greetd> and <https://wiki.archlinux.org/title/Greetd> | <https://github.com/rharish101/ReGreet/wiki> |
| Code                | <https://git.sr.ht/~kennylevinsen/greetd>                                             | <https://github.com/rharish101/ReGreet>      |

**Installation.**

```bash
sudo pacman -S greetd greetd-regreet cage
sudo systemctl enable greetd.service
```

Edit `/etc/greetd/config.toml` so the greeter runs inside Cage (`-s` allows switching virtual consoles, in case you need to get out; `-mlast` uses only the last connected monitor, and `-d` avoids window decorations). `dbus-run-session` gives it its own session bus:

```toml
[terminal]
vt = 1

[default_session]
command = "dbus-run-session cage -s -mlast -d -- regreet"
user = "greeter"
```

Copy the sample configuration, with all the options commented out, and tweak whatever you want:

```bash
sudo cp /usr/share/doc/greetd-regreet/regreet.sample.toml /etc/greetd/regreet.toml
```

If you want a user to log in automatically at boot, add an initial session to `/etc/greetd/config.toml`:

```toml
[initial_session]
command = "start-hyprland"
user = "user"
```

To test it, reboot or run `sudo systemctl restart greetd`. If something fails, switch virtual consoles with `Ctrl+Alt+F2` (Cage's `-s` parameter keeps that switch available) and review the logs from the tty.

On Artix and Obarun, `greetd` is installed with your init's service package (see [PID](../../iso/pid/)).
