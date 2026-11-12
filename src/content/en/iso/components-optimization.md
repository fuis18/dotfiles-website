---
title: "Component Optimization"
description: "Component optimization: zram, swap and zstd compression."
category: iso
tags: ["zram", "swap", "earlyoom", "zstd"]
---

Optimizing is not about tweaking values out of habit, but about removing waste where the hardware already allows it. There are two common wastes in a daily-use machine: memory running out and forcing writes to disk, and data taking up more space than necessary on that same disk. Both have the same answer, which is compression, and both are solved with pieces that are already part of the kernel and Arch's base. On top of that there is a safety net for the worst case of memory: running out of it entirely.

## swap, zram and earlyoom

### swap

To understand zram you first have to understand _swap_. Programs do not use RAM directly, but virtual memory: the kernel hands out pages (4 KiB blocks) and decides which ones live in physical RAM. Swap is a space on disk, a partition or a file, that the kernel uses as an extension of that memory: when RAM is scarce, it moves there the pages that nobody has touched in a while to free up space, and brings them back if the program needs them again.

There are four things worth keeping clear:

- **Only "anonymous" pages are moved**, that is, the memory owned by programs (heaps and stacks). Pages that come from files (the code of binaries, the disk cache) do not need swap, because the kernel can discard them and read them again from the original file.
- **Having swap does not mean using it.** With enough RAM it stays almost empty. Even so it is useful, because it allows evicting inactive pages and giving that space to the disk cache, which speeds up the system.
- **`vm.swappiness` controls the preference:** a low value makes the kernel avoid swap and evict the file cache first; a high value makes it swap out program pages more readily.
- **It is where memory is stored when hibernating**, so hibernating requires a swap on disk, at least as large as the RAM.

There are two ways to have one. A dedicated partition, like the one created in [Mounts](../mounts/), is the simplest and does not depend on the filesystem. A file (`/swapfile`) lets you change the size without repartitioning the disk, but on Btrfs it requires creating it with a special command (`btrfs filesystem mkswapfile`) and inside its own subvolume, so that copy-on-write and snapshots do not interfere.

The problem is that the disk, even an SSD, is orders of magnitude slower than memory: when the system runs out of RAM and starts swapping, everything freezes while the pages travel, and on an SSD every swap burns write cycles. Removing swap is not the solution either, because then, when RAM runs out, the kernel kills processes to free memory.

### zram

zram proposes a different idea: instead of sending those pages to disk, compress them and keep them in RAM itself, inside a block device. Since compressed memory takes up considerably less than the original, more pages fit in the same RAM and swapping happens at memory speed, without touching the disk. It was born as _compcache_, a project by Nitin Gupta that published its first versions in 2008, went through the kernel _staging_ area, and landed on the mainline branch in version 3.14 (March 2014). Distributions like Fedora adopted it by default starting with version 33, configured with `zram-generator`, the tool used here.

The configuration this guide recommends has three complementary pieces:

- **A zram device as the primary swap**, with `zstd` as the algorithm and priority 150, so the kernel uses it before any other.
- **The 4 GiB swap partition** created in [Mounts](../mounts/) as a fallback, with lower priority: it is only used if zram fills up.
- **Kernel tunables (`sysctl`)** that take advantage of it: `vm.swappiness=100` means swapping is cheap and there is no need to wait until RAM runs out, and `vm.vfs_cache_pressure=150` makes the kernel reclaim the file name cache sooner to free memory for applications.

The size of zram is expressed as a factor of the RAM. This table summarizes the recommended values (the _Total_ column is the RAM plus the zram, that is, the effective memory you get):

| RAM   | Factor (`zram-size`) | Total |
| ----- | -------------------- | ----- |
| 4 GB  | `ram * 0.5`          | 6 GB  |
| 6 GB  | `ram * 0.5`          | 9 GB  |
| 8 GB  | `ram * 0.5`          | 12 GB |
| 16 GB | `ram * 1`            | 32 GB |
| 32 GB | `ram * 1`            | 64 GB |
| 64 GB | `ram * 0.5`          | 96 GB |

That size is the uncompressed capacity: what it actually consumes from RAM is much smaller, because `zstd` usually compresses memory pages two to three times. That is why a factor of 1 is safe when there is plenty of RAM, and with little RAM a more conservative one is better.

Keep in mind that zram spends some CPU compressing, and that it is no use for hibernating: as explained before, hibernation needs a swap on disk at least as large as the RAM, which the 4 GiB fallback does not cover.

