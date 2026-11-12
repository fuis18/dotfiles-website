---
title: "Kernel and Initramfs"
description: "Kernel variants, initramfs generators (mkinitcpio, dracut) and UKI."
category: iso
tags: ["kernel", "dracut", "uki", "sbctl"]
---

The bootloader (see [Bootloader](./bootloader.md)) finds the kernel, loads it into memory and passes it control along with some parameters. But then a problem appears that the kernel itself cannot solve: to read your disk it needs your NVMe driver, the Btrfs support or the encrypted container, and many of those elements are modules that live inside the root to which it still has no access. The initramfs breaks that circle, and the Unified Kernel Image (UKI) solves the last loose end: that none of that chain can be tampered with without the firmware noticing.

## Kernel: what it is and which variants exist

The kernel is the core of the system: the program that talks to the hardware, distributes processor time, manages memory and exposes a uniform interface to programs for doing all of that. Linux was born in 1991 as a personal project of Linus Torvalds, who announced version 0.01 that September and published 1.0 in March 1994. It is a monolithic kernel with modules: the central core is loaded all at once, and the drivers that are not always needed (Wi-Fi, filesystems, sound cards) are loaded and unloaded on the fly as needed.

Arch does not ship a single kernel, but several in its official repositories, each one designed for a use:

| Package          | What it is                                                                    | Who it is for                                          |
| ---------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| `linux`          | The vanilla kernel, without added patches                                     | Whoever wants exactly what the Linux project publishes |
| `linux-lts`      | Long-term support branch, with fewer changes and more testing                 | Servers and whoever prioritizes stability              |
| `linux-zen`      | Patches aimed at desktop responsiveness, maintained by the Zen Kernel project | Everyday machines                                      |
| `linux-hardened` | Security hardening, with extra mitigations and restrictions                   | Whoever prioritizes security over performance          |
| `linux-cachyos`  | CachyOS's own kernel, with additional schedulers                              | CachyOS users (see [Distro Base](./distro-base.md))    |

This guide uses **`linux-zen`** as the main kernel and leaves **`linux-lts`** installed as a fallback. The reason is concrete: in a rolling release distribution, a kernel update can break the boot or a driver. If that happens, you choose the LTS entry in the bootloader menu and the system keeps running with the previous version. It is a cheap safety net —it takes up a few hundred megabytes— that complements the snapshots of [Mounts](./mounts.md).

Three practical details worth being clear about:

- **The headers** (`linux-zen-headers`, `linux-lts-headers`) are needed to compile external modules through DKMS, such as the proprietary NVIDIA drivers. Without them, the module is not rebuilt when the kernel is updated.
- **The firmware is a single package**, `linux-firmware`, shared by all kernels. There are no variants per kernel: they are the files that the hardware itself needs to work, and they are installed once.
- **The processor microcode** (`intel-ucode` or `amd-ucode`) is loaded as the **first** `initrd` in each bootloader entry, before the initramfs. It fixes processor errata from boot, and that is why it goes first.

| Data          | Detail                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| Origin        | Linux 0.01 announced in September 1991; version 1.0 in March 1994           |
| Author        | Linus Torvalds and the kernel community                                     |
| License       | GPL-2.0                                                                     |
| Arch variants | `linux`, `linux-lts`, `linux-zen`, `linux-hardened` (official repositories) |
| Firmware      | `linux-firmware` (shared by all kernels)                                    |
| Microcode     | `intel-ucode` or `amd-ucode`, as the first `initrd`                         |
| Documentation | <https://wiki.archlinux.org/title/Kernel> and <https://docs.kernel.org>     |
| Zen Kernel    | <https://github.com/zen-kernel/zen-kernel>                                  |

**Installation.**

```bash
pacman -S linux-zen linux-zen-headers linux-lts linux-lts-headers linux-firmware
```

## initramfs: the temporary filesystem

The kernel has just been loaded and does not know how to read your disk: the driver of your NVMe, the Btrfs support or the encrypted container can be modules that are inside the root to which it still has no access. The initramfs solves that circle: it is a small filesystem that the bootloader loads into RAM along with the kernel, with the modules and scripts needed to unlock and mount the root, and which then hands control over to the real system.

The idea is not new. **initrd** appeared in Linux 1.1 (1994) and stabilized in 1.2 (1995): a compressed disk image that the kernel mounted as a block device, which forced you to size it, to format it and to coexist with a fixed-size filesystem. **initramfs** replaced it with something simpler: a compressed file in `cpio` format that the kernel decompresses directly into a `tmpfs` instance, with no block device, no formatting and with whatever size it needs. It arrived in the 2.5 development series (late 2002) and stabilized in 2.6.10 (December 2004). Part of the work came from **klibc**, a minimal C library created by H. Peter Anvin in order to write the boot programs without dragging in all of glibc. Since then, every initramfs generator works on this model.

On Arch it is generated by **`mkinitcpio`**, which builds the image from a list of _hooks_ in `/etc/mkinitcpio.conf`. Each hook adds a specific function to the boot:

