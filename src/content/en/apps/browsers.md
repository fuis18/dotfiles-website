---
title: "Browsers"
description: "Browsers: zen-browser, Helium, Epiphany, Mullvad Browser and Tor Browser."
category: apps
tags: ["zen-browser", "helium", "epiphany", "mullvad", "tor"]
---

The browser is the application you use the most and the one that knows the most about you, so choosing it is a privacy decision before an aesthetic one. This page walks through five browsers in increasing order of strictness: first the ones that improve daily use, then one integrated into the desktop, and finally those designed for a more serious threat model. They also cover three different engines (Gecko, Blink and WebKit), which matters because when almost everyone uses the same engine, whoever controls it decides how the web evolves.

## zen-browser

Firefox is the last mainstream browser with its own engine, but its interface, designed for the 2000s, feels rigid next to those of newer browsers like Arc: a horizontal row of tabs, no way to separate projects and no way to view two pages at once. Zen tries to fix that without leaving Firefox. It is a Firefox fork with the Gecko engine, first released in July 2024 (alpha version 1.0.0-a.1, on July 12) and created by Mauro (maubg) and a community of contributors, kept in sync with Firefox releases.

Its main features:

- **Vertical tabs and workspaces:** they group your tabs by project or topic, and each space can have its own pinned tabs.
- **Split view:** several pages tiled inside a single window.
- **Compact mode** that hides everything but the page, and _Mods_, themes that customize its appearance.
- **Firefox compatibility:** extensions from addons.mozilla.org (uBlock Origin, Bitwarden…) work the same, and profiles import without trouble.

It is the recommended daily-driver option in this guide. The cost is the same as any fork: it depends on its small team keeping up with Firefox, and its first stable release came after a long alpha stage.

| Fact                 | Detail                                                                 |
| -------------------- | ---------------------------------------------------------------------- |
| First release        | July 12, 2024 (1.0.0-a.1, alpha); version 1.19b in February 2026      |
| Authors              | Mauro (maubg) and the Zen Browser team                                |
| Engine and license   | Gecko (Firefox fork); MPL-2.0                                         |
| Documentation        | <https://docs.zen-browser.app>                                        |
| Code                 | <https://github.com/zen-browser/desktop>                              |
| Website              | <https://zen-browser.app>                                             |

**Installation.** Zen ships as a Flatpak (the profile lives inside the sandbox) or from the AUR:

```bash
sudo pacman -S flatpak
flatpak install flathub app.zen_browser.zen

# Or, from the AUR
paru -S zen-browser-bin
```

## Helium

When a site only works in Chrome, or an extension only exists for Chromium, a Firefox-based browser is not enough. But Chrome is a Google product, with telemetry, advertising and embedded services, and most of its forks share that engine with a different personality. Helium solves that with a clear bet: privacy by default, not by configuration. It is a Chromium-based desktop browser (building on the _ungoogled-chromium_ work), published by the imputnet team, with 0.x version numbering and active development.

What it ships with:

- **Built-in ad and tracker blocking**, with uBlock Origin and community filters, and fingerprinting protection enabled.
- **Zero web requests on first launch**, with no ads, trackers or analytics.
- **Chromium extension compatibility**, including MV2 (which Chrome dropped), and split view.
- **Native _bangs_** (`!w` for Wikipedia, `!gh` for GitHub) with over 13,000 shortcuts.

It is the complement to Zen for what requires a Blink engine. Keep in mind that it is still in 0.x versions, and that its dependence on Chromium means following that project's security patches.

| Fact               | Detail                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- |
| Origin             | imputnet project; first releases in 2025; 0.x series (0.12.4.1 in the AUR as of 2026)  |
| Engine and license | Chromium (based on _ungoogled-chromium_); GPL-3.0 and BSD-3-Clause                     |
| Code               | <https://github.com/imputnet/helium-linux>                                             |
| Documentation      | Website and release notes in the repository                                            |

**Installation.** From the AUR (the `-bin` package follows the stable branch; the test version is `helium-browser-beta-bin`):

```bash
paru -S helium-browser-bin
```

## Epiphany

