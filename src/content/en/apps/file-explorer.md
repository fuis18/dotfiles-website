---
title: "File Explorer"
description: "File explorers: Yazi, Nautilus and Spacedrive."
category: apps
tags: ["yazi", "nautilus", "spacedrive"]
---

Navigating files is the most repeated task on any system, and there are two traditional ways to do it: the terminal, fast but blind (`ls` does not show you the image or the PDF), and the graphical file explorer, comfortable but slow and mouse-dependent. This page picks three tools that attack that trade-off from different ends: a terminal explorer with previews, the standard GTK graphical explorer, and an experiment that tries to stop your files from depending on the device they are on.

## Yazi

A classic terminal explorer, like `ranger` or `nnn`, solves navigation, but it pauses while reading a large directory or generating a preview, and the oldest ones do not show images. Yazi (which means "duck" in Chinese) starts from a different idea: all input and output operations are asynchronous, and heavy tasks are spread across multiple threads, so the interface never blocks while the disk works. It was created by sxyazi, is written in Rust and published its first versions in 2023.

Its main features are:

- **Immediate previews** of images, video, PDF, compressed files, directories and syntax-highlighted code, with built-in image protocols for Kitty and Ghostty (see [Shell](./shell.md)) and other terminals via Sixel or Überzug++.
- **Vim-style keyboard navigation:** tabs, cross-directory selection, visual mode and batch renaming.
- **Integrates with the usual tools:** `ripgrep`, `fd`, `fzf` and `zoxide`.
- **A plugin system in Lua** (with its own package manager) to add previews, themes and even replace the interface.

The cost is stability: the project itself describes it as a public beta that can be used daily, with frequent breaking changes, so it is worth reading the release notes for each version.

| Fact                 | Detail                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| First release        | 2023 (version 0.2.4 in March 2024; date-based numbering since 2025)   |
| Author               | sxyazi and community                                                   |
| Language and license | Rust (with Lua plugins); MIT                                          |
| Documentation        | <https://yazi-rs.github.io>                                            |
| Code                 | <https://github.com/sxyazi/yazi>                                       |

**Installation.** Yazi and the optional tools that enable previews:

```bash
sudo pacman -S yazi ffmpeg 7zip jq poppler fd ripgrep fzf zoxide imagemagick
```

To make your shell change to the directory where you exit Yazi, add this function (the fish one goes in `~/.config/fish/config.fish`; the bash or zsh one in `~/.bashrc` or `~/.zshrc`) and use `y` instead of `yazi`:

```fish
# fish
function y
    set tmp (mktemp -t "yazi-cwd.XXXXXX")
    command yazi $argv --cwd-file="$tmp"
    if read -z cwd < "$tmp"; and [ "$cwd" != "$PWD" ]; and test -d "$cwd"
        builtin cd -- "$cwd"
    end
    rm -f -- "$tmp"
end
```

```bash
# bash or zsh
function y() {
  local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
  yazi "$@" --cwd-file="$tmp"
  IFS= read -r -d '' cwd < "$tmp"
  [ "$cwd" != "$PWD" ] && [ -d "$cwd" ] && builtin cd -- "$cwd"
  rm -f -- "$tmp"
}
```

The configuration lives in `~/.config/yazi/` (`yazi.toml`, `keymap.toml`, `theme.toml` and `init.lua`).

## Nautilus

The terminal is not good at everything: dragging a file into a window, mounting a phone over MTP, opening a network folder or viewing thumbnails of a photo folder are tasks where a graphical explorer wins. Nautilus (today called simply _Files_) is GNOME's file manager, and was born at Eazel, a company founded in 1999 by former Apple developers; its 1.0 version dates from 2001, and since then it has been GNOME's reference explorer.

Since GNOME 43 it is built with GTK4 and libadwaita (see [Ecosystem](./ecosystem.md)), so it looks the same as the rest of the applications in this guide. Its main features:

- **System integration:** thanks to GVfs it mounts external drives, MTP devices, network resources and the trash without configuring anything.
- **System file chooser:** the GNOME portal (see [XDG Desktop Portals](./portals.md)) uses it, so the "Open" and "Save" dialogs of other applications look the same.
- **Extensible:** it supports extensions (for example, with `nautilus-python`) and quick previews with the spacebar if you install `sushi`.

On Hyprland or Niri it does not ship with all of its components by default: you have to add GVfs and the archive and preview utilities.

| Fact                | Detail                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Origin              | Eazel (a company founded in 1999); Nautilus 1.0 in 2001; today, the GNOME project             |
| Toolkit and license | GTK4 + libadwaita (since GNOME 43); GPL                                                       |
| Documentation       | <https://help.gnome.org/users/nautilus/stable/> and <https://wiki.archlinux.org/title/GNOME/Files> |
| Code                | <https://gitlab.gnome.org/GNOME/nautilus>                                                      |

**Installation.** Nautilus plus the components that complete it: GVfs for drives, MTP and network, archive support and previews:

```bash
sudo pacman -S nautilus gvfs gvfs-mtp gvfs-smb file-roller sushi
```

To open it, `nautilus`, and to set it as the default folder explorer:

```bash
xdg-mime default org.gnome.Nautilus.desktop inode/directory
```

## Spacedrive

Over time, your files end up scattered across the laptop, an external drive, your phone and several cloud services, and no explorer shows them to you as a single set: you know the photo exists, but not which device it is on. Spacedrive, created by Jamie Pine, tries to solve this with a distributed virtual file system (VDFS): your files stay where they are, but Spacedrive indexes and identifies them by their content, so you can find, tag and copy them across devices as if they were in a single library.

It is an ambitious, young project. Version 2, from December 2025, is a complete rewrite: the VDFS core is written in Rust on SQLite, the desktop application uses Tauri with a web (React) interface for macOS, Windows and Linux, there is a headless server for Docker, and additional features are built as WASM-based extensions. Some, like facial recognition in photos or backup management, are still in development or planned.

It is important to be clear about its status: it went through years of alpha and rewrites, and what it offers today is a promise more than a replacement for Nautilus or Yazi.

| Fact                 | Detail                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| Origin               | Jamie Pine's project; in alpha in 2024; version 2 (rewrite) in December 2025        |
| Technology           | Rust core (SQLite); desktop with Tauri and React; WASM extensions                   |
| License              | Open source (check the repository for the current license of each part)             |
| Documentation        | <https://spacedrive.com>                                                             |
| Code                 | <https://github.com/spacedriveapp/spacedrive>                                        |

**Installation.** There is no official package in the Arch repositories. The Linux versions are downloaded from the downloads page at <https://spacedrive.com> or from the releases published in the repository; check there, because the project changes quickly:

```bash
# Example with a downloaded AppImage
chmod +x Spacedrive-*.AppImage
./Spacedrive-*.AppImage
```
