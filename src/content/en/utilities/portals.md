---
title: "XDG Desktop Portals"
description: "XDG desktop portals with backends for Hyprland and GNOME."
category: utilities
tags: ["xdg", "portals", "wayland"]
---

In the old X11 world, any application could read the whole screen, capture the keyboard, and list the other applications' windows without asking permission. Wayland fixed that lack of isolation, but at a cost: an application can no longer simply take a screenshot, or open the system file picker, or share your screen in a video call. Someone has to do it for them, asking you first. That someone is the portals, and since they run over D-Bus (see [dbus](./dbus.md)), they depend on it.

The portals were born in the Flatpak project, courtesy of Alexander Larsson (Red Hat), so that applications isolated in a container could access resources outside it in a controlled way, but today they serve any application. They work in two layers. The first, `xdg-desktop-portal`, is a service that receives requests from applications. The second are the _backends_, programs that know your compositor and know how to fulfill the request: capture a screen, show the file picker, ask for your confirmation. Each backend declares which interfaces it implements and for which desktops, and a `portals.conf` file chooses which one to use for each.

Two practical details before moving on to the backends. The first is configuration: `xdg-desktop-portal` first looks for a file specific to the current desktop (for example `hyprland-portals.conf` or `niri-portals.conf`, depending on `XDG_CURRENT_DESKTOP`), and if it does not find one, a general one (`portals.conf`). The second is the environment: for the backend to work, the `XDG_CURRENT_DESKTOP` and `WAYLAND_DISPLAY` variables have to be available in the user session, and some compositors do not export them automatically (see each section).

**Installation.** The base service and this guide's two backends, plus the GTK one as a fallback for the interfaces the others do not implement (the file picker, for example):

```bash
sudo pacman -S xdg-desktop-portal xdg-desktop-portal-gtk xdg-desktop-portal-hyprland xdg-desktop-portal-gnome
```

To apply a configuration change, restart the service:

```bash
systemctl --user restart xdg-desktop-portal
```

| Fact          | Detail                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Origin        | The Flatpak project; Alexander Larsson (Red Hat) and community                                               |
| Documentation | <https://flatpak.github.io/xdg-desktop-portal/docs/> and <https://wiki.archlinux.org/title/XDG_Desktop_Portal> |
| Code          | <https://github.com/flatpak/xdg-desktop-portal>                                                              |

## xdg-desktop-portal-hyprland

Hyprland is its own compositor, and that is why no backend designed for other desktops knows how to talk to it for the most requested things: sharing screens or windows and capturing images. The generic backend for wlroots-based compositors does it, but without knowing what Hyprland can offer. In response, the Hyprland project itself publishes `xdg-desktop-portal-hyprland`, a custom backend that mainly implements screen capture (_ScreenCast_), screenshots (_Screenshot_), and global shortcuts (_GlobalShortcuts_), with a key difference from the generic one: it can share an individual window, not just a full screen.

It is a partial backend: it only covers those interfaces, so the rest (file picker, printing, etc.) is taken by the GTK backend. That is declared in `hyprland-portals.conf`, a file Hyprland already ships, but which you can create or overwrite in `~/.config/xdg-desktop-portal/`:

```ini
[preferred]
default=hyprland;gtk
```

For it to work, the backend needs `XDG_CURRENT_DESKTOP` and `WAYLAND_DISPLAY` in the session's activation environment. Hyprland may not export them on its own; this is solved by adding a line at the top of your configuration (with `systemd`, the `--systemd` option also passes them to user services; without it, remove it):

```lua
hl.on("hyprland.start", function()
  hl.exec_cmd("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
end)
```

| Fact          | Detail                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Origin        | The Hyprland project (hyprwm), along with the compositor                                                |
| Interfaces    | ScreenCast, Screenshot, GlobalShortcuts (mainly)                                                        |
| Toolkit       | Qt 6 (for the picker of what to share)                                                                  |
| Documentation | <https://wiki.hypr.land> (utilities section) and <https://wiki.archlinux.org/title/XDG_Desktop_Portal>   |
| Code          | <https://github.com/hyprwm/xdg-desktop-portal-hyprland>                                                 |

## xdg-desktop-portal-gnome

The Hyprland backend covers only a few interfaces, and the rest would have to be handled by someone else. `xdg-desktop-portal-gnome` is the GNOME project's backend: it uses GTK 4 and covers almost all portal interfaces (file picker, printing, accounts, notifications, settings like the light or dark theme, screenshot, and remote desktop), so it looks the same as the rest of the GTK applications in this guide. For capture and sharing it relies on the interfaces the GNOME desktop offers.

Niri uses it precisely for that reason: it implements those same interfaces, so monitor recording works through `xdg-desktop-portal-gnome`, and its Arch package declares it as a dependency. Niri also ships its own `niri-portals.conf`, which distributes the interfaces between this backend and the GTK one.

Installing both backends at once is the norm in this guide, and what keeps them from stepping on each other are those per-desktop files: when you start Hyprland, `XDG_CURRENT_DESKTOP` causes `hyprland-portals.conf` to be read, and when you start Niri, `niri-portals.conf` is read. The problem appears if no file exists for your desktop: without explicit configuration, the GNOME backend takes priority and may grab the screenshot on Hyprland, where it does not work. The solution is to pin it by hand, as above.

If you need to write your own file for Niri (the package already ships one, this is only an example of its shape):

```ini
[preferred]
default=gnome;gtk
org.freedesktop.impl.portal.Access=gtk
org.freedesktop.impl.portal.Notification=gtk
```

| Fact          | Detail                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Origin        | The GNOME project                                                                                    |
| Toolkit       | GTK 4                                                                                                |
| Interfaces    | Almost all: file picker, printing, accounts, settings, ScreenCast, Screenshot, RemoteDesktop…        |
| Documentation | <https://wiki.archlinux.org/title/XDG_Desktop_Portal>                                                |
| Code          | <https://gitlab.gnome.org/GNOME/xdg-desktop-portal-gnome>                                            |

To check that everything is in order, make sure the service is active and share your screen from a browser or a video call app:

```bash
systemctl --user status xdg-desktop-portal
busctl --user list | grep -i portal
```
