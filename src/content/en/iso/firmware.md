---
title: "Firmware"
description: "Machine boot: BIOS and UEFI, GPT, the EFI partition and Secure Boot."
category: iso
tags: ["uefi", "bios", "gpt", "esp", "secure-boot"]
---

Before there is a bootloader, a kernel or a filesystem, there is a program burned into a chip on the motherboard that runs when you press the power button. That program is the firmware, and it is responsible for checking that the hardware responds, finding something bootable and handing over control. For almost thirty years it fulfilled that task with the BIOS; since the mid-2000s it does so with UEFI.

## BIOS: the original firmware

The term BIOS (_Basic Input/Output System_) goes back to Gary Kildall's work on CP/M in the mid-1970s, and reached the IBM PC in 1981. The BIOS is, in essence, a set of routines stored in a non-volatile memory chip on the board, which run when you power on the machine.

What it does, in order:

1. **POST** (_Power-On Self-Test_): checks that memory, the processor and the basic devices respond.
2. **Initialization**: configures the minimum hardware needed to boot.
3. **Search for a boot sector**: reads the first 512 bytes of the disk (the MBR) and executes the code it finds there.

Its limits come from the era in which it was designed, and they are the reason it is in retreat today:

- **16-bit real mode:** the processor boots in a mode inherited from the 8086, with one megabyte of addressable memory. All the firmware lives there.
- **No drivers or network:** it does not know how to talk to modern hardware beyond what the firmware itself implements.
- **Text interface, keyboard only:** the configuration screen is a list of options with no mouse and no graphics.
- **Serial boot:** it initializes the devices one after another, which lengthens the process.
- **No signature verification:** it executes whatever it finds in the boot sector, whatever that may be.

And above all, it inherits the limitations of the **MBR** (_Master Boot Record_), the partition scheme that accompanies it. The MBR was introduced with IBM PC DOS 2.0 in 1983 and describes the partition table in 512 bytes:

| MBR limit          | Value  | Why                                          |
| ------------------ | ------ | -------------------------------------------- |
| Maximum disk size  | ~2 TiB | Addresses sectors with 32 bits (2³² × 512 B) |
| Primary partitions | 4      | Only four 16-byte entries fit                |
| Backup             | No     | If the MBR is corrupted, the table is lost   |
| Verification       | No     | No checksums for the table                   |

To get past the four partitions the extended and logical partition scheme was invented, which adds a layer of indirection and more fragility. And the 2 TiB limit became a real obstacle as soon as disks exceeded it.

## UEFI: the modernization

UEFI originated at Intel. In 1998 the company launched the **Intel Boot Initiative** program to replace the BIOS with something that worked on its 64-bit processors and could boot large systems without the limitations of the MBR. From there came the **EFI** (_Extensible Firmware Interface_) specification, whose last Intel version was **1.10**.

In **July 2005** Intel stopped developing it and handed it over to the **Unified EFI Forum**, a non-profit industry organization formed to manage it jointly. With that transfer the current name was born: **UEFI** (_Unified Extensible Firmware Interface_). Today more than 140 technology companies participate in the forum.

The versions that mark its history:

| Version    | Date                                                 | What it added                                          |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------ |
| EFI 1.10   | Last Intel version, handed to the forum in July 2005 | Starting point of UEFI                                 |
| UEFI 2.0   | January 31, 2006                                     | Cryptography and security                              |
| UEFI 2.1   | January 7, 2007                                      | Network authentication and user interface architecture |
| UEFI 2.3.1 | April 6, 2011                                        | **Secure Boot** and ARM support                        |

The reference implementation, **TianoCore EDK II**, is written in C, and the specification is platform- and language-independent.

### What it solves

Compared to the BIOS, UEFI changes the whole model:

- **Boots in 64 bits** and can access all of memory, not one megabyte.
- **Brings drivers and a network stack** in the firmware itself, so it can read disks, use the network and display graphics before any operating system exists.
- **Initializes in parallel**, which shortens the boot.
- **Graphical interface with a mouse**, in addition to the text one.
- **Verifies signatures** before executing code (Secure Boot, see below).
- **Stores the boot entries in NVRAM**, the non-volatile memory of the board, instead of relying on a disk sector. They are managed with `efibootmgr`.
- **Uses GPT**, the partition scheme that Intel developed alongside the EFI specification.

### GPT: the modern partition scheme

GPT (_GUID Partition Table_) replaces the MBR and solves its limits:

| Feature           | MBR                   | GPT                                                        |
| ----------------- | --------------------- | ---------------------------------------------------------- |
| Introduced        | 1983 (IBM PC DOS 2.0) | Alongside the EFI specification, adopted by the UEFI forum |
| Maximum disk size | ~2 TiB                | On the order of zettabytes                                 |
| Partitions        | 4 primary             | 128                                                        |
| Sector addresses  | 32 bits               | 64 bits                                                    |
| Backup            | No                    | Header and table duplicated at the end of the disk         |
| Verification      | No                    | Checksums (CRC)                                            |

Two details worth knowing. GPT does not eliminate the MBR: it keeps it at the beginning of the disk as a **protective MBR**, an entry that declares the whole disk as occupied so that old tools do not misinterpret it. And since it stores a copy of the header and the table at the end of the disk, if the first one is corrupted it can be reconstructed from the second.

### The EFI System Partition (ESP)

UEFI does not execute code from a boot sector, but from **files** inside a partition. That partition is the **ESP** (_EFI System Partition_), and its rules are what condition the partition scheme of the whole guide:

