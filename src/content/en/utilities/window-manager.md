---
title: "Window Manager"
description: "Wayland window managers: Hyprland and Niri."
category: utilities
tags: ["hyprland", "niri", "wayland"]
---

After the [greeter](./greeter.md) comes the desktop, and on Wayland the window manager is also the compositor: the program that draws the screen, manages the keyboard and mouse, and decides where each window goes. There is no separate graphics server, so this choice defines how the whole system feels.

## Hyprland

Traditional desktops (GNOME, KDE) use floating windows: you place and resize them by hand, and all the time is lost arranging them. The _tiling_ window managers of X11, like i3 or bspwm, solved that by placing windows automatically without overlapping them, but at the cost of an austere aesthetic and X11's limitations. On Wayland, Sway carried over i3's model with the same restraint. In response, Vaxry (Vaxerski) created Hyprland: a _dynamic tiling_ compositor for Wayland that does not sacrifice looks.

The first public version, v0.1.0beta, came out on May 27, 2022. It is written in C++, started on wlroots and today uses its own screen engine (Aquamarine), with its own renderer. Its main traits are:

- **Dynamic tiling:** windows distribute themselves when opened and rearrange when closed, with two built-in layouts and more available as plugins (`hyprpm`).
- **Polished appearance:** animations, rounded corners, blur, and shadows, all configurable.
- **Configuration applied on save**, without restarting the session, and on-the-fly control via `hyprctl`.
- **Its own ecosystem** of tools (`hyprlock`, `hypridle`, `hyprpaper`, and others) sharing style and configuration.

Up to version 0.54, configuration used its own format (`hyprlang`, in `hyprland.conf`). In version 0.55 (May 2026) a Lua-based configuration system was added, allowing real logic (conditions, functions, events) instead of just option lists; the previous system is kept if there is no Lua file.

That rate of change is also its main cost: Hyprland is still on 0.x versions and has changed its configuration format more than once, so an update can break your configuration and it is worth reading each version's release notes. It is the compositor with the most customization, and the one that asks the most maintenance of you.

| Fact                 | Detail                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| First release        | May 27, 2022 (v0.1.0beta)                                                |
| Author               | Vaxry (Vaxerski) and community                                           |
| Language and license | C++; BSD-3-Clause                                                        |
| Latest version       | 0.56.2 (August 5, 2026) as checked; Lua since 0.55 (May 2026)            |
| Documentation        | <https://wiki.hypr.land> and <https://wiki.archlinux.org/title/Hyprland> |
| Code                 | <https://github.com/hyprwm/Hyprland>                                     |
| Website              | <https://hypr.land>                                                      |

**Installation.** Install it and start it from a tty (never with `sudo`), or pick it in the greeter:

```bash
sudo pacman -S hyprland
start-hyprland
```

With the Lua configuration, the file is `~/.config/hypr/hyprland.lua`. A minimal example that launches a bar on session start (confirm the exact syntax in your version's wiki, since it is recent):

```lua
hl.on("hyprland.start", function()
  hl.exec_cmd("waybar")
end)
```

For the portals (screenshot, file picker) to work, the session environment must be available to them; see [XDG Desktop Portals](./portals.md).

## Niri

In Hyprland, as in i3, each new window makes room by shrinking the others: open five windows and all end up narrow, and the ones you already had change size without you asking. Dynamic _tiling_ solves the mess, but at the cost of screen space being a zero-sum game.

Niri starts from a different idea, taken from PaperWM (a GNOME extension): windows are arranged in columns on an infinite strip extending to the right, and opening a new window never changes the size of the existing ones. To see more, you scroll along the strip. It was created by Ivan Molodetskikh (YaLTeR), written in Rust on the Smithay toolkit, and its development began in 2023. Among its main traits:

- **Each monitor has its own strip** and its own workspaces stacked vertically, so monitors do not mix with each other.
- **Built-in screenshot** and monitor recording through the GNOME portal (see [XDG Desktop Portals](./portals.md)).
- **KDL configuration** (`~/.config/niri/config.kdl`) that reloads on save, with `niri validate` to check it before applying.
- **Terminal control** with `niri msg`, which returns data as JSON for scripts.

Its pace is more measured and predictable: since 2025 it numbers its versions by date (25.02, 25.05, 25.08…), and 26.04 (April 2026) added blur effects and optional configuration files with `include`. The cost is that the scrollable-columns model is a different way of working and takes getting used to, and that it has fewer visual effects than Hyprland.

| Fact           | Hyprland                                | Niri                                                                         |
| -------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| Window model   | Dynamic tiling (they rearrange)         | Scrollable tiling (columns on an infinite strip)                             |
| First release  | May 27, 2022                            | In development since 2023                                                    |
| Author         | Vaxry (Vaxerski)                        | Ivan Molodetskikh (YaLTeR)                                                   |
| Language       | C++                                     | Rust (Smithay)                                                               |
| Configuration  | Lua (since 0.55); previously `hyprlang` | KDL                                                                          |
| License        | BSD-3-Clause                            | GPL-3.0                                                                      |
| Latest version | 0.56.2 (August 2026)                    | 26.04 (April 2026)                                                           |
| Documentation  | <https://wiki.hypr.land>                | <https://yalter.github.io/niri/> and <https://wiki.archlinux.org/title/Niri> |
| Code           | <https://github.com/hyprwm/Hyprland>    | <https://github.com/niri-wm/niri>                                            |

**Installation.**

```bash
sudo pacman -S niri
niri-session
```

`niri-session` starts Niri as a session service; if you prefer to do it without that service, `niri --session` starts it directly. If no configuration file exists, Niri uses a default one; to customize it, copy the sample and edit it (the path may vary by package):

```bash
mkdir -p ~/.config/niri
cp /usr/share/doc/niri/default-config.kdl ~/.config/niri/config.kdl
niri validate
```

Niri also includes service files for `dinit`, useful on Artix (see [PID](./pid.md)).
