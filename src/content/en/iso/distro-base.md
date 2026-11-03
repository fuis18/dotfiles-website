---
title: "Base Distro"
description: "Choice of the base system: CachyOS, ArchLinux, Artix and Obarun."
category: iso
tags: ["cachyos", "archlinux", "artix", "obarun"]
---

I believe that offering a system that works "out of the box" (ready to use) is a big step toward getting more people into Linux, but it should not be our slogan. But as different people we have preferences, and as humanity and natural persons we also deserve our work tool to improve; for that we must evolve our system, and therefore understand how to improve it.

## ArchLinux

In Linux's early days, distributions came preconfigured: a few people decided what got installed, which services ran and when updates happened, and those decisions piled up as layers that are hard to understand. With a system whose contents you do not know, debugging and optimizing turn into guesswork. In response, **ArchLinux** was born out of the need for a simple, transparent system, with no decisions made for you: you install the minimum and build the rest.

**How it solves it.**

- KISS philosophy: you install only `base` and build the rest piece by piece, so you know what is in your system.
- Rolling release: a single continuous stream of updates, with no major version jumps.
- Packages as close as possible to the original (_upstream_) code, with minimal patches.
- ArchWiki, probably the best Linux documentation there is, useful even if you use another distro.
- AUR for everything that is not in the official repositories.

A rolling release means an update can break something; that is why the [Mounts](./mounts.md) section recommends Btrfs with snapshots so you can roll back.

| Fact          | Details                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| First release | 2002                                                                     |
| Authors       | Judd Vinet (creator); Aaron Griffin led the project from October 1, 2007 |
| Documentation | <https://wiki.archlinux.org/title/Installation_guide>                    |
| Source        | <https://gitlab.archlinux.org/archlinux>                                 |
| Website       | <https://archlinux.org>                                                  |

**Installation.**

Guided, from the live ISO:

```bash
archinstall
```