The two previous browsers ship their own interfaces and their own libraries, separate from the rest of your desktop. Epiphany, today called _GNOME Web_, is the GNOME project's browser. It was born in 2002 as a fork of Galeon, an earlier GNOME browser, and has remained the desktop's simple, well-integrated browser ever since. It uses the WebKit engine (through WebKitGTK), the same as Safari, and a GTK4 interface with libadwaita (see [Ecosystem](./ecosystem.md)), so it looks and behaves like the other applications in this guide.

Its main features:

- **Lightweight and well integrated:** it shares the GTK libraries already installed and opens without dragging in an extra engine.
- **Basic privacy built in:** ad blocking and intelligent tracking prevention.
- **Web applications:** you can install a site as a standalone application that opens in its own window.
- **Firefox sync** for bookmarks, history and passwords.

Its limitation is the ecosystem: there are far fewer extensions than in Firefox or Chromium, and WebKitGTK has lower compatibility with some complex sites. It is a good choice for light use or web apps, and a bad one for daily work with extensions.

| Fact            | Detail                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| Origin          | 2002, fork of Galeon; the GNOME project's browser                               |
| Engine and toolkit | WebKit (WebKitGTK); GTK4 + libadwaita                                         |
| License         | GPL-3.0 or later                                                                |
| Documentation   | <https://wiki.gnome.org/Apps/Web> and <https://wiki.archlinux.org/title/GNOME/Web> |
| Code            | <https://gitlab.gnome.org/GNOME/epiphany>                                        |

**Installation.** It is in the official repositories. Add the GStreamer codecs so it can play video:

```bash
sudo pacman -S epiphany gst-plugins-good gst-libav
```

## Mullvad Browser and Tor Browser

So far, the protection is against commercial tracking: ads and trackers. There is another kind of tracking that is harder to avoid, _fingerprinting_: even if you block cookies, your browser reveals enough data (installed fonts, screen size, version, language) to identify you among millions. Most anti-fingerprinting tools randomize that data, which paradoxically makes you stand out. These two browsers take the opposite approach: make every user look the same.

Tor Browser has been doing this for years. It is developed by the Tor Project, a nonprofit organization, and is based on Firefox ESR: besides unifying the fingerprint, it sends all traffic through the Tor network, which relays it through several nodes to hide your IP address. The price is speed, which drops noticeably, and the fact that some sites block or limit connections from Tor.

Mullvad Browser was born on April 3, 2023 from a collaboration between Mullvad VPN and Tor Project engineers, and describes itself as Tor Browser without Tor. It has the same fingerprinting protection, but without the Tor network: it is designed to be used with a trusted VPN. It is based on Firefox ESR, ships with uBlock Origin and NoScript installed, opens in private mode by default and clears the session when you close it. The advantage is that it is faster than Tor; the disadvantage is that your anonymity depends on the VPN and on many people sharing the same fingerprint.

The rule of thumb: Tor Browser when you need real anonymity, Mullvad Browser when you need to avoid fingerprinting without losing speed, and neither as a daily browser, because they work best when used unmodified. Not even these browsers protect against your own mistakes, such as logging in with your personal account.

| Fact          | Mullvad Browser                                 | Tor Browser                                                  |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Origin        | April 3, 2023                                  | Tor Project (nonprofit organization)                         |
| Authors       | Tor Project engineers, with Mullvad VPN        | Tor Project                                                  |
| Base          | Firefox ESR; uBlock Origin and NoScript included | Firefox ESR; NoScript included                             |
| Network       | Your connection or VPN                         | Tor network (several nodes)                                  |
| Speed         | Normal                                          | Slower                                                       |
| License       | MPL-2.0                                         | MPL-2.0                                                      |
| Documentation | <https://mullvad.net/en/browser>               | <https://support.torproject.org>                             |
| Code          | <https://github.com/mullvad/mullvad-browser>   | <https://gitlab.torproject.org/tpo/applications/tor-browser> |

**Installation.** Tor Browser has an official installer in the repositories that downloads it and verifies its signature for you; Mullvad Browser is in the AUR or as a Flatpak:

```bash
# Tor Browser
sudo pacman -S torbrowser-launcher
torbrowser-launcher

# Mullvad Browser
paru -S mullvad-browser-bin
```
