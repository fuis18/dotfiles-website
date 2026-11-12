---
title: "Window Manager"
description: "Wayland window managers: Hyprland and Niri."
category: utilities
tags: ["sway", "hyprland", "niri", "wayland"]
---

After the [greeter](./greeter.md) comes the desktop, and on Wayland the window manager is also the compositor: the program that draws the screen, manages the keyboard and mouse, and decides where each window goes. There is no separate graphics server, so this choice defines how the whole system feels.

## From X11 to Wayland

The X11 server, standardized in 1987 from the X Window System of 1984, has been defining how drawing happens on Linux for almost four decades. Its design rests on an assumption that was reasonable in the eighties and is not today: the network. X is a network protocol that sends drawing primitives ("draw this line here") to a server that may live on another machine, and that decision explains its modern problems. The server centralizes everything and applications talk to it through a channel nobody supervises: any client can capture another window's keystrokes, read the screen contents or inject events. The split between server and compositor requires two context switches per frame, causing tearing and latency that X11 compositors never fully solved. And its specification is frozen: to add something as basic as per-monitor scaling or secure screenshots, extensions have to be stacked (XRandR, XFixes, XComposite…) that grew so much that maintenance became unsustainable.

Wayland is the answer to those three problems, and it started in the most literal way possible: as the personal project of someone tired of dodging X. Kristian Høgsberg, an Intel engineer who had worked on the X server (Xorg) and on Mesa, started it in 2008 as a weekend experiment: "what if the compositor were the server?". Inverting the model solves everything at the root. There is no central server: the compositor _is_ the display server, each window draws into its own buffers that the kernel synchronizes (via KMS/EGL, no context switches), and the base protocol is so small that capabilities are negotiated safely with explicit protocols: a window only sees what the compositor grants it, and capturing the screen or intercepting the keyboard require permissions rather than being the default. Protocol version 1.0 was released in 2012, and full GNOME and KDE support arrived between 2015 and 2022, after years of migration across the ecosystem of tools that depended on X (remote desktop, screen recorders, screenshots).

The middle ground between the two worlds was **wlroots** (2017), a library by Drew DeVault and Simon Ser that implements the generic parts of a Wayland compositor —input, outputs, rendering, protocols— so that building one does not mean starting from scratch. Practically every independent compositor in this guide comes from it or its conceptual successor, and one of them is the next one.

## Sway

Sway ("SirCmpwn's Wayland compositor") is the compositor that proved the migration was possible. Created by Drew DeVault, it started development in 2014 on top of wlroots —wlroots, in fact, was extracted from Sway's own code— with a deliberate goal: replicate i3, the X11 _tiling_ manager, exactly, with the same configuration, the same keybindings and the same modes, but on Wayland. If you came from i3, moving to Sway meant changing one line of your startup file.

Its model is static _tiling_: as in i3, windows are arranged in a manual tree, the user decides whether each split is horizontal or vertical, and nothing rearranges itself. That sobriety is its defining trait: no animations, no decorations, no effects. What it brings is solidity: the reference implementation of the protocols the whole community uses today (layer-shell for bars and launchers, screencopy for recording), and near-fossil stability —1.x versions since 2019 with few visible changes—.

The cost of that purity is twofold. For someone not coming from i3, the manual configuration of the window tree feels rigid compared to dynamic _tiling_. And its development pace has slowed: it remains solid and maintained, but the innovation of recent years happens elsewhere, and some capabilities (animations, corners, appearance) simply do not exist. Sway is the end of a line, not the beginning of another: the proof that Wayland could replace X11, and the base the following options built on.

| Fact                 | Detail                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| First release        | In development since 2014; version 1.0 on March 4, 2019                                           |
| Author               | Drew DeVault and community (Simon Ser, current maintenance)                                       |
| Language and license | C (on wlroots); MIT                                                                               |
| Model                | Static tiling, i3-compatible                                                                      |
| Documentation        | <https://github.com/swaywm/sway/wiki> and <https://manpages.debian.org/unstable/sway/sway.5.en.html> |
| Code                 | <https://github.com/swaywm/sway>                                                                  |

**Installation.**

```bash
sudo pacman -S sway swaybg swaylock
sway
```

If you come from i3, copy your config to `~/.config/sway/config` and it will work almost unchanged.

## Hyprland

Traditional desktops (GNOME, KDE) use floating windows: you place and resize them by hand, and all the time is lost arranging them. The _tiling_ managers of X11, like i3 or bspwm, solved that by placing windows automatically without overlapping them, but at the cost of an austere aesthetic and X11's limitations. Sway carried i3's model to Wayland, and Hyprland was the next step: against Sway's sobriety, Vaxry (Vaxerski) created a _dynamic tiling_ compositor for Wayland that does not sacrifice looks.

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
| Latest version       | 0.56.2 (August 5, 2026); Lua since 0.55 (May 2026)                       |
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