With `zram-generator`, the configuration (here with the factor for 8 GB of RAM; replace it according to the table) looks like this:

```conf
# /etc/systemd/zram-generator.conf
[zram0]
zram-size = ram * 0.5
compression-algorithm = zstd
swap-priority = 150
```

```conf
# /etc/sysctl.d/99-swappiness.conf
vm.swappiness=100
# 150 reclaims the directory cache sooner, leaving more free memory
vm.vfs_cache_pressure=150
```

| Fact                | Details                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| First release       | _compcache_ 0.1 in February 2008; included in the mainline kernel in version 3.14 (March 30, 2014)                                        |
| Authors             | Nitin Gupta (_compcache_) and the kernel community, with maintenance by developers such as Minchan Kim and Sergey Senozhatsky             |
| License             | GPL-2.0 (zram); `zram-generator`: MIT                                                                                                     |
| Documentation       | <https://docs.kernel.org/admin-guide/blockdev/zram.html>, <https://wiki.archlinux.org/title/Zram> and <https://wiki.archlinux.org/title/Swap> |
| Source              | <https://github.com/systemd/zram-generator>                                                                                               |

**Installation.** Before configuring zram, here are the basic swap commands. If the swap partition was already active when `genfstab` was run during installation (see [Install Media](../install-media/)), its entry in `/etc/fstab` already exists; a swap file needs its line `/swapfile none swap defaults 0 0`:

```bash
# Show active swap and memory
swapon --show
free -h

# Swap partition: create, enable and disable
mkswap /dev/sda2
swapon /dev/sda2
swapoff /dev/sda2

# Swap file on ext4
mkswap -U clear --size 4G --file /swapfile
swapon /swapfile

# Swap file on Btrfs (in its own subvolume, for example @swap mounted on /swap)
btrfs filesystem mkswapfile --size 4g /swap/swapfile
swapon /swap/swapfile
```

Then install the generator, create the two files above and activate it without rebooting:

```bash
free -h
pacman -S zram-generator

nvim /etc/systemd/zram-generator.conf
nvim /etc/sysctl.d/99-swappiness.conf

systemctl daemon-reload
systemctl start systemd-zram-setup@zram0.service
sysctl --system
```

Verify that zram appears first and with higher priority than the swap partition:

```bash
swapon --show
zramctl
```

On systems without `systemd` (see [PID](../pid/)) `zram-generator` cannot be used, but the same result can be achieved by hand with `zramctl`, creating your own service that runs this at boot:

```bash
modprobe zram
zramctl --find --size 8G --algorithm zstd
mkswap /dev/zram0
swapon --priority 150 /dev/zram0
```

### earlyoom

With zram and swap configured, the system withstands much more memory pressure. But there is a case neither of them solves: when demand grows faster than the ability to compress and swap. That is where the kernel's _OOM killer_ comes in, and its reputation is bad for a concrete reason: it acts late. By the time it fires, the system has been stumbling along for minutes, the cursor does not move and the disk works nonstop; the usual way out is pressing the reset button and losing whatever you were doing.

earlyoom inverts the criterion. Instead of waiting for memory allocation to fail, it watches how much memory and how much swap are free and, when they cross a threshold, kills the process consuming the most memory itself. The system never reaches the frozen state, and what is lost is an application rather than the entire session.

Its main features:

- **Userspace and dependency-free:** a small binary written in C that needs nothing beyond `glibc`. It can be read and audited in full.
- **Continuous monitoring:** it checks available memory up to ten times per second (less often if memory is plentiful), at a negligible CPU cost.
- **Two thresholds, two signals:** by default it acts when less than 10% of memory **and** less than 10% of swap remain (both conditions at once), sends `SIGTERM` to allow a graceful shutdown and, if usage keeps climbing to half of that threshold, escalates to `SIGKILL`.
- **Control over whom to kill:** `--prefer` and `--avoid` accept regular expressions on the process name, and `-P` lets you run a script before killing anything.
- **Works without `systemd`:** as a standalone daemon, it integrates the same way in OpenRC, runit, s6 or dinit (see [PID](../pid/)).

The detail that it requires **both memory and swap to be low at the same time** matters in this configuration: with `vm.swappiness=100` the kernel happily swaps, so swap fills up before memory does. If it only looked at free memory, earlyoom would not react in time.

