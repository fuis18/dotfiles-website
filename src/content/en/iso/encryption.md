---
title: "Disk Encryption"
description: "Encryption with LUKS2, encrypted swap, TPM2 and the real scope of the protection."
category: iso
tags: ["luks", "dm-crypt", "cryptsetup", "tpm2", "swap"]
---

A laptop is lost or stolen much more often than it breaks. Without encryption, whoever finds it only has to boot from a USB to read your entire disk, and your user password does not prevent that: it protects login, not the data.

## LUKS2 and dm-crypt

Before full-disk encryption, whole folders or loose files were encrypted (eCryptfs, EncFS). It worked, but it left file names, their sizes, and the directory structure visible, and each file had to be protected separately. **dm-crypt** solves that by working underneath the filesystem: it is a kernel module (by Christophe Saout, 2004) that encrypts the entire block device, so the filesystem, with everything it contains, is stored already encrypted.

dm-crypt only encrypts; it does not know where to store the key or how to change the password. **LUKS** (_Linux Unified Key Setup_, by Clemens Fruhwirth) adds that part: a header on the disk that stores several passwords, called _key slots_, each one capable of opening the same master key. That allows changing the password or adding a recovery one without re-encrypting the disk. **LUKS2**, introduced with `cryptsetup` 2.0 (December 10, 2017), became the default format in 2.1.0 (February 8, 2019) and adopted **Argon2id** as the default KDF in 2.4.0 (August 18, 2021): an algorithm that forces spending a lot of memory per attempt, which makes GPU brute-force attacks expensive. The tool, `cryptsetup`, is maintained by Milan Broz and collaborators.

| Feature                           | LUKS1                | LUKS2                                          |
| ------------------------------- | -------------------- | ---------------------------------------------- |
| Key derivation (PBKDF)            | PBKDF2 only          | PBKDF2, Argon2i and Argon2id                     |
| Backup header                     | No                   | Yes, allows recovering a damaged header      |
| Key in the kernel keyring         | No                   | Yes, prevents user space from seeing it     |
| Customizable sector size          | No                   | Yes                                             |
| Auto-unlock tokens                | No                   | Yes (kernel keyrings, TPM, others)             |
| Online re-encryption              | No (only while unmounted) | Yes, online and crash-resistant             |
| GRUB compatibility                | Yes                  | Partial (requires PBKDF2 for encrypted `/boot`) |

With a modern processor, encryption (AES-XTS with hardware acceleration) costs very little performance. The most important things to remember about using it:

- **A single container, with Btrfs inside.** Encryption goes underneath the filesystem: Btrfs, the subvolumes and the snapshots of [Mounts](../mounts/) work the same, but on top of `/dev/mapper/cryptroot`.
- **The ESP stays unencrypted.** The UEFI firmware only reads the FAT partition, so the kernel and the initramfs live in the clear (see [Bootloader and Kernel](../bootloader/)); what gets encrypted is the root.
- **TRIM and encryption contradict each other a bit.** Passing TRIM commands to an encrypted SSD improves its lifespan, but reveals which blocks are free. It is a conscious decision, and that is why it is enabled explicitly.
- **The header is a single point of failure.** If it gets damaged, you lose the whole disk even if you remember the password, so a copy is stored off the disk.

| Data                  | Detail                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Origin                | dm-crypt: 2004 (Christophe Saout); LUKS: Clemens Fruhwirth                                                     |
| LUKS2                 | `cryptsetup` 2.0 (December 10, 2017)                                                                     |
| LUKS2 by default      | `cryptsetup` 2.1.0 (February 8, 2019)                                                                      |
| Argon2id by default   | `cryptsetup` 2.4.0 (August 18, 2021)                                                                      |
| Current authors       | Milan Broz and collaborators (`cryptsetup`)                                                                      |
| License               | GPL-2.0 or later                                                                                            |
| Default algorithm     | AES-XTS (`aes-xts-plain64`) and Argon2id key derivation                                                    |
| Documentation         | <https://wiki.archlinux.org/title/Dm-crypt> and <https://wiki.archlinux.org/title/Dm-crypt/System_configuration> |
| Code                  | <https://gitlab.com/cryptsetup/cryptsetup>                                                                     |

**Installation.** It is done on the live USB, after creating the partitions and before formatting Btrfs. The scheme in [Mounts](../mounts/) does not change except that the third partition becomes the encrypted container. Create the ESP and the swap the same way as there, and encrypt the third:

