---
title: "Browsers"
description: "Browsers: zen-browser, Helium, Epiphany, Brave, Mullvad Browser and Tor Browser."
category: apps
tags: ["tor", "brave", "zen-browser", "helium", "epiphany", "mullvad"]
---

The browser is the app you use the most and the one that knows the most about you, so picking one is a privacy decision before it is an aesthetic one.

## Chrome and Firefox: the two poles

Netscape Navigator, the dominant browser of the nineties, watched its reign decline until Mozilla released its source code in 1998, after losing the commercial battle against Internet Explorer. Mozilla Suite, a heavy suite of applications, came out of that code and led Dave Hyatt and Blake Ross to start the Phoenix project inside Mozilla in 2002: a standalone browser, focused purely on browsing and lightweight. After several naming conflicts that had it temporarily called Firebird, the browser was finally named Firefox and shipped version 1.0 on November 9, 2004, under the aegis of the Mozilla Foundation (created in 2003 with Mitchell Baker at the helm) and the Mozilla Corporation (founded in 2005 to develop and commercialize it through search engine deals).

Against that backdrop of Internet Explorer dominance, Google burst into the market in September 2008 by announcing its own browser through a comic illustrated by Scott McCloud, published a day before the launch. Behind the project stood Lars Bak, the Danish engineer who created the V8 JavaScript virtual machine, and Linus Upson. In its early days, Chrome used Safari's WebKit rendering engine, until in 2013 Google decided to fork it and create its own engine, Blink.

Firefox's engine, Gecko, went through two major technical rewrites to stay competitive against Chrome: **Electrolysis** (2015-2016), which introduced the multiprocess architecture by splitting tabs into independent processes, and **Quantum** (Firefox 57, November 2017), which integrated technology from the Servo research project —written in the Rust language— to multiply its speed dramatically.

Out of that evolution, Firefox left two fronts open: an interface inherited from the 2000s and a privacy stance that falls short against advanced threats. Chrome, for its part, struck an even deeper bargain: to be a product native to Google's ecosystem, with telemetry, advertising and integrated services that the user accepts in exchange for its engine's performance.

## Tor Browser (~2011)

There is a kind of tracking harder to avoid than ads: _fingerprinting_. Even if you block cookies, your browser reveals enough data (installed fonts, screen size, version, language) to identify you among millions. Most anti-fingerprinting tools randomize that data, which paradoxically makes you stand out. Tor Browser applies the opposite strategy: make every user look like the same one.

It is developed by the Tor Project, a nonprofit that has maintained the Tor network since the nineties, and it began packaging it with Firefox as the Tor Browser Bundle around 2011. It is based on Firefox ESR: besides normalizing the fingerprint, it sends all traffic through the Tor network, which relays it across several nodes to hide your IP address. The price is speed, which drops noticeably, and that some sites block or throttle connections coming from Tor.

It is not a daily driver: it is a tool for real anonymity when the threat justifies it, and it works best when left unmodified. Not even it protects you from your own mistakes, such as logging in with your personal account.

| Fact          | Detail                                                       |
| ------------- | ------------------------------------------------------------ |
| First release | Tor Browser Bundle, around 2011                              |
| Authors       | Tor Project (nonprofit)                                      |
| Base          | Firefox ESR; NoScript included                               |
| Network       | Tor network (several nodes)                                  |
| Speed         | Slower                                                       |
| License       | MPL-2.0                                                      |
| Documentation | <https://support.torproject.org>                             |
| Code          | <https://gitlab.torproject.org/tpo/applications/tor-browser> |

**Installation.** There is an official installer in the repositories that downloads it and verifies its signature for you:

```bash
sudo pacman -S torbrowser-launcher
torbrowser-launcher
```

## Brave (2016–2019)

