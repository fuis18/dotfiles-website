---
title: "Ecosystem"
description: "Evolution of toolkits: Qt, GTK and iced-cosmic."
category: apps
tags: ["gtk", "qt", "iced", "cosmic"]
---

A toolkit is the library an application uses to draw its windows, buttons and menus, and it is the decision that most shapes every application in this section: it defines how they look, how much memory they use, how a theme is applied to them and which libraries each one pulls into the system. Mixing toolkits works, but each brings its own dependencies and its own sense of style, so it is worth choosing one as the base and treating the others as exceptions.

## History

**Around 1995**, Troll Tech (Norway) publishes the first public version of Qt (0.90), written in C++. Its appeal was twofold: it allowed building complex graphical interfaces with a single cross-platform toolkit and offered a flexible licensing model. It was partly open source, but with conditions that were not enough for the free software community.

**In 1996** the KDE project was founded, adopting Qt as its technical foundation. One of its greatest advantages was that, by keeping a unified environment in Qt, memory usage was maximally optimized: the system and applications shared the same libraries loaded in RAM. For users running a full KDE desktop, Qt applications were lightweight because they did not duplicate dependencies.

**In 1997**, as a direct response to the Qt licensing question, GTK (originally _GIMP ToolKit_) was created, written in C. Its authors, Spencer Kimball and Peter Mattis, had developed it to bring the GIMP image editor to life, but it quickly became the preferred graphics engine for the newly founded GNOME project. GNOME bet on simplicity, modularity and a clean, focused user experience.

**By 2020** GTK4 arrives with a new architecture focused on performance through GPU acceleration (Vulkan and OpenGL), redefining the rules of design in GNOME and introducing libraries like libadwaita to guarantee adaptive, coherent interfaces. Version 4.0 was released on December 16, 2020.

**Early Qt advantages:** low RAM usage, **as long as you had the full desktop** — KDE—. For minimalist users the GTK ecosystem was more attractive and modular, since it did not load the whole KDE infrastructure if you only wanted a few applications.

## GTK: the modular standard (1997 – Present)

GTK became the foundation of almost everything we already use today. The current version is GTK 4, released on December 16, 2020, with GPU-accelerated rendering and designed for Wayland. On top of it sits libadwaita, GNOME's widget library that gives applications a coherent style and adapts to different screen sizes. GTK 3 still exists, but as of March 2026 its development is down to one release per year.

GTK is the toolkit of [ReGreet](./greeter.md), [Ghostty](./shell.md), the [xdg-desktop-portal-gnome](./portals.md) backend, Nautilus, Epiphany, Celluloid and [AGS](./control-panel.md). Its main features:

- **A clear style convention:** libadwaita defines styles, sizes and behavior, so applications look like each other without configuring anything.
- **Dark mode is requested through a single path:** the `color-scheme` setting propagates to applications through the settings portal.
- **A deliberate limitation:** libadwaita applications ignore third-party GTK themes; they can only be customized with their own CSS in `~/.config/gtk-4.0/gtk.css`.

### gtk-rs: GTK in Rust

Thanks to the **gtk-rs** library (GTK bindings for Rust), the GTK ecosystem has gained a lot of attention for its performance and safety. Rust eliminates the memory errors inherent to C/C++, and gtk-rs allows writing safe GTK applications without sacrificing compatibility. This has attracted new developers who want the best of both worlds: GTK's maturity with Rust's safety.

| Fact            | Detail                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Origin          | Mid-1990s, for GIMP (Spencer Kimball and Peter Mattis)                           |
| Maintainer      | GNOME project                                                                    |
| Current version | GTK 4 (4.0 on December 16, 2020); libadwaita 1.8 (September 2025)                |
| Language        | C; Rust bindings available (gtk-rs)                                             |
| License         | LGPL-2.1 or later                                                               |
| Documentation   | <https://docs.gtk.org/gtk4/> and <https://gnome.pages.gitlab.gnome.org/libadwaita/> |
| Code            | <https://gitlab.gnome.org/GNOME/gtk>                                             |

**Installation.** Install GTK 4 and libadwaita, GTK 3 for older applications and a tool to adjust the theme outside GNOME:

```bash
sudo pacman -S gtk4 libadwaita gtk3 nwg-look
gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
```

## Qt: power in C++ (1995 – Present)

Qt is written in C++ and complemented by QML and Qt Quick, a declarative language for animated interfaces, which is exactly what [QuickShell](./control-panel.md) and [Vicinae](./control-panel.md) use to build panels and launchers. It is also the toolkit of KDE and of applications like OBS or VLC.

The Norwegian company Troll Tech released its first public version (Qt 0.90) on May 20, 1995, created by Haavard Nord and Eirik Chambe-Eng. It was only partly open source, with a license that was not enough for the free software community. That concern led to the creation of GNOME as an alternative, and in 1998 to the founding of the KDE Free Qt Foundation, which guarantees that Qt will remain available as free software. Since 2000 it has been offered under the GPL and, since version 4.5 (2009), also under the LGPL. Today it is developed by The Qt Company, and its current version, Qt 6, was released in December 2020.