```bash
cryptsetup luksFormat --type luks2 /dev/sda3
cryptsetup open /dev/sda3 cryptroot
mkfs.btrfs -L root /dev/mapper/cryptroot
```

Everything else is identical to the [Mounts](../mounts/) procedure, replacing `/dev/sda3` with `/dev/mapper/cryptroot` when creating the subvolumes and mounting them:

```bash
mount /dev/mapper/cryptroot /mnt
btrfs subvolume create /mnt/@
# ...and the rest of the subvolumes, same as in Mounts
umount /mnt

OPTS="noatime,compress=zstd,space_cache=v2,commit=120"
mount -o ${OPTS},subvol=@ /dev/mapper/cryptroot /mnt
# ...and the rest of the mounts, same as in Mounts
```

Save a copy of the header off this disk and add a second recovery password:

```bash
cryptsetup luksHeaderBackup /dev/sda3 --header-backup-file luks-header.img
cryptsetup luksAddKey /dev/sda3
```

Once inside the `arch-chroot`, the initramfs has to know how to unlock the root. In `/etc/mkinitcpio.conf` add the `encrypt` hook between `block` and `filesystems`, and check that `keymap` comes first, because it is what allows typing the password with your keyboard (`la-latin1`, taken from `/etc/vconsole.conf`; see [Install Media](../install-media/)):

```bash
# /etc/mkinitcpio.conf (classic hooks, also valid on Artix and Obarun)
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt filesystems fsck)
```

```bash
mkinitcpio -P
```

The alternative for systems with `systemd` are the `systemd`, `sd-vconsole` and `sd-encrypt` hooks, which do not mix with the previous ones:

```bash
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck)
```

Finally, the bootloader must indicate which device to unlock. Always use the UUID of the LUKS container (`blkid -s UUID -o value /dev/sda3`), not the one of `/dev/mapper/cryptroot` nor the PARTUUID. With the `encrypt` hook, in `/boot/loader/entries/arch.conf`:

```conf
options cryptdevice=UUID=SDA3_UUID:cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ rw
```

And with `sd-encrypt`:

```conf
options rd.luks.name=SDA3_UUID=cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ rw
```

If you decide to enable TRIM, add `:allow-discards` at the end of `cryptdevice=...` (or `rd.luks.options=discard` with `sd-encrypt`) and accept the information leak about free blocks that this implies.

## Encrypted swap

Encrypting the root and leaving swap in the clear defeats the effort: when the system swaps memory pages to disk, passwords, keys and open documents end up there, where they would be readable on the swap partition. Swap has to be taken care of too.

But "encrypting swap" is not a single thing. There is also **zram as a constant**: it lives in compressed RAM and never touches the disk, so it needs no encryption and does not change between scenarios (see [Components Optimization](../components-optimization/)). What has to be decided is **what to put on disk**, and there are only three possibilities.

|                    | **A. Nothing on disk**   | **B. Encrypted swap with a random key** | **C. Swapfile inside the encrypted root**     |
| ------------------ | ---------------------- | --------------------------------------- | --------------------------------------------- |
| Where swap lives   | Only zram (RAM)        | zram + encrypted partition                | zram + file in the encrypted Btrfs            |
| Swap key           | Not applicable         | Random, new on every boot                | The same as the root                          |
| Hibernate?         | No                     | No                                      | **Yes**                                        |
| Complexity         | None                   | Low (`crypttab` + `fstab`)             | High (`resume=`, `resume_offset=`)            |
| Disk space         | 0                      | Fixed                                   | The size of the RAM                           |
| Main risk          | OOM killer if exhausted | None serious                           | A `btrfs balance` invalidates the offset     |

### A. Only zram, nothing on disk

It is the simplest and most private option: since zram lives in RAM, **no memory data ever reaches the disk**, not even encrypted. There is no `/etc/crypttab` to write, no swap line in `/etc/fstab`, and no key to manage. With `zram-generator` configured, there is nothing left to do.

Its two limits are clear. The first is that **it does not allow hibernation**: the ArchWiki says so unambiguously — you cannot hibernate to a swap on zram, not even by configuring a backup device, and `logind` blocks the attempt. The second is that **there is no safety net**: if RAM and zram fill up at the same time, the kernel has nowhere left to move pages and the OOM killer starts killing processes. With 16 GiB or more that almost never happens; with 4 or 8 GiB it is a real possibility.

### B. zram + on-disk swap with a random key