The opposite problem from Tor: not extreme anonymity, but Chromium's everyday telemetry. Anyone who needed Blink was tied to a Google product that tracks, syncs with an account and fills the new tab page with advertising. It was founded in 2015 by **Brendan Eich**, co-author of JavaScript at Netscape and co-founder and short-lived CEO of Mozilla —he left the corporation after internal controversies—, together with Brian Bondy, also a former Mozilla employee. Its first public beta shipped on January 20, 2016, and version 1.0 on November 13, 2019, already with blocking on by default and private windows with Tor.

Its proposal is to block ads and trackers by default, with no extension or setup, and to fund the web through a rewards system (Basic Attention Token, BAT) shared between users and sites. It is a controversial model: some see it as monetizing browsing without selling data, others criticize putting cryptocurrencies and affiliate programs into a browser. Technically it is a hardened Chromium, without Google's telemetry but with Chrome Web Store extension compatibility. It is the practical choice when you need Blink every day with privacy by default, without going through uBlock Origin and manual tweaks.

| Fact               | Detail                                            |
| ------------------ | ------------------------------------------------- |
| First release      | January 20, 2016 (beta); 1.0 on November 13, 2019 |
| Authors            | Brendan Eich and Brian Bondy                      |
| Engine and license | Blink (based on Chromium); MPL-2.0                |
| Documentation      | <https://support.brave.com>                       |
| Code               | <https://github.com/brave/brave-core>             |

**Installation.** From the AUR:

```bash
paru -S brave-bin
```

## Epiphany (2002)

Epiphany, known today as _GNOME Web_, is the GNOME project's browser. It was born in 2002 as a fork of Galeon, an earlier GNOME browser, and has since stayed the desktop's simple, well-integrated browser. It uses the WebKit engine (through WebKitGTK), the same as Safari, and a GTK4 interface with libadwaita (see [Ecosystem](./ecosystem/)), so it looks and behaves like the other applications in this guide.

Its key features:

- **Lightweight and well integrated:** it shares the GTK libraries already installed and opens without dragging in an extra engine.
- **Basic privacy included:** ad blocking and intelligent tracking prevention.
- **Web apps:** lets you install a site as a standalone application that opens in its own window.
- **Firefox sync** for bookmarks, history and passwords.

Its limitation is the ecosystem: far fewer extensions than Firefox or Chromium, and WebKitGTK has weaker compatibility with some complex sites. It is a good choice for light use or for web apps, and a bad one for daily work with extensions.

| Fact               | Detail                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| Origin             | 2002, fork of Galeon; the GNOME project's browser                                  |
| Engine and toolkit | WebKit (WebKitGTK); GTK4 + libadwaita                                              |
| License            | GPL-3.0 or later                                                                   |
| Documentation      | <https://wiki.gnome.org/Apps/Web> and <https://wiki.archlinux.org/title/GNOME/Web> |
| Code               | <https://gitlab.gnome.org/GNOME/epiphany>                                          |

**Installation.** It is in the official repositories. Add the GStreamer codecs so it can play video:

```bash
sudo pacman -S epiphany gst-plugins-good gst-libav
```

## Mullvad Browser (April 3, 2023)

Tor Browser solved fingerprinting, but at the cost of the Tor network: too slow for anything beyond occasional sessions. The question the next fork tackles is whether you can have the same standardized fingerprint without sacrificing speed. The answer arrived on April 3, 2023 from the collaboration between Mullvad VPN, known for its no-logs policy, and Tor Project engineers, and it is described bluntly as Tor Browser without Tor.

It has the same protection against fingerprinting, but without the Tor network: it is meant to be used with a trusted VPN. It is based on Firefox ESR, ships with uBlock Origin and NoScript installed, opens in private mode by default and wipes the session on close. The advantage is that it is faster than Tor; the disadvantage is that your anonymity depends on the VPN and on many people sharing the same fingerprint. Like Tor, it is not a daily driver, but for when you need to avoid fingerprinting without losing speed.

