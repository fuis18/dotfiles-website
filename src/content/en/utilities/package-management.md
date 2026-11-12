---
title: "Package Management"
description: "Package management: paru and the AUR."
category: utilities
tags: ["paru", "aur", "pacman"]
---

On Arch, `pacman` installs and updates everything in the official repositories quickly and predictably: binary packages compressed with `zstd` (see [Components Optimization](./components-optimization.md)), with a single command and dependencies resolved. But no official repository can contain all the software in the world. What falls outside (a new greeter, a theme, a freshly published desktop tool) lives in the AUR, and that is where `pacman` does not reach.

## paru

The AUR (_Arch User Repository_) does not store compiled programs, but recipes: each package is a `PKGBUILD`, a shell script describing where to download the code from and how to build it, which anyone can upload. Without help, installing something from the AUR means cloning its repository, reading the `PKGBUILD`, running `makepkg -si`, manually resolving the dependencies that are also in the AUR, and remembering to repeat the whole process to update it, because `pacman -Syu` never consults the AUR.

_AUR helpers_ automate that process. The best known is `yay`, written in Go by Jguer. In 2020, one of its two developers, Morganamilo, left the project and started his own: paru, written in Rust and based on `yay`'s design, with a difference in focus. A `PKGBUILD` is code that runs on your machine and the AUR does not audit it, so paru puts review at the center: it shows the `PKGBUILD` before building, refuses to run as root, and offers tools to inspect the package before installing it.

Its main traits are:

- **Prior review of the `PKGBUILD`**, with syntax highlighting if you have `bat`, and the option to open it in a file manager (`FileManager`) to edit it.
- **AUR comments in the terminal** (`paru -Gc package`), useful for seeing whether someone reported a problem before installing.
- **Build in an isolated environment** (`--chroot`), which avoids polluting the system with build dependencies.
- **Identical interface to `pacman`:** paru works as a wrapper, so `paru -Syu` updates official and AUR packages at once.

Since paru ends up installing with `pacman`, `snap-pac`'s automatic snapshots (see [Mounts](./mounts.md)) also cover AUR packages. And since many `PKGBUILD`s ship `systemd` units, on Artix and Obarun you have to look for the equivalent service for your init (see [PID](./pid.md)).

The project's status deserves an honest warning: as reported in 2026, paru has been on a slow maintenance pace. Its latest stable version (2.1.0) is from July 2025 and, when `pacman` bumped the `libalpm` version in late 2025, the precompiled binary package (`paru-bin`) stopped working, while rebuilding it from source (the `paru` package) did fix it. That is why this guide installs `paru` compiled on your machine, not the `-bin`. If it fails later and is not fixed, `yay` is still active (its version 13 came out in June 2026) and the syntax is almost identical.

| Fact                | Detail                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Creation            | Repository created in August 2020; version 1.0.0 in 2020, when its author announced he was leaving `yay` |
| Author              | Morganamilo (formerly, `yay`'s second developer)                                                    |
| Language and license | Rust; GPL-3.0                                                                                     |
| Latest version      | 2.1.0 (July 2025)                                                              |
| Documentation       | <https://github.com/Morganamilo/paru> and <https://wiki.archlinux.org/title/AUR_helpers>            |
| Code                | <https://github.com/Morganamilo/paru>                                                              |
| AUR                 | <https://aur.archlinux.org> and <https://wiki.archlinux.org/title/Arch_User_Repository>             |
| Alternative         | `yay`: <https://github.com/Jguer/yay>                                                              |

**Installation.** Paru is in the AUR, so the first time you build it by hand (as a normal user, not as root):

```bash
sudo pacman -S --needed base-devel git
git clone https://aur.archlinux.org/paru.git
cd paru
makepkg -si
```

Daily use:

```bash
paru                    # update official and AUR (equivalent to -Syu)
paru -S package         # install
paru -Ss text           # search
paru -Sua               # update the AUR only
paru -Gp package        # view the PKGBUILD without installing
paru -Gc package        # read the AUR comments
paru -c                 # remove orphan dependencies
paru -Qm                # list packages that are not from the official repositories
```

A useful configuration in `/etc/paru.conf` (uncomment the options you want):

```ini
[options]
BottomUp    # show results with the most relevant at the bottom
SudoLoop    # keep sudo active during long builds
Devel       # check for -git package updates
```