Using Qt on a GTK-based desktop has a known cost: applications bring their own libraries and, without configuration, look different from the rest. It is solved with two pieces: `qt6ct`, which lets you choose Qt's theme, font and icons outside KDE, and Kvantum, a theme engine that lets you mimic the rest of the desktop's look. On Wayland you also need the `qt6-wayland` module. One case that illustrates how ecosystems mix: EasyEffects, a GTK classic, moved from GTK4 to Qt with its version 8.0 (November 2025).

| Fact                 | Detail                                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| First release        | May 20, 1995 (Qt 0.90, Troll Tech); Qt 6 in December 2020                       |
| Authors              | Haavard Nord and Eirik Chambe-Eng (Troll Tech); today, The Qt Company and the community |
| Language and license | C++ (plus QML); LGPL-3, GPL or commercial                                        |
| Documentation        | <https://doc.qt.io>                                                              |
| Code                 | <https://code.qt.io/cgit/qt/>                                                    |
| Utilities            | <https://github.com/trialuser02/qt6ct> and <https://github.com/tsujan/Kvantum>   |

**Installation.** Base Qt with Wayland support, plus the theme tools; then, tell Qt which one to use:

```bash
sudo pacman -S qt6-base qt6-wayland qt6ct kvantum
```

```bash
# In your session environment (for example, in your Hyprland or Niri configuration)
export QT_QPA_PLATFORMTHEME=qt6ct
```

## iced-cosmic: everything in Rust (2024–2026)

GTK and Qt share a trait: they are written in C and C++, languages where a memory error is easy to make and hard to find, and using them from Rust requires a bindings layer that adds complexity. **iced** starts from scratch in Rust: it is a purely Rust toolkit, created by Héctor Ramón (hecrj), with a reactive programming model inspired by Elm's architecture, where the interface is a function of the application's state. Its own repository describes it as experimental, but solid enough to sustain a full desktop.

That desktop is **COSMIC**, by System76. It started as a modified version of GNOME for Pop!\_OS and was rewritten from scratch on iced, with its own library, `libcosmic`, which adds widgets, a theme system and desktop integration: that is what this section calls iced-cosmic. The first alpha was released on August 5, 2024, and version 1.0 (_Epoch 1_) on December 11, 2025 alongside Pop!\_OS 24.04 LTS; version 1.2.0 dates from July 2026. It is Wayland-only, not tied to a distribution, and its libraries are published under MPL-2.0 and its applications under GPL-3.0.

Two details: it does not expect `systemd` (its Alpine documentation describes it as designed to be portable, and version 1.1 added OpenRC support for Bluetooth), and its settings manager already uses Varlink instead of D-Bus (see [dbus](./dbus.md)).

**Notable:** System76 chose to develop everything in Rust because it seeks to completely eliminate the memory errors that are common in C and C++. It is not just about performance, but about **safety guaranteed at compile time**. The cost is maturity: the application ecosystem is small and, according to release analyses, application polish and documentation are still a work in progress. That is why we do not use it as a base, but we do recommend trying its standalone apps (files, terminal, editor) as an alternative to GTK's, and following its evolution if you are interested in developing in Rust.

| Fact                 | Detail                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Origin               | iced: Héctor Ramón (hecrj); libcosmic and COSMIC: System76                                            |
| Milestones           | COSMIC first alpha on August 5, 2024; 1.0 on December 11, 2025; 1.2.0 in July 2026                   |
| Language and license | Rust; libraries MPL-2.0, applications GPL-3.0                                                        |
| Documentation        | <https://iced.rs> and <https://system76.com/cosmic>                                                   |
| Code                 | <https://github.com/iced-rs/iced> and <https://github.com/pop-os/libcosmic>                          |

**Installation.** COSMIC applications can be installed standalone, without the full desktop (confirm the package names available in your repository):

```bash
sudo pacman -S cosmic-files cosmic-term cosmic-edit
```

To develop with libcosmic there is an application template that generates a project ready to build (requires `rustup`, see [Developer Environment](./dev-environment.md)):

```bash
cargo install cargo-generate
cargo generate gh:pop-os/cosmic-app-template
```

## Quick comparison

| Aspect            | GTK                             | Qt                             | iced-cosmic                |
| ----------------- | ------------------------------- | ------------------------------ | -------------------------- |
| Origin year       | 1997 (GIMP)                     | 1995 (Troll Tech)              | 2024 (System76)            |
| Language          | C                               | C++                            | Rust                       |
| Memory safety     | Manual risk (C)                 | Manual risk (C++)              | Guaranteed (Rust)          |
| Maturity          | High (30 years)                 | High (30 years)                | Experimental               |
| RAM usage         | Moderate (without full environment) | Low (with full desktop)    | Similar to GTK             |
| Themes            | libadwaita (built-in)           | Kvantum / qt6ct                | Built-in (cosmic-settings) |
| Ideal for         | GNOME desktop, modularity       | KDE, complex applications      | Rust development, futurism |