| Fact                | Details                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| First release       | December 2013 (published on GitHub)                                                   |
| Author              | Jakob Unterwurzacher                                                                  |
| Current version     | 1.9.0 (September 2025)                                                                |
| License             | MIT                                                                                   |
| Documentation       | <https://github.com/rfjakob/earlyoom> and <https://man.archlinux.org/man/earlyoom.1.en> |
| Source              | <https://github.com/rfjakob/earlyoom>                                                 |

**Installation.**

```bash
sudo pacman -S earlyoom
sudo systemctl enable --now earlyoom
```

Check that it is alive and watch its decisions live:

```bash
systemctl status earlyoom
journalctl -u earlyoom -f
```

**Configuration.** The arguments are passed in `/etc/default/earlyoom`, through the `EARLYOOM_ARGS` variable. The following example raises the memory threshold to 15%, avoids killing critical processes and prefers sacrificing browsers over other applications:

```conf
# /etc/default/earlyoom
EARLYOOM_ARGS="-m 15 -s 10 --avoid '(^|/)(systemd|sshd|Xorg|pipewire|knot-resolver)$' --prefer '(^|/)(firefox|chrome|chromium)$'"
```

After editing the file, restart the service:

```bash
sudo systemctl restart earlyoom
```

**How to test it.** The most direct way to verify that it reacts is to deliberately consume memory in one terminal and watch the log from another:

```bash
# In one terminal: consume memory without limits
tail /dev/zero

# In another: follow earlyoom's decisions
journalctl -u earlyoom -f
```

You should see how it detects the situation and kills the process before the desktop freezes.

```bash
systemctl status systemd-oomd
sudo systemctl disable --now systemd-oomd
```

## Zstd

Compressing data always had a dilemma: fast algorithms, like `gzip`, compress little, and those that compress a lot, like `xz`, are slow. That left them relegated to files that are compressed once and stored, and using them on something that is constantly read and written, like a filesystem or memory, was unthinkable. Yann Collet, already known for LZ4, developed Zstandard (`zstd`) at Facebook to close that gap: the first version dates from January 2015 and 1.0 from August 2016. It compresses better than `gzip` at comparable speeds and decompresses very fast, with 22 levels to choose between speed and compression ratio.

Because of that combination it ended up in every layer of a system like the one in this guide:

- **Btrfs:** the kernel has included `zstd` support since version 4.14 (November 2017), and it is enabled with the `compress=zstd` mount option (see [Mounts](../mounts/)).
- **zram:** as the memory compression algorithm (see previous section).
- **Arch packages:** pacman 5.2 supported it in October 2019, and since January 2020 packages from the official repositories are compressed with `zstd` instead of `xz`, which is why you see `.pkg.tar.zst` files today.
- **Initramfs:** `mkinitcpio` can compress it with `zstd` using `COMPRESSION="zstd"` in `/etc/mkinitcpio.conf`.

In practice, the level is chosen according to the use. For something compressed on the fly, like the filesystem, low levels are the right choice because the CPU must not become the bottleneck; high levels are reserved for files that are compressed once:

| Use                 | Recommended level                                                       |
| ------------------- | ----------------------------------------------------------------------- |
| Btrfs (mount)       | `compress=zstd` (default level 3) or `zstd:1` if you prioritize speed   |
| zram                | `zstd` (default level)                                                  |
| Files you store     | `-19` (with `-T0` to use all cores)                                     |

Keep in mind that data that is already compressed (video, JPG photos, `.zst` files) gains nothing and only burns CPU. With Btrfs's `compress` option (not `compress-force`), the system detects it and stops compressing those files, so there is no need to exclude them manually.

| Fact                | Details                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- |
| First release       | January 23, 2015; version 1.0 and open source release on August 31, 2016                    |
| Authors             | Yann Collet (original author, Facebook), with Nick Terrell and Przemysław Skibiński          |
| License             | BSD / GPL-2.0 (dual license)                                                                |
| Standard            | RFC 8878 (replaced the 2018 RFC 8478)                                                       |
| Documentation       | <https://facebook.github.io/zstd/> and <https://wiki.archlinux.org/title/Btrfs#Compression>  |
| Source              | <https://github.com/facebook/zstd>                                                          |

**Installation.** It comes in Arch's base as a dependency of `pacman`; if you need the command-line tool:

```bash
pacman -S zstd
```

Basic usage:

```bash
# Compress and decompress
zstd -T0 -19 file
zstd -d file.zst

# With tar
tar --zstd -cf copy.tar.zst folder/
tar --zstd -xf copy.tar.zst
```