Manual (installs the minimal base from the ISO's chroot):

```bash
pacstrap -K /mnt base linux-zen linux-zen-firmware
```

CachyOS, Artix and Obarun inherit `pacman`, the AUR and the wiki from here. Understanding Arch means understanding the four bases, and their limits (generic performance, mandatory `systemd`) explain why the other three exist.

## CachyOS

Arch gave control back to the user, but it did so with generic binaries: almost every distro compiles its packages for the lowest common denominator of x86-64, so your CPU's modern instructions (AVX2, AVX-512) go unused, and the generic kernel prioritizes compatibility over desktop responsiveness. **CachyOS** carried the optimization very well (binaries for your CPU, kernel with its own schedulers), while staying friendly to the average user thanks to its graphical installer.

**How it solves it.**

- Repositories optimized by microarchitecture level (`x86-64-v3`, `x86-64-v4` and variants for Zen 4/5) with an installer that detects your CPU.
- Its own kernel with scheduler patches (BORE by default, EEVDF variant) and support for `sched_ext` (`scx`), plus variants like `linux-cachyos-deckify` for handhelds.
- PGO/LTO builds on high-impact packages (for example Python, according to their June 2026 release).
- Graphical installer with a choice of bootloader (`systemd-boot`, GRUB, rEFInd, Limine) and desktop, including a Hyprland option.

It is still Arch underneath (same `pacman`, same AUR), so you do not lose the ecosystem. But with its repositories added for your hardware and its kernel.

| Fact          | Details                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| First release | 2021 (stable releases since late 2022)                                  |
| Authors       | Peter Jung (`ptr1337`) and Vladislav Nepogodin (`vnepogodin`), founders |
| License       | Free software (GPL and others)                                          |
| Documentation | <https://wiki.cachyos.org>                                              |
| GitHub        | <https://github.com/CachyOS>                                            |
| Website       | <https://cachyos.org>                                                   |

**Installation.**

From the ISO: download the image from <https://cachyos.org/download>, boot the live USB and run the graphical installer.

On an already installed Arch (optimized repositories only):

```bash
curl https://mirror.cachyos.org/cachyos-repo.tar.xz -o cachyos-repo.tar.xz
tar xvf cachyos-repo.tar.xz && cd cachyos-repo
sudo ./cachyos-repo.sh
```

## Artix

CachyOS optimized the system, but it inherited from Arch a decision that cannot be changed: `systemd` is the only possible init, and other components (for example, complete desktop environments) depend on it ever more. With the birth and adoption of `systemd` (see [PID](./pid.md)), Arch stopped offering init alternatives, and if you prefer a smaller one or a different service model, you cannot have it without fighting the system. Artix was born in 2017 to give that freedom back.

**How it solves it.** Artix keeps the Arch base (`pacman`, rolling release, KISS philosophy) but without `systemd`, and lets you choose between **OpenRC**, **runit**, **s6** and **dinit**. It has its own repositories, with packages adapted to each init, and can use Arch's repositories through the compatibility package (`artix-archlinux-support`). For what `systemd` used to provide (sessions, seat management), `elogind` is used.

It is the pragmatic option: you keep almost the entire Arch ecosystem and regain init freedom. The drawback is that some packages assume `systemd` and require alternatives, which is addressed in [PID](./pid.md).

| Fact            | Details                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| Created         | 2017, merger of the Arch OpenRC and Manjaro OpenRC projects (started in 2012) |
| Authors         | Artix team (core team and developers)                                         |
| Available inits | OpenRC, runit, s6, dinit                                                      |
| Documentation   | <https://wiki.artixlinux.org>                                                 |
| Source          | <https://gitea.artixlinux.org/artix>                                          |
| Website         | <https://artixlinux.org>                                                      |

**Installation.** Boot the ISO of your chosen init and, instead of `pacstrap`, use `basestrap`:

```bash
# Example with s6
basestrap /mnt base base-devel openrc elogind-openrc linux-zen linux-zen-firmware
fstabgen -U /mnt >> /mnt/etc/fstab
artix-chroot /mnt
```

## Obarun

Artix gave back the freedom to choose an init, but replacing `systemd` with another is not enough if the new one is still a set of scripts that are hard to supervise or compose: traditional inits (SysV, and partly OpenRC) start services but do not watch them reliably, and managing dependencies between them is usually fragile. That is why **Obarun** focused on `s6`, which offers small and reliable process supervision, and created `66` because `s6` and `s6-rc` are low-level tools that needed a declarative service layer on top.

Obarun is based on Arch and replaces `systemd` with `s6` (Skarnet's supervision suite) plus `66`, its own service manager built on `s6`/`s6-rc`. Services are described in declarative files, the tool resolves the dependency tree, and every process ends up supervised. `66` is Obarun's work and also works outside it, on other Unix systems.

It is the base closest to the ideal of transparency this documentation pursues, but the least conventional: its own team describes it as not intended for beginners and its community is smaller. It closes the thread toward [PID](./pid.md), where `s6` and `66` are explained in detail.

| Fact          | Details                                                                              |
| ------------- | ------------------------------------------------------------------------------------ |
| Origin        | Project based on Arch, active since at least 2015; `s6`/`66` as the base since ~2017 |
| Author        | Eric Vidal                                                                           |
| Name          | From _OpenBox Arch RUNit_, although today it uses `s6` instead of `runit`            |
| Documentation | <https://wiki.obarun.org>                                                            |
| Source        | <https://git.obarun.org/Obarun> (`66` tool: <https://git.obarun.org/Obarun/66>)      |
| Website       | <https://web.obarun.org>                                                             |

**Installation.** Download the ISO from <https://web.obarun.org>, boot the live USB and follow the included installer. After the first boot, update the system:

```bash
pacman -Syu
```

## The best distribution

But none of them put all the pieces together. CachyOS optimizes, though it keeps `systemd`. Artix and Obarun free the init, but without that optimization work, and only Obarun bets on declarative services with `s6` and `66`. None combines performance, init freedom and transparency in a single system, and that is where this documentation starts.
