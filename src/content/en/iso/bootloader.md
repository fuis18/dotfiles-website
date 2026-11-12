---
title: "Bootloader"
description: "Boot managers: GRUB, systemd-boot and Limine."
category: iso
tags: ["grub", "systemd-boot", "limine"]
---

When you power on the machine, the firmware (BIOS or UEFI) only knows how to do one thing: load a small program from the disk. That program, the bootloader, has to find the kernel and the initramfs, pass them some parameters, and hand over control. This decision is irreversible once installed: changing bootloader requires reinstalling and reconfiguring the whole boot.

## GRUB: the versatile classic

The earliest Linux bootloaders, such as **LILO** (1992, by Werner Almesberger), stored the physical location on disk of the kernel blocks. Every time you updated the kernel you had to run `lilo` again, and forgetting left the system unbootable. **GRUB** fixed that by understanding filesystems: it reads the disk, finds the kernel by its path, and all you have to do is edit a file. Erich Boleyn created it in 1995 for the GNU project.

**The evolution:** GRUB 2.00 (2012) was a complete rewrite that today is the default bootloader in almost every distribution.

**Its key features:**

- **Works on BIOS and UEFI**, and boots almost any combination of disks and operating systems.
- **Reads filesystems directly**, so `/boot` can live inside the root partition and travel with its snapshots.
- **Boots from Btrfs snapshots** via `grub-btrfs`, which adds one menu entry per snapshot to the menu.