zram remains the primary swap (priority 150), and the 4 GiB partition of [Mounts](../mounts/) acts as a backup: it is only used if zram fills up, and it prevents reaching the OOM killer. Its contents are encrypted with a random key that is generated on every boot and discarded on shutdown, so whatever ended up there is unreadable afterwards.

The price of that ephemeral key is that **it does not allow hibernation either**: when you shut down the machine the key disappears, and when it comes back there would be no way to read the saved image.

| Data          | Detail                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| Documentation | <https://wiki.archlinux.org/title/Dm-crypt/Swap_encryption>                            |
| Tools         | `/etc/crypttab` (`systemd-cryptsetup`, or its equivalent on other inits) and `cryptsetup` |

**Installation.** Give the swap partition a stable partition label (in `cfdisk`, the label `swap`), because `/dev/sda2` can change from one boot to another. The configuration is written to `/etc/crypttab` and `/etc/fstab` of the installed system, not on the live USB:

```conf
# /etc/crypttab
swap  /dev/disk/by-partlabel/swap  /dev/urandom  swap,cipher=aes-xts-plain64,size=512
```

```conf
# /etc/fstab (replace the swap line that genfstab generated)
/dev/mapper/swap  none  swap  defaults  0 0
```

This wipes the contents of the partition on every boot; verify that `by-partlabel/swap` points to the correct partition before rebooting:

```bash
ls -l /dev/disk/by-partlabel/
```

### C. Swapfile inside the encrypted root (the only one that allows hibernation)

If you need to hibernate, swap has to survive shutdowns, and that means its key cannot be ephemeral. The cleanest way to achieve that is **not to encrypt swap separately**: a swap file is created inside the Btrfs that is already encrypted, so it inherits the root's key and is opened along with it, with no second password and no second container.

The ArchWiki points out that, with a systemd-based initramfs and an encrypted root, this is the simplest and most flexible path: the file is created, activated and added to `/etc/fstab`, and it works for hibernation with no further configuration beyond the boot parameters.

There are three details that have to be respected, and they are the reason this scenario is the most laborious one:

- **`resume=` points to the mapped device, not to the raw partition.** It must be `/dev/mapper/cryptroot` (or its UUID), never `/dev/sda3`. It is the most common mistake when configuring hibernation on top of encryption.
- **A swapfile also needs `resume_offset=`**, which indicates where in the filesystem the file is. In Btrfs it is obtained with `btrfs inspect-internal map-swapfile -r`, not with `filefrag` as in ext4.
- **In Btrfs the file needs its own subvolume, without compression and without copy-on-write.** It is created with `btrfs filesystem mkswapfile`, which already takes care of that.

> A full `btrfs balance` can relocate the swapfile and leave the `resume_offset=` stale, so hibernation stops working until it is recalculated. If you use Btrfs maintenance tools that run automatic balance, keep that in mind.

The cost of this scenario is twofold. The hibernation image takes up on disk roughly what the RAM in use does, so the file must be at least the size of the RAM and is permanently reserved. And resuming is slower than waking from RAM suspend, because several gigabytes have to be read from the disk.

**Installation.** With the systemd hook family (`sd-encrypt`) it is the most direct path. First the subvolume and the file:

```bash
# Own subvolume for swap, without compression
mount -o subvol=/ /dev/mapper/cryptroot /mnt
btrfs subvolume create /mnt/@swap
umount /mnt

mkdir -p /swap
mount -o subvol=@swap,compress=no /dev/mapper/cryptroot /swap

btrfs filesystem mkswapfile --size 16g /swap/swapfile
swapon /swap/swapfile
```

The `--size` must cover your RAM (adjust it). Then, the mount line in `/etc/fstab` and the offset:

```conf
# /etc/fstab
/dev/mapper/cryptroot  /swap  btrfs  subvol=@swap,compress=no  0 0
/swap/swapfile         none   swap   defaults,noatime          0 0
```

```bash
btrfs inspect-internal map-swapfile -r /swap/swapfile
```

That number is the `resume_offset=`. With the systemd hooks, the boot parameters end up like this (replace the UUID with the one of the LUKS container, `blkid -s UUID -o value /dev/sda3`):

```conf
options rd.luks.name=SDA3_UUID=cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ \
        resume=/dev/mapper/cryptroot resume_offset=NUMBER rw
```

With the classic hooks (`encrypt`) the `resume` hook also has to be added to the initramfs, after `encrypt`:

```bash
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt resume filesystems fsck)
```

```bash
mkinitcpio -P
```

And check that hibernation works before trusting it:

```bash
systemctl hibernate
cat /proc/cmdline | tr ' ' '\n' | grep -E 'resume'
```

### How to choose

| Situation                                                                | Scenario                                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 16 GiB or more of RAM and you do not hibernate                           | **A** — only zram, nothing on disk                                             |
| Less than 16 GiB, or you want a safety net for spikes                    | **B** — zram + random encrypted swap                                            |
| You need to hibernate (a laptop that stays off for days, or to save battery) | **C** — swapfile inside the encrypted root                                   |
| Critical server or workstation                                           | **C**, or a swap partition in its own LUKS container with a key file |

The three are cumulative in the sense that zram can always be present: scenarios B and C do not replace it, they complement it with a disk destination of a different nature.

## TPM2 and what encryption does not protect

Typing the encryption password on every boot is uncomfortable, and many end up choosing short passwords. An alternative is to let the **TPM**, a chip in the machine that stores keys securely, unlock the disk automatically, but only if the boot has not been tampered with. The TPM can seal the key by encrypting it with a measurement of the firmware and Secure Boot state (PCR register 7), so if someone changes what boots, the TPM refuses to hand it over.

### `clevis` + `tpm2-tools`

`clevis` allows binding the key of the LUKS container to a TPM policy, and `tpm2-tools` for communication with the chip.

| Data          | Detail                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| Tools         | `clevis`, `clevis-luks`, `tpm2-tools`                                            |
| Requirements  | TPM 2.0 chip, initramfs with clevis support, and Secure Boot configured       |
| Documentation | <https://wiki.archlinux.org/title/Clevis> and <https://github.com/latchset/clevis> |

**Installation.** Install the tools, bind the key to the TPM, and regenerate the initramfs so it includes the necessary components:

```bash
sudo pacman -S clevis clevis-luks clevis-systemd tpm2-tools tpm2-tss
sudo clevis luks bind -d /dev/sda3 tpm2 '{"pcr_bank":"sha256","pcr_ids":"7"}'
```

The command will ask for the current password of the LUKS container. Then, add the `tpm2-device=auto` option to `/etc/crypttab` (of the installed system, not the live one) so the initramfs knows it must attempt automatic unlocking:

```conf
# /etc/crypttab
cryptroot  UUID=YOUR_LUKS_UUID  none  tpm2-device=auto
```

And regenerate the initramfs. With the systemd hooks, `clevis` is included automatically. With the classic hooks, add `clevis` and `clevis-luks` to the `mkinitcpio` configuration or regenerate it manually so it copies the necessary libraries.

```bash
mkinitcpio -P
```

**Note on PCRs:** The values of the PCRs that the TPM monitors can vary with your configuration. PCR 7 is the standard for Secure Boot, but you can add others (such as PCR 0, 3, 4, 5) to protect against changes in the firmware or the initramfs. Check `tpm2_pcrread` to see the current values of your system.

### The real scope of disk encryption

Regardless of the unlock method, it is worth understanding what encryption protects and what it does not:

| Protects against                                         | Does not protect against                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Theft or loss of the powered-off machine                 | Access to the disk while the system is running                             |
| Devices sold or handed over for repair                   | Boot attacks (_evil maid_) if the ESP is not signed                    |
| Casual physical access (someone powering on the machine) | TPM unlock without a PIN (opens the disk to whoever powers on the machine)          |
| Direct reading of the partition from another system      | Loss of the header or password (without a backup, the data is inaccessible) |

A practical detail: TPM unlock without a PIN opens the disk to anyone who powers on the machine. It only protects against them pulling the disk; add a PIN (`--tpm2-with-pin=yes`) if you also want protection against a stolen and powered-on laptop. And remember: it is not a backup. If you lose the password or the header gets corrupted, you lose everything; that is why a copy of the header and a recovery password are stored.

## Quick alternatives

There are other layers of encryption depending on the case:

- **fscrypt**: Encrypts at the filesystem level (ext4, F2FS, UBIFS), allowing per-directory policies. Ideal for isolating folders between users on the same machine. It does not encrypt filesystem metadata other than names.
- **OPAL**: Hardware encryption on the disk itself. Requires kernel 6.4+ and compatible disks. It does not consume CPU but does not allow resizing.

They do not compete with LUKS: they can be combined. It is common to use LUKS for the whole disk and fscrypt to isolate personal folders.
