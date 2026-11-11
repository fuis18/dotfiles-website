---
title: "Control Panel"
description: "Evolution of bars and shells: Waybar, QuickShell, AGS and launchers."
category: apps
tags: ["ags", "ironbar", "anyrun"]
---

A compositor like [Hyprland or Niri](./window-manager.md) draws windows, but brings nothing else: no bar with the clock and workspaces, no quick volume or network settings, no way to launch programs. In a full desktop like GNOME or Plasma all of that is included and hard to change; here you have to assemble it yourself, and in return you decide every piece.

## Rofi and Wofi (2012, 2020)

Before the native Wayland launchers, the de facto standard came from the X11 world. **Rofi**, by Dave Davenport, started in March 2012 as a fork of `simpleswitcher`, a tiny window switcher by Sean Pringle, and ended up absorbing it completely: it added modes to launch applications, connect over SSH and, above all, to replace `dmenu` with free-text input. Written in C, lightweight and configurable with themes in the rasi format (its own CSS variant), Rofi became the universal launcher of tiling window managers throughout the decade.

Its Achilles' heel was the move to Wayland: Rofi was designed on X11 and XCB, and for years it did not work (or half-worked, via XWayland) on native compositors. From there came **Wofi** in 2020, by Seth Barberee: a lightweight Rofi clone written in C but on GTK3 and `wlr-layer-shell`, the layer of protocols that allows drawing overlays on Wayland. It copied Rofi's mental model —modes, shortcuts, a text box— and solved the nativeness problem. For a few years it was the default launcher in Sway guides and the early era of Hyprland.