| Fact          | Detail                                           |
| ------------- | ------------------------------------------------ |
| First release | April 3, 2023                                    |
| Authors       | Tor Project engineers, with Mullvad VPN          |
| Base          | Firefox ESR; uBlock Origin and NoScript included |
| Network       | Your connection or VPN                           |
| Speed         | Normal                                           |
| License       | MPL-2.0                                          |
| Documentation | <https://mullvad.net/en/browser>                 |
| Code          | <https://github.com/mullvad/mullvad-browser>     |

**Installation.** From the AUR or as a Flatpak:

```bash
paru -S mullvad-browser-bin
```

## Zen Browser (July 12, 2024)

Firefox has the engine, the privacy and the extensions, but its interface, designed for the 2000s, feels rigid next to newer browsers like Arc: a single horizontal row of tabs, no way to separate projects and no way to see two pages at once. Zen tries to fix that without leaving Firefox. It is a Firefox fork with the Gecko engine, first released in July 2024 (alpha version 1.0.0-a.1, on July 12) and created by Mauro (maubg) and a community of contributors, and it stays in sync with Firefox releases.

Its key features:

- **Vertical tabs and workspaces:** split your tabs by project or topic, and each workspace can have its own pinned tabs.
- **Split view:** several pages tiled inside a single window.
- **Compact mode** that hides everything but the page, and _Mods_, themes that customize its appearance.
- **Firefox compatibility:** extensions from addons.mozilla.org (uBlock Origin, Bitwarden…) work the same, and profiles import without trouble.

It is the recommended daily driver in this guide. The cost is the same as any fork: it depends on its small team keeping pace with Firefox, and its first stable release came after a long alpha stage.

| Fact               | Detail                                                           |
| ------------------ | ---------------------------------------------------------------- |
| First release      | July 12, 2024 (1.0.0-a.1, alpha); version 1.19b in February 2026 |
| Authors            | Mauro (maubg) and the Zen Browser team                           |
| Engine and license | Gecko (Firefox fork); MPL-2.0                                    |
| Documentation      | <https://docs.zen-browser.app>                                   |
| Code               | <https://github.com/zen-browser/desktop>                         |
| Website            | <https://zen-browser.app>                                        |

**Installation.** Zen ships as a Flatpak (the profile stays inside the sandbox) or from the AUR:

```bash
sudo pacman -S flatpak
flatpak install flathub app.zen_browser.zen

# Or, from the AUR
paru -S zen-browser-bin
```

## Helium (2025)

When a site works only in Chrome, or an extension only exists for Chromium, a Firefox-based browser is not enough. But Chrome is a Google product, with telemetry, advertising and embedded services, and most of its forks share that engine with a different personality. Helium solves that with a clear bet: privacy by default, not by configuration. It is a Chromium-based desktop browser (built on the work of _ungoogled-chromium_), released by the imputnet team, versioned as 0.x and under active development.

What it ships with:

- **Ad and tracker blocking built in**, with uBlock Origin and community filter lists, and fingerprinting protection enabled.
- **Zero web requests on first launch**, with no ads, trackers or analytics.
- **Chromium extension compatibility**, including MV2 (which Chrome no longer supports), and split view.
- **Native _bangs_** (`!w` for Wikipedia, `!gh` for GitHub) with more than 13,000 shortcuts.

It is the complement to Zen for anything that requires a Blink engine. Keep in mind that it is still on 0.x versions, and that its reliance on Chromium means tracking that project's security patches.

| Fact               | Detail                                                                                |
| ------------------ | ------------------------------------------------------------------------------------- |
| Origin             | imputnet project; first releases in 2025; 0.x series (0.12.4.1 in the AUR as of 2026) |
| Engine and license | Chromium (based on _ungoogled-chromium_); GPL-3.0 and BSD-3-Clause                    |
| Code               | <https://github.com/imputnet/helium-linux>                                            |
| Documentation      | Site and release notes in the repository                                              |

**Installation.** From the AUR (the `-bin` package follows the stable branch; the testing version is `helium-browser-beta-bin`):

```bash
paru -S helium-browser-bin
```
