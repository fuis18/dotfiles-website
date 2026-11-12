---
title: "Mounts"
description: "Filesystem and partitioning: ext4, Btrfs with snapshots and partition scheme."
category: iso
tags: ["ext4", "btrfs", "snapshots", "subvolumes"]
---

The filesystem is the hardest decision to change once the system is installed, and the one that defines whether a bad update is a scare or a mere inconvenience.

## ext4

For years, ext2 and then ext3 were the Linux standard, but they fell short: ext3 mapped every file block by block, which penalizes large files and fragments the disk; its `fsck` checks were slow and it limited every directory to 32,000 subdirectories. In response, Theodore Ts'o announced the ext4 development plan in June 2006, a successor that was born as a series of extensions compatible with ext3, many of them originally developed for Lustre between 2003 and 2006.

Its main improvements are:

- _Extents_ instead of block mapping: a single entry describes a contiguous range of blocks, which speeds up large files and reduces fragmentation.
- Delayed allocation and the multiblock allocator, which decide where to write with more information.
- Much faster `fsck`, because it skips unused block groups.
- Checksums in the journal and, since kernel 3.5, in the metadata, plus volumes of up to 1 EiB.

It remains the simplest and most proven choice: it is the default in Debian and Ubuntu, and it has decades of testing behind it. But Ts'o himself said in 2008 that ext4 used old technology and was a transitional solution, and that Btrfs was the best direction for its scalability, reliability and ease of administration. The thing is, ext4 does not create snapshots nor verify the content of your files with checksums (only the metadata): if an update leaves the system broken, the only way out is restoring a backup or repairing by hand. That is where the next section starts.

| Fact          | Details                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| First release | Preliminary version in Linux 2.6.19 (October 2006); stable in Linux 2.6.28 (December 2008)                   |
| Authors       | Team led by Theodore Ts'o, with Mingming Cao, Andreas Dilger, Alex Zhuravlev, Dave Kleikamp and Eric Sandeen |
| License       | GPL-2.0 (kernel)                                                                                             |
| Documentation | <https://docs.kernel.org/filesystems/ext4/index.html> and <https://wiki.archlinux.org/title/Ext4>            |
| Tools         | `e2fsprogs`: <https://git.kernel.org/pub/scm/fs/ext2/e2fsprogs.git>                                          |

**Installation.** It comes in the kernel and the tools are already in Arch's base. To format a partition:

```bash
mkfs.ext4 -L root /dev/sda2
```

## Btrfs and snapshots

The underlying problem is that a traditional filesystem stores the current state and nothing else. Going back to yesterday's state requires a separate copy that takes up a lot of space and time to make. Btrfs starts from a different idea: Chris Mason (Oracle) took the copy-on-write B-trees proposed by Ohad Rodeh in 2007 and built a filesystem where nothing is overwritten; instead, a new copy is written. Nearly all of its advantages flow from that design decision: since the old data is still there, storing a previous state costs almost nothing.

In practice it provides:

- **Subvolumes:** independent filesystem roots within the same partition, mounted separately.
- **Instant snapshots:** a snapshot is a subvolume that shares data with another, so it is created in a fraction of a second and takes up almost no space at first.
- **Checksums** of data and metadata, which allow detecting corrupted blocks.
- **Transparent compression** with `zstd` (available since kernel 4.14), already covered in [Components Optimization](../components-optimization/).
- `btrfs send/receive` to replicate snapshots to another disk.

With snapshots, a failed update is reverted in minutes: `snap-pac` creates a snapshot before and another after each `pacman` transaction, and to roll back you restore the `@` subvolume from one of them (the ArchWiki documents the manual procedure for this scheme). It is the direct answer to the rolling release mentioned in [Distro Base](../distro-base/), and the reason CachyOS adopted it as the default filesystem in its June 2024 release.

Keep in mind that:

- A snapshot is not a backup: it lives on the same disk. If the disk fails, everything is lost. Use it together with `btrfs send` to another disk or with another backup tool.
- The copy-on-write nature fragments files that are constantly rewritten, such as virtual machine disks or databases. For those, it is disabled with `chattr +C`, at the cost of losing checksums and compression on those files.
- RAID 5/6 still carries warnings in the official documentation; do not use it for important data.
- Free space is calculated differently from other systems: use `btrfs filesystem usage /` instead of relying only on `df`.

| Fact          | Details                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| First release | Announced on the kernel mailing list in July 2007; included in Linux 2.6.29 (March 2009); stable format in 2013 |
| Author        | Chris Mason (Oracle) and contributors from SUSE, Meta, Fujitsu, Red Hat and others                              |
| License       | GPL-2.0 (kernel)                                                                                                |
| Documentation | <https://btrfs.readthedocs.io> and <https://wiki.archlinux.org/title/Btrfs>                                     |
| Source        | <https://github.com/kdave/btrfs-progs>                                                                          |
| Snapper       | <http://snapper.io> and <https://github.com/openSUSE/snapper>                                                   |
| snap-pac      | <https://github.com/wesbarnett/snap-pac>                                                                        |

**Installation.** `btrfs-progs` is installed with the base (`pacstrap`) and Snapper once inside the `arch-chroot` (see the next section):

```bash
pacman -S snapper snap-pac
```

Snapper creates its own `.snapshots` subvolume when configured, which conflicts with the `@snapshots` we define below. Here is how to fix it (follow the ArchWiki recipe):