| Hook                 | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `base`               | Installs the minimal skeleton and the `init` script           |
| `udev`               | Detects the hardware and loads the modules that are needed    |
| `microcode`          | Includes the processor microcode in the image                 |
| `keyboard`, `keymap` | Keyboard available at boot (needed to type the LUKS password) |
| `block`              | Disk drivers (NVMe, SATA, USB)                                |
| `encrypt`            | Unlocks the LUKS container                                    |
| `filesystems`        | Adds the filesystem support of the root                       |
| `fsck`               | Checks the filesystem before mounting it                      |

There are **two families of hooks that do not mix**. The classic one, based on BusyBox, uses `udev` and `encrypt`; the one based on systemd uses `systemd` and `sd-encrypt`. Choosing one and sticking to it matters: combining hooks from both produces images that do not boot or that behave unpredictably. **dracut**, created by Harald Hoyer at Red Hat (first version in July 2009), is the alternative, with a modular design based on systemd but agnostic to the init of the final system.

This leaves a problem that none of the pieces above solves. The kernel, the initramfs and the parameters are loose files on the ESP, which is not encrypted, and anyone with physical access can change them. The firmware's Secure Boot only checks signatures of EFI programs, and a kernel with its initramfs separately is not one. The Unified Kernel Image (UKI) fixes that, and I detail it below.

The practical consequence is simple: if you do not encrypt the disk, a normal initramfs is enough. If you do encrypt it (see [Disk Encryption](./encryption.md)), the UKI is the way to protect the boot as well.

### mkinitcpio vs dracut: two philosophies

Both generate an initramfs, but with different approaches. **mkinitcpio** is the "official" generator of Arch, created by the Arch team in 2006 as a replacement for `geninitcpio`. It is lightweight, modular and configurable via hooks. It has one peculiarity: if the `HOOKS` array includes `systemd`, it generates an initramfs based on systemd (with systemd services instead of shell hooks); if it does not include it, it generates an initramfs based on BusyBox (with ash scripts). They are two different initramfs images, not one image with options.

**dracut** is more generic: designed to work on any distribution, it automatically detects which modules it needs based on the kernel parameters and the loaded modules. It is "more opinionated", but also more robust in certain scenarios, especially with UKI and Secure Boot. It does not depend on systemd to work, although systemd components can be included in the initramfs if required. Instead of hooks it uses **modules** that are added or removed with `--add` and `--omit`, and its configuration lives in `/etc/dracut.conf.d/`. It is the default generator of Fedora, RHEL and openSUSE and, after the transition started with Ubuntu 25.10 and consolidated in 26.04 LTS, also of Ubuntu (which had been using `initramfs-tools`). Since October 2021, after Hoyer's departure from Red Hat, it is maintained by the community.

| Data          | mkinitcpio                                                             | dracut                                                                      |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Origin        | Arch Linux project; written in Bash, hook-based                        | July 2009, by Harald Hoyer and others (Red Hat); module-based               |
| Maintenance   | Arch Linux team                                                        | Community since October 2021                                                |
| Configuration | `/etc/mkinitcpio.conf` (list of `HOOKS`)                               | `/etc/dracut.conf.d/*.conf` (`--add`, `--omit`)                             |
| Hook family   | - BusyBox (`udev`, `encrypt`)<br />- systemd (`systemd`, `sd-encrypt`) | Modular design based on systemd and udev                                    |
| Adoption      | Arch, EndeavourOS, Manjaro, CachyOS, Garuda                            | Fedora, RHEL, openSUSE, Ubuntu (plan announced in February 2025)            |
| License       | GPL-2.0                                                                | GPL-2.0 or later (LGPL-2.1+ parts)                                          |
| Documentation | <https://wiki.archlinux.org/title/Mkinitcpio>                          | <https://dracut-ng.github.io> and <https://wiki.archlinux.org/title/Dracut> |
| Code          | <https://gitlab.archlinux.org/archlinux/mkinitcpio/mkinitcpio>         | <https://github.com/dracut-ng/dracut-ng>                                    |

### mkinitcpio with classic hooks (BusyBox)

It is the default option of Arch. It does not include systemd in the initramfs, uses shell scripts and is easier to debug because the hooks run sequentially.

```bash
# /etc/mkinitcpio.conf
MODULES=()
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt filesystems fsck)
COMPRESSION="zstd"
```

Regenerate with:

```bash
mkinitcpio -P
```

Without encryption, the default hooks are left without `encrypt`:

```bash
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block filesystems fsck)
```

If you encrypt the disk, `encrypt` is added before `filesystems`, and `keyboard` and `keymap` stop being optional, because you have to be able to type the password before the system exists.

### dracut

It is more modular and automated. It automatically detects which modules it needs based on the kernel and the boot parameters.

```bash
sudo pacman -S dracut
```