Both aged in different ways. Rofi is still maintained and gained Wayland support (first through lbonn's `rofi-wayland` fork, whose patches eventually landed in the main branch), so it remains a valid option if you accept its own theme engine. Wofi, on the other hand, is practically stopped: it works, but it has gone years without maintenance and its GTK3 base is far from this guide's GTK4. Its natural successors are the launchers that come next.

| Fact                 | Rofi                                   | Wofi                             |
| -------------------- | -------------------------------------- | -------------------------------- |
| Origin               | March 2012 (Dave Davenport)            | 2020 (Seth Barberee)             |
| Language and toolkit | C; X11/XCB (later Wayland support)     | C; GTK3 + wlr-layer-shell        |
| Configuration        | rasi themes + custom formats           | CSS + configuration file         |
| Status               | Actively maintained                    | Maintenance stopped              |
| License              | MIT                                    | GPL-3.0                          |
| Documentation        | <https://github.com/davatorium/rofi>   | <https://hg.sr.ht/~scoopta/wofi> |

**Installation.**

```bash
# Rofi (with Wayland support in recent versions)
sudo pacman -S rofi

# Wofi
sudo pacman -S wofi
```

## Waybar: the traditional standard (2018)

Waybar (based on C++ and GTK), created in 2018, established itself as the standard status bar for compositors and tiling window managers (like Sway and Hyprland).

Created by Alexays in response to the lack of modern solutions for Wayland, Waybar arrived just as wlroots was unifying support for compositors like Sway, Hyprland and others. Its success came down to three things: simple configuration (JSON + CSS), rapid maturity and a huge community that produced thousands of examples. By 2020 it was already the default option in almost every Hyprland and Sway guide.

Waybar is still today the most stable and best-documented option. It works well if you want a functional bar without writing code: you pick predefined modules, style them with CSS and you're done. The cost is rigidity: if you need something that doesn't fit in a module, you have to program a new one in C++, which is out of reach for most people.

| Fact                 | Detail                                   |
| -------------------- | ---------------------------------------- |
| Origin               | 2018 (Alexays)                           |
| Language and toolkit | C++; GTK                                 |
| Configuration        | JSON with comments + CSS                 |
| License              | MIT                                      |
| Documentation        | <https://github.com/Alexays/Waybar/wiki> |
| Code                 | <https://github.com/Alexays/Waybar>      |

**Installation.**

```bash
sudo pacman -S waybar
mkdir -p ~/.config/waybar
cp /etc/xdg/waybar/config.jsonc /etc/xdg/waybar/style.css ~/.config/waybar/
waybar
```

To launch it with Hyprland, add it to the startup of your configuration (see [Window Manager](./window-manager.md)):

```lua
wl.on("startup", function()
  wl.exec("waybar")
end)
```

## Ironbar: Rust + GTK4 (2022)

Not all tools follow the JavaScript/QML path. Ironbar, by Jake Stanger (August 2022), was born out of frustration with the existing alternatives: he wanted a complete panel without having to program from scratch. It is written in **Rust with GTK4**, and its design is multithreaded and asynchronous: if a module or service blocks, the rest of the bar keeps working.

The advantage: memory safety, lower resource usage and a smaller, auditable codebase. The disadvantage: less documentation and a more active development pace that can break configurations between versions (currently in 0.x).

Ironbar fits better with the rest of the GTK4 applications in this guide, and its configuration accepts several formats (JSON, TOML, YAML) in addition to CSS.

| Fact                 | Detail                                       |
| -------------------- | --------------------------------------------- |
| Origin               | August 13, 2022 (Jake Stanger)               |
| Language and toolkit | Rust; GTK4                                    |
| Configuration        | JSON/TOML/YAML + CSS                          |
| License              | MIT                                           |
| Latest version       | 0.19.0 (May 2026)                            |
| Documentation        | <https://github.com/JakeStanger/ironbar/wiki> |
| Code                 | <https://github.com/JakeStanger/ironbar>      |

**Installation.**

```bash
sudo pacman -S ironbar ttf-jetbrains-mono-nerd
ironbar
```

## AGS: the GTK/TypeScript alternative (2023, 2024)

**As an alternative within the GTK ecosystem, the AGS (Aylur's GTK Shell) project emerges in 2023, revolutionizing customization by allowing the desktop interface to be defined using TypeScript / JavaScript and CSS on GTK, enabling the creation of highly dynamic and reactive widgets and panels.**

AGS (_Aylur's GTK Shell_), created by Aylur, began as a spiritual successor to Eww (an earlier tool that used XML) but bringing it into the modern GTK ecosystem. The key innovation: using **GJS** (the same JavaScript interpreter as GNOME Shell) along with **Astal**, a collection of libraries in Vala/C that expose system services (network, Bluetooth, battery, MPRIS, tray, notifications, etc.) as JavaScript objects.

**AGS v1** was the great success of 2023: its own framework where the interface was described with JavaScript functions (`Widget.Window`, `Widget.Box`…) and reactive variables (`Variable`, `bind`) updated the bar without touching GTK directly. Thousands of configurations were published with it, and it dominated Hyprland _ricing_ for a whole year. After that, Aylur made a decision that split the project: extract everything substantial into the Astal libraries and reduce AGS to a thin interpreter that runs applications written with them. **AGS v2** changed the mental model —widgets became written with JSX in TypeScript, APIs were redistributed across Astal modules— and version 1 was frozen as legacy.

The result was twofold. On one hand, almost every v1-era configuration broke, and migrating cost a full shell rewrite: many users bailed out mid-transition. On the other, a separation remains that is worth knowing before copying any dotfiles from the internet: an AGS v1 configuration does not run on v2 nor the other way around, and the old package still exists only to keep the legacy alive.

| Fact                 | AGS v1                       | AGS v2+                                |
| -------------------- | ---------------------------- | -------------------------------------- |
| Period               | 2023 (frozen as legacy)      | Since 2024; AGS 3.1.1 in April 2026   |
| Interface model      | JS widgets (`Widget.*`)      | JSX in TypeScript on Astal             |
| Status               | Legacy, no new features      | Active development                     |
| Compatibility        | None between versions        | The project's future base              |

| Fact                 | Detail                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| Origin               | 2023 (Aylur); first package in the AUR in August 2023                                |
| Language and toolkit | GTK 3/4; TypeScript/JSX (GJS) or other languages with GObject Introspection          |
| Hot reload           | Not by default                                                                       |
| License              | GPL-3.0                                                                              |
| Documentation        | <https://aylur.github.io/ags/> and <https://aylur.github.io/astal/>                   |
| Code                 | <https://github.com/Aylur/ags> and <https://github.com/Aylur/astal>                  |

**Installation.** The two eras coexist as separate packages:

```bash
# AGS v1 (legacy, for old configurations)
paru -S aylurs-gtk-shell-v1

# Current AGS (v2 and later, on the Astal libraries)
paru -S aylurs-gtk-shell-v2 libastal-meta
```

A new project is created and run with its CLI:

```bash
ags init -d ~/.config/ags
ags run ~/.config/ags/app.tsx
```

Visual coherence is its biggest argument: it fits naturally with GTK desktops (like this guide's) and lets you use the full GTK and libadwaita ecosystem, staying consistent with applications like Nautilus or GNOME Settings.

## QuickShell: the Qt/QML revolution (2023)

**In 2023 the QuickShell project is created, causing an explosion in the customization (ricing) community by allowing bars, widgets and system components to be built using the power of Qt and QML natively in Wayland window managers.**

QuickShell, created by outfoxxed, arrived as a direct response to the limitations of static bars. Using QtQuick and QML —the same declarative language KDE uses in Plasma—, it lets you define complex interfaces with animations, transitions and reactive logic without leaving the configuration. Its key feature: **hot reload**. When you save changes, the panel updates instantly without restarting, which makes the learning curve tolerable.

During AGS's transition, much of the customization community tried QuickShell and stayed: today it is the most popular shell for building dynamic desktops, and the amount of themes and examples available grew to surpass any alternative —from a minimal bar to a drop-down control center with real-time graphics.

The disadvantage is the cost: QML has its own learning curve and the runtime adds memory compared to a static bar. In addition, the Qt ecosystem is not as integrated into GTK desktops by default, which requires additional theme configuration.

| Fact                 | Detail                                           |
| -------------------- | ------------------------------------------------ |
| Origin               | 2023–2024 (outfoxxed)                            |
| Language and toolkit | QML / QtQuick; Qt 6                              |
| Hot reload           | Yes                                              |
| License              | LGPL-3.0                                         |
| Documentation        | <https://quickshell.outfoxxed.me>                |
| Code                 | <https://git.outfoxxed.me/quickshell/quickshell> |

**Installation.**

```bash
paru -S quickshell
```

A minimal first panel in `~/.config/quickshell/shell.qml`:

```qml
import Quickshell
import QtQuick

PanelWindow {
  anchors { top: true; left: true; right: true }
  implicitHeight: 30

  Text {
    anchors.centerIn: parent
    text: "Hello"
    font.pixelSize: 16
  }
}
```

```bash
quickshell
```

## Anyrun and Vicinae: the launchers

The last piece of a menu-less desktop is the launcher: a search box that opens with a shortcut and starts programs. But a good launcher does more: it calculates, searches files, opens windows, looks things up in a dictionary. Since the job varies a lot depending on who uses it, what matters is that it be extensible.

**Anyrun** is a native Wayland launcher, written in **Rust**, inspired by KRunner (KDE's). It uses GTK4 with _layer shell_ and its philosophy is in the name: anything that can work with a text entry and a selection. Everything it offers is plugins, dynamic libraries with an API of just four functions (applications, symbols, dictionary, web search, a dmenu-style selector...), and it is styled with GTK CSS. Its development started in late 2022 and today it lives in the `anyrun-org` organization.

**Vicinae** takes the opposite direction: it is a native launcher in **C++ and Qt**, with many built-in modules, that runs as a background server (so it opens instantly) and is compatible with Raycast extensions through a compatibility layer. If you come from macOS or like Raycast-style launchers, it is the most complete option.

The choice depends on how much integration you want. Anyrun is lightweight, GTK4-only and fully modular, and it is the option consistent with this guide's ecosystem. Vicinae comes with much more done, at the cost of dragging in Qt (see [Ecosystem](./ecosystem.md)).

| Fact                 | Anyrun                                 | Vicinae                                     |
| -------------------- | -------------------------------------- | ------------------------------------------- |
| Origin               | Late 2022 (Kirottu)                    | Recent project (2025)                       |
| Author               | Kirottu and community                  | Vicinae community                           |
| Language and toolkit | Rust; GTK4 + gtk4-layer-shell          | C++; Qt                                     |
| Extensibility        | Plugins (dynamic libraries)            | Built-in modules and Raycast extensions     |
| Configuration        | RON (`config.ron`) + CSS               | Interface and the server's own files        |
| Documentation        | <https://github.com/anyrun-org/anyrun> | <https://github.com/vicinaehq/vicinae>      |

**Installation.**

```bash
paru -S anyrun-git
paru -S vicinae-bin
```

Anyrun looks for its configuration in `~/.config/anyrun/` (the `config.ron` file, the CSS and the `plugins/` folder). To open it, bind the `anyrun` command to a keyboard shortcut in your compositor's configuration.

## Current philosophies: two paths

**Today, the Linux desktop gap has clearly split between two philosophies: reactive hyper-customization through tools like QuickShell or AGS (assuming higher RAM usage when running JS/QML runtimes), versus the extreme performance and safety that native Rust development offers.**

| Approach                | Tools                   | Advantages                                | Disadvantages                             |
| ----------------------- | ----------------------- | ----------------------------------------- | ----------------------------------------- |
| **Hyper-customization** | AGS, QuickShell         | Total flexibility, animations, reactivity | More RAM, learning curve                  |
| **Rust minimalism**     | Ironbar, Anyrun, Waybar | Low usage, safety, stability              | Less flexibility, less documentation      |