**The cost:** GRUB grew until it resembled a small operating system. It has its own filesystem drivers, a scripting language, and a `grub.cfg` file that is regenerated with `grub-mkconfig` whenever something changes. That makes it slow and gives it a larger attack surface. Also, if GRUB has to unlock your disk (because `/boot` is inside LUKS), it only understands LUKS2 with PBKDF2, not Argon2id (`cryptsetup`'s default algorithm).

| Data          | Detail                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------ |
| Origin        | 1995 (Erich Boleyn, GNU project); GRUB 2.00 in 2012                                       |
| Authors       | Erich Boleyn (original), Free Software Foundation                                          |
| License       | GPL-3.0                                                                                    |
| Firmware      | BIOS and UEFI                                                                                |
| Snapshots     | `grub-btrfs` <https://github.com/Antynea/grub-btrfs>                                       |
| Documentation | <https://www.gnu.org/software/grub/manual/grub/> and <https://wiki.archlinux.org/title/GRUB> |
| Code          | <https://git.savannah.gnu.org/git/grub.git>                                                |

**Installation.** On UEFI, with the ESP mounted at `/efi` and `/boot` inside the root:

```bash
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
```

On BIOS (without UEFI), with a 2 MB "BIOS boot" partition on a GPT disk:

```bash
pacman -S grub
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```

To boot from Btrfs snapshots, install `grub-btrfs` and enable its daemon:

```bash
pacman -S grub-btrfs
systemctl enable --now grub-btrfsd
```

## systemd-boot: modern minimalism

GRUB handles almost everything, but on a modern UEFI machine much of that work is redundant: the firmware itself already knows how to read a FAT partition and launch programs from it. **systemd-boot** starts from that observation. It began as _gummiboot_, created by Kay Sievers in 2012 as a minimal bootloader for UEFI, and was integrated into systemd in version 220 (2015) with its current name.

**Its key features:**

- **Reads only the ESP:** the kernel and the initramfs live on the FAT partition, and the bootloader does not need filesystem drivers.
- **Entries as plain text files**, following the _Boot Loader Specification_: each kernel is a `.conf` in `/boot/loader/entries/`, with no script to regenerate.
- **A single management tool, `bootctl`**, that installs, updates, and lists the entries.
- **Compatible with Unified Kernel Images (UKI)**, which it detects on its own in `EFI/Linux/`.

It is the recommended option for UEFI because it is the simplest to understand and repair, and because with encryption it does not have the Argon2id problem: what unlocks the disk is the initramfs, not the bootloader.

**Its cost:** It only works on UEFI. Since the kernel lives on the ESP and not inside Btrfs, it cannot boot a snapshot directly: after reverting `@`, the kernel on the ESP might not match the restored modules in `/usr/lib/modules`. A `pacman` hook mitigates this by copying `/boot` to a folder in the root on every transaction.

| Data           | Detail                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Origin         | _gummiboot_ (Kay Sievers, 2012); integrated into systemd 220 (2015)                                                              |
| Authors        | Kay Sievers, systemd team (Red Hat, Freedesktop.org)                                                                     |
| License        | LGPL-2.1 or later                                                                                                          |
| Firmware       | UEFI only                                                                                                                     |
| Documentation  | <https://www.freedesktop.org/software/systemd/man/latest/systemd-boot.html> and <https://wiki.archlinux.org/title/Systemd-boot> |
| Code           | <https://github.com/systemd/systemd>                                                                                          |
| Specification  | <https://uapi-group.org/specifications/specs/boot_loader_specification/>                                                      |

**Installation.** Inside the `arch-chroot`, with the ESP mounted at `/boot`:

```bash
bootctl install
systemctl enable systemd-boot-update.service
```

Configure the menu in `/boot/loader/loader.conf`:

```conf
default  arch.conf
timeout  3
console-mode max
editor   no
```

Create the main entry, `/boot/loader/entries/arch.conf`:

```conf
title   Arch Linux (zen)
linux   /vmlinuz-linux-zen
initrd  /intel-ucode.img
initrd  /initramfs-linux-zen.img
options root=UUID=YOUR_UUID rootflags=subvol=@ rw
```

And a fallback entry with the LTS kernel in `/boot/loader/entries/arch-lts.conf`:

```conf
title   Arch Linux (LTS)
linux   /vmlinuz-linux-lts
initrd  /intel-ucode.img
initrd  /initramfs-linux-lts.img
options root=UUID=YOUR_UUID rootflags=subvol=@ rw
```

Check the result:

```bash
bootctl status
bootctl list
```

If `bootctl` warns that `/boot` is world-readable, adjust the ESP options in `/etc/fstab` to `fmask=0077,dmask=0077`.

For the snapshot problem, this `pacman` hook copies `/boot` to a folder in the root every time a kernel is updated:

```ini
# /etc/pacman.d/hooks/50-bootbackup.hook
[Trigger]
Operation = Upgrade
Operation = Install
Operation = Remove
Type = Path
Target = usr/lib/modules/*/vmlinuz

[Action]
Depends = rsync
Description = Backing up /boot to /.bootbackup...
When = PostTransaction
Exec = /usr/bin/rsync -a --delete /boot/ /.bootbackup/
```

```bash
sudo pacman -S rsync
sudo mkdir -p /.bootbackup
```

## Limine: snapshots on UEFI and BIOS

**Limine** is a modern bootloader that fills the gap between GRUB and systemd-boot: it works with BIOS and UEFI, is configured with a single text file, and has a tool that allows booting snapshots on UEFI, something systemd-boot does not do natively. Developed by Mintsuki, CachyOS offers it as one of the options in its installer (see [Distro Base](../distro-base/)).

**Its key features:**

- **Works on BIOS and UEFI** (an advantage over systemd-boot).
- **`limine-snapper-sync`** copies the kernel and initramfs of each retained snapshot to the ESP and adds one menu entry for each one.
- **Configuration in a simple text file**, without complex scripts like GRUB.

**The trade-off:** It is the youngest of the three (less than 5 years of maturity). `limine-snapper-sync` is a third-party tool that is installed from the AUR or from the CachyOS repositories. Also, the ESP must be much larger: each retained snapshot copies its kernel and its initramfs (~150 MB each), so with snapshots enabled a 4 GiB ESP is recommended, compared to 1 GiB with systemd-boot.

Installation and the configuration file syntax have changed between versions, so follow the project documentation and the ArchWiki instead of copying commands from here.

| Data          | Detail                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| Origin        | ~2022-2023                                                                  |
| Author        | Mintsuki and the community                                                        |
| License       | BSD-2-Clause                                                                |
| Firmware      | BIOS and UEFI                                                                 |
| Snapshots     | `limine-snapper-sync` (third-party tool)                             |
| Documentation | <https://limine-bootloader.org> and <https://wiki.archlinux.org/title/Limine> |
| Code          | <https://github.com/limine-bootloader/limine>                               |

**Installation.** The bootloader package is in the official repositories; the rest follows the documentation:

```bash
sudo pacman -S limine
```

Follow the ArchWiki to configure `limine-snapper-sync` if you use snapshots.

## Comparison and recommendation

| Criterion            | GRUB                          | systemd-boot                 | Limine                         |
| ------------------- | ----------------------------- | ---------------------------- | ------------------------------ |
| **Origin**          | 1995 (mature, 25+ years)      | 2012 (modern, 10+ years)     | ~2022 (young, 3+ years)        |
| **BIOS**            | ✅                            | ❌ (UEFI only)               | ✅                             |
| **UEFI**            | ✅                            | ✅                           | ✅                             |
| **Btrfs snapshots** | ✅ (with `grub-btrfs`)         | ❌ (requires backup hook)    | ✅ (with `limine-snapper-sync`) |
| **Complexity**      | High (scripts, drivers)       | Low (text files)             | Medium (config + tool)         |
| **Secure Boot**     | Partial                       | Yes (with UKI)               | Yes                            |
| **Repair**          | Hard (regenerate config)      | Easy (edit .conf)            | Medium                         |

### Recommendation by use case

| Situation                                    | Choice                        | Reason                                                            |
| -------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| **Modern UEFI without encryption**           | systemd-boot                  | Maximum simplicity, easy to understand and repair                  |
| **UEFI with Btrfs snapshots**                | systemd-boot + backup hook | systemd-boot is simpler; the pacman hook mitigates the problem |
| **UEFI with Btrfs snapshots (prefers a menu)** | Limine                        | Native menu with snapshots, but more complex and a larger ESP         |
| **Old BIOS**                                 | GRUB                          | The only mature option with full BIOS support                    |
| **Multiple operating systems**               | GRUB                          | Better chainloading support and automatic detection             |
| **Secure Boot**                              | systemd-boot + UKI            | Simpler support with Unified Kernel Images                   |

### Recommended installation flow

```bash
# 1. Partition the disk (see [Mounts](../mounts/))
# 2. Install the base with pacstrap (see [Install Media](../install-media/))
# 3. Enter the chroot: arch-chroot /mnt
# 4. Install your chosen bootloader:

# Option A (recommended for UEFI):
bootctl install

# Option B (for BIOS):
pacman -S grub
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg

# Option C (for UEFI with snapshots):
pacman -S limine
# Configure limine-snapper-sync according to ArchWiki

# 5. Configure the kernel and initramfs (see [Kernel and Initramfs](../kernel-initramfs/))
# 6. Reboot
```