```bash
# /etc/dracut.conf.d/custom.conf
add_dracutmodules+=" base udev kmod dm crypt lvm btrfs "
omit_dracutmodules+=" systemd "
hostonly="yes"
compress="zstd"
```

The `omit_dracutmodules+=" systemd "` option is key if you do not want systemd in the initramfs. You can also omit specific modules according to your needs. Regenerate with:

```bash
sudo dracut --force --regenerate-all
```

To test it without touching the global configuration, generate the image indicating the kernel:

```bash
sudo dracut --force --hostonly /boot/initramfs-linux-zen.img
```

### Automatic hook for kernel updates

Whichever generator you choose, you need the initramfs to regenerate automatically after a kernel update. Create a pacman hook:

```ini
# /etc/pacman.d/hooks/90-initramfs.hook
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = linux
Target = linux-lts
Target = linux-zen
Target = linux-hardened

[Action]
Description = Regenerating initramfs...
When = PostTransaction
# For mkinitcpio
Exec = /usr/bin/mkinitcpio -P
# For dracut, comment out the previous one and uncomment this:
# Exec = /usr/bin/dracut --force --regenerate-all
```

## UKI: the Unified Kernel Image

There remains a problem that none of the pieces above solves. The kernel, the initramfs and the boot parameters are **loose files** on the ESP, which is not encrypted, and anyone with physical access can replace them. The firmware's Secure Boot (see [Firmware](./firmware.md)) only checks signatures of EFI programs, and a kernel with its initramfs separately is not one: there is nothing to sign as a whole.

The **Unified Kernel Image** (UKI, _Unified Kernel Image_) fixes that. Defined by the UAPI group, it is a **single EFI file** that packages the kernel, the initramfs, the microcode and the boot parameters into its own `.cmdline` section. Since it is a single file, it can be signed in full, and the firmware verifies the signature before executing it. `systemd-boot` detects them on its own in `EFI/Linux/`, with no need for `.conf` entries.

The effect is that the boot chain is closed: firmware → signed bootloader → signed UKI → system. With your own Secure Boot keys, any change in any of those links prevents the boot, which also protects against an attack with physical access to the machine.

The cost is that setting up your own Secure Boot keys is a manual process that varies depending on the firmware, and it has to be repeated for every file that changes. The `sbctl` hook automates it on every kernel update.

| Data          | mkinitcpio                                                     | UKI                                                                 |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| What it is    | Arch's initramfs generator, with hooks                         | An EFI file with kernel, initramfs, microcode and parameters        |
| Defined by    | Arch Linux project                                             | UAPI group (<https://uapi-group.org>)                               |
| Detection     | —                                                              | `systemd-boot` detects them in `EFI/Linux/`                         |
| Signing       | —                                                              | `sbctl` (automatic hook on every kernel update)                     |
| Documentation | <https://wiki.archlinux.org/title/Mkinitcpio>                  | <https://uapi-group.org/specifications/specs/unified_kernel_image/> |
| Code          | <https://gitlab.archlinux.org/archlinux/mkinitcpio/mkinitcpio> | <https://github.com/Foxboron/sbctl> (signing)                       |

### With mkinitcpio + ukify

`ukify` is a systemd tool that packages the components into a UKI; Arch offers it as the `systemd-ukify` package. To switch to a UKI, tell `mkinitcpio` to generate the image on the ESP and store the boot parameters in `/etc/kernel/cmdline`:

```bash
# /etc/kernel/cmdline (single line, no line breaks)
root=UUID=YOUR_UUID rootflags=subvol=@ rw
```

```bash
# /etc/mkinitcpio.d/linux-zen.preset
ALL_kver="/boot/vmlinuz-linux-zen"
PRESETS=('default')
default_uki="/boot/EFI/Linux/arch-linux-zen.efi"
```

```bash
sudo pacman -S systemd-ukify
mkinitcpio -P
```

### With dracut

dracut has native support for UKI with the `--uefi` option:

```bash
sudo dracut --uefi --force /boot/EFI/Linux/arch-linux-zen.efi
```

It automatically detects the kernel, the initramfs and the parameters based on the kernel being used.

### Secure Boot with sbctl

To sign the UKIs (or the boot files separately) with your own keys, `sbctl` creates them, registers them in the firmware (which must be in **Setup Mode**, the state without an installed `PK` described in [Firmware](./firmware.md)) and signs the boot files:

```bash
sudo pacman -S sbctl
sudo sbctl status
sudo sbctl create-keys
sudo sbctl enroll-keys -m
sudo sbctl sign -s /boot/EFI/Linux/arch-linux-zen.efi
sudo sbctl sign -s /boot/EFI/systemd/systemd-bootx64.efi
sudo sbctl sign -s /boot/EFI/BOOT/BOOTX64.EFI
sudo sbctl verify
```

The `-m` option also keeps Microsoft's keys, which on many machines are needed for the graphics card firmware to boot. Do it first on a UEFI virtual machine: a mistake in this step can leave the machine unable to boot.