- **FAT format.** The specification allows FAT12, FAT16 and FAT32, but in practice **FAT32** is used. The reason is that the firmware only knows how to read FAT natively: it does not understand ext4 or Btrfs, so the bootloader, the kernel and the initramfs must be on a filesystem the firmware can read.
- **Size.** 512 MiB to 1 GiB is the usual range. Size matters because the bootloader, the kernel, the initramfs and the microcode live on the ESP; if you also boot snapshots, each one copies its kernel and its initramfs (see [Bootloader](./bootloader.md)).
- **Mount point.** It is mounted at `/boot` or at `/efi`, depending on where you want the kernel and the initramfs to live. This decision affects whether the kernel goes into the Btrfs snapshots or not, as explained in [Mounts](./mounts.md).
- **Partition type.** On GPT it is marked with the type "EFI System"; it is the only partition the firmware recognizes by its type.

On a disk with BIOS and MBR there is no ESP: the equivalent is a 2 MB "BIOS boot" partition, which only reserves the space where GRUB writes its second stage.

## Secure Boot

Secure Boot is the feature that version 2.3.1 of the specification added in 2011, and it consists of the firmware **validating every binary before executing it**. The validation checks that the file carries a signature that matches a trusted certificate, or that its SHA-256 hash appears in a list of allowed values.

The keys live in the machine's NVRAM and there are four:

| Variable | Name               | Function                                            |
| -------- | ------------------ | --------------------------------------------------- |
| `PK`     | Platform Key       | Platform root key; controls who can modify the rest |
| `KEK`    | Key Exchange Key   | Keys authorized to update the signature lists       |
| `db`     | Signature Database | Allowed certificates and hashes                     |
| `dbx`    | Forbidden Database | Revoked and forbidden signatures                    |

The firmware has two states. In **Setup Mode** there is no `PK` installed and anyone can register their own keys; in **User Mode** there is a `PK` and modifications require signing it. From the factory, most machines come in User Mode with Microsoft's keys preinstalled, which allows booting Windows and the Linux distributions that pay for a _shim_ signature.

The alternative is to generate your own keys, register them and sign the bootloader, the kernel and the initramfs yourself. On Arch that is done with `sbctl`, and it is the reason the Unified Kernel Image (UKI) exists: Secure Boot signs EFI files, and a kernel with its initramfs separately is not one. The full procedure is in [Kernel and Initramfs](./kernel-initramfs.md).

It is worth knowing that Secure Boot does not protect against everything. It verifies that the code being executed is signed, but it does not check that the kernel parameters are the ones you set, nor that the initramfs is yours, unless you use a signed UKI. And on many machines you have to keep Microsoft's keys (`sbctl enroll-keys -m`), because the graphics card firmware is also signed with them.

## CSM: the compatibility mode

Many UEFI machines include the **CSM** (_Compatibility Support Module_), an optional component that emulates the old BIOS in order to boot operating systems that only understand legacy boot. In the firmware settings it appears as "Legacy boot" or "Legacy BIOS".

The CSM has a cost: it forces the use of MBR, keeps the limits of the BIOS and makes the boot harder to diagnose, because it is not always clear in which mode the machine booted. If you do not need to boot an old system, **it is best to disable it** and use only UEFI. That simplifies the boot path and avoids the classic problem of installing a system in UEFI mode and discovering that the firmware was booting the USB in legacy mode.

## How to tell which mode you booted in

Inside the installed system, three checks are enough:

```bash
# 1. Does the EFI firmware directory exist? If it does not exist, you booted in BIOS
ls /sys/firmware/efi

# 2. Platform size: 64 on a 64-bit UEFI system
cat /sys/firmware/efi/fw_platform_size

# 3. Boot entries registered in the NVRAM
efibootmgr
```

And to see the partition scheme and the ESP:

```bash
lsblk -f
findmnt /boot
```

If `efibootmgr` answers "EFI variables are not supported", you are in BIOS mode or in the CSM legacy mode.

| Data                | Detail                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| BIOS                | Firmware routines present in the ecosystem since 1975; reached the IBM PC in 1981                                                    |
| MBR                 | 1983 (IBM PC DOS 2.0); 512 bytes, 4 primary partitions, ~2 TiB limit                                                                 |
| UEFI                | Intel Boot Initiative program (1998); EFI 1.10 handed to the Unified EFI Forum in July 2005                                          |
| Key versions        | UEFI 2.0 (January 31, 2006), 2.1 (January 7, 2007), 2.3.1 (April 6, 2011)                                                            |
| Ref. implementation | TianoCore EDK II (in C)                                                                                                              |
| Specification       | <https://uefi.org/specifications>                                                                                                    |
| Documentation       | <https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface> and <https://wiki.archlinux.org/title/EFI_system_partition> |
| Tools               | `efibootmgr`, `efivarfs` (mounted at `/sys/firmware/efi/efivars`)                                                                    |
| Secure Boot         | `sbctl` <https://github.com/Foxboron/sbctl>                                                                                          |

**Quick check.** From the live USB (see [Install Media](./install-media.md)), before partitioning anything:

```bash
# Should print 64 if you booted in UEFI; if it errors, you are in BIOS
cat /sys/firmware/efi/fw_platform_size

# Lists the disks and their partitions
lsblk -f

# If you booted in UEFI, shows and allows editing the boot entries
efibootmgr -v
```