```bash
umount /.snapshots
rm -r /.snapshots
snapper -c root create-config /
btrfs subvolume delete /.snapshots
mkdir /.snapshots
mount -a
chmod 750 /.snapshots
```

With `systemd`, enable automatic creation and cleanup; on systems without it (see [PID](../pid/)) the timers must be replaced with `cron`:

```bash
systemctl enable --now snapper-timeline.timer snapper-cleanup.timer
```

## Partitions

With Btrfs the partition scheme is short on purpose: almost all the organization is inside the filesystem, in the form of subvolumes, not separate partitions. Separating the subvolumes has a concrete reason: when reverting the root (`@`), you do not want your personal files, logs or cache to go back with it.

The scheme is a GPT table with three partitions (on an NVMe disk the names will be `/dev/nvme0n1p1`, `p2` and `p3`):

| Device    | Size | Type             | Label |
| --------- | ---- | ---------------- | ----- |
| /dev/sda1 | 1G   | EFI System       | boot  |
| /dev/sda2 | 4G   | Linux swap       | swap  |
| /dev/sda3 | Rest | Linux filesystem | root  |

Inside the Btrfs partition these subvolumes are created:

| Subvolume    | Mount         | Why separate it                                       |
| ------------ | ------------- | ----------------------------------------------------- |
| `@`          | `/`           | The system; this is what gets reverted                |
| `@home`      | `/home`       | Your files do not roll back with the system           |
| `@snapshots` | `/.snapshots` | Where Snapper stores the snapshots                    |
| `@log`       | `/var/log`    | You keep the logs to diagnose why something failed    |
| `@cache`     | `/var/cache`  | Keeps downloaded packages from bloating the snapshots |

In addition, `~/.cache` is created as an independent subvolume inside `@home`, so that application cache does not end up in your files' snapshots either. The 4 GiB swap partition remains as a fallback: zram is configured with higher priority (150) and is used first, as detailed in [Components Optimization](../components-optimization/).

The ESP is mounted on `/boot` and `systemd-boot` is used, which means the kernel and initramfs live on the ESP (FAT32) and not inside `@`'s snapshots. After reverting `@`, the kernel in `/boot` may not match the restored modules in `/usr/lib/modules`; the ArchWiki describes a `pacman` hook that copies `/boot` into the snapshot on every transaction to prevent this.

| Fact          | Details                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| Documentation | <https://wiki.archlinux.org/title/Partitioning> and <https://wiki.archlinux.org/title/EFI_system_partition> |
| Snapper       | <https://wiki.archlinux.org/title/Snapper>                                                                  |
| Tools         | `cfdisk` (`util-linux`), `mkfs.fat` (`dosfstools`), `mkfs.btrfs` (`btrfs-progs`)                            |

**Installation.** From the live USB (see [Install Media](../install-media/)). These commands wipe the disk; replace `/dev/sda` with your own. First create the table with `cfdisk` and format:

```bash
cfdisk /dev/sda
lsblk

# EFI
mkfs.fat -F 32 /dev/sda1
# Swap
mkswap /dev/sda2
# Root (Btrfs)
mkfs.btrfs -L root /dev/sda3
```

Create the subvolumes:

```bash
mount /dev/sda3 /mnt

btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
btrfs subvolume create /mnt/@log
btrfs subvolume create /mnt/@cache

umount /mnt
```

Mount them with the same options on all of them (`noatime` avoids writing the access time, `compress=zstd` enables compression and `commit=120` batches writes every 120 seconds instead of the default 30, at the cost of potentially losing up to that interval of recent data in a power cut):

```bash
OPTS="noatime,compress=zstd,space_cache=v2,commit=120"

mount -o ${OPTS},subvol=@ /dev/sda3 /mnt

mkdir -p /mnt/home
mkdir -p /mnt/.snapshots
mkdir -p /mnt/var/log
mkdir -p /mnt/var/cache
mkdir -p /mnt/boot

mount -o ${OPTS},subvol=@home /dev/sda3 /mnt/home
mount -o ${OPTS},subvol=@snapshots /dev/sda3 /mnt/.snapshots
mount -o ${OPTS},subvol=@log /dev/sda3 /mnt/var/log
mount -o ${OPTS},subvol=@cache /dev/sda3 /mnt/var/cache

# EFI and swap
mount /dev/sda1 /mnt/boot
swapon /dev/sda2
```

Verify the mounts:

```bash
mount | grep /mnt
findmnt -t btrfs
lsblk -f
```

Install the base including `btrfs-progs` and generate the `fstab`:

```bash
pacstrap -K /mnt base linux-zen linux-zen-headers linux-firmware
pacstrap /mnt btrfs-progs

genfstab -U /mnt >> /mnt/etc/fstab
arch-chroot /mnt
```

Once inside the `chroot`, install Snapper (see above) and create `~/.cache` as a subvolume (replace `user` with your username once it is created):

```bash
btrfs subvolume create /home/user/.cache
chown -R user:user /home/user/.cache
```

Finally, the kernel needs to know which subvolume is the root. In the `systemd-boot` entry (`/boot/loader/entries/arch.conf`) add `rootflags=subvol=@` to `options` (replace `YOUR_UUID` with the output of `blkid -s UUID -o value /dev/sda3`, and adjust `linux` and `initrd` if you do not use `linux-zen`):

```conf
title   Arch Linux
linux   /vmlinuz-linux-zen
initrd  /initramfs-linux-zen.img
options root=UUID=YOUR_UUID rootflags=subvol=@ rw
```
