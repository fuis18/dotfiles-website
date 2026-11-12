---
title: "Video"
description: "Evolution of players: VLC, mpv and Celluloid."
category: apps
tags: ["vlc", "mpv", "celluloid"]
---

Playing a video seems trivial until the usual problem appears: a file that will not open, out-of-sync subtitles, a video that stutters because the player does not use the graphics card.

## The evolution of video players

### VLC: the universal player (1996–2026)

**VLC was born in 1996 at the École Centrale Paris** as a network video client for students in the VideoLAN project. At the time, playing videos on Linux was an adventure: each format needed proprietary codecs, graphical interfaces were scarce and players could barely handle local files, let alone network streams.

Its creators' vision (Tristan Matthews, Olivier Faure and others on the VideoLAN team) was radically different: **a single program that played absolutely anything with no configuration**. When the project became free software in 2001, that philosophy was codified in the name _VLC Media Player_: a player that bundled all the necessary codecs internally, eliminating the external dependency that caused so many problems on Linux.

The key innovations VLC introduced:

- **Bundled codecs:** you did not need to install extra packages to watch MPEG, AVI, MOV or any format.
- **Network streaming:** it could play HTTP, RTP, UDP streams and torrents before that was common.
- **Tolerance for broken files:** it kept playing even if the file was corrupt or incomplete.
- **Format conversion:** it could transcode videos in real time, something no other player did.

For almost two decades, VLC was **the only viable option** for users who wanted absolute certainty that a video would open. Its Qt interface, though functional, was not elegant, but it worked on Windows, macOS, Linux and hundreds of other platforms.

**The current situation:** the stable version is **3.0.23** (January 2026, the 24th of the 3.0 series), and development is focused on **VLC 4.0**, which as of July 2026 still had no stable desktop version (there is an alpha running on other platforms, with a new QML-based interface). In addition, VLC 3's interface uses Qt and can run through XWayland instead of native Wayland, which adds latency on modern systems.

| Fact                 | Detail                                                |
| -------------------- | ----------------------------------------------------- |
| First release        | 1996 (École Centrale Paris); free software since 2001 |
| Authors              | VideoLAN (project and nonprofit organization)         |
| Latest version       | 3.0.23 (January 2026); 4.0 in development            |
| Language and license | C/C++; GPL-2.0 or later (libVLC under LGPL)           |
| Interface            | Full (Qt), with menus and settings                   |
| Documentation        | <https://docs.videolan.me/vlc-user/desktop/>         |
| Code                 | <https://code.videolan.org/videolan/vlc>             |

**Installation.**

```bash
sudo pacman -S vlc
```

VLC is ideal when you need:

- Play physical DVD/Blu-ray discs
- Convert or transcode formats
- Handle complex network streams
- Open corrupt or partially downloaded files

### mpv: the minimalist engine (2013–2026)

**In 2012, Vincent Lang (wm4)** made a decision that would change the landscape: fork mplayer2 (which itself came from MPlayer, the classic Linux player) to create **mpv**. The goal was clear: **remove all unmaintainable code** and support for very old systems, focusing solely on playback quality and efficiency.

The first stable version was released in **August 2013**, and since then mpv has followed a radical philosophy:

- **No interface by default:** the player has no menus, just a minimal overlay showing basic controls.
- **Configuration through text files:** everything is customized by editing `mpv.conf`, with no dialogs or wizards.
- **Decoupled engine:** `libmpv` lets other applications embed it and build their own interfaces.
- **Hardware decoding and native Wayland:** makes the most of modern GPUs with no middlemen.

What mpv solved that VLC did not do as well:

- **Superior picture quality:** custom shaders, advanced scaling, precise color management.
- **Performance on limited hardware:** lower RAM and CPU usage thanks to simplicity.
- **Full automation:** Lua and JavaScript scripts, JSON IPC interface for remote control.
- **Internet integration:** plays YouTube or other platform links directly via `yt-dlp`.

The cost: **a learning curve**. Without initial configuration, many people miss visible buttons and familiar menus. But those who master it get a player that simply works, with no bloat.

| Fact                 | Detail                                                          |
| -------------------- | --------------------------------------------------------------- |
| Origin               | 2012, fork of mplayer2; first version in August 2013           |
| Author               | Vincent Lang (wm4) and community                                |
| Latest version       | 0.41.0 (December 21, 2025)                                      |
| Language and license | C; GPL-2.0 or later (parts LGPL-2.1+)                           |
| Interface            | Minimal, controlled from the keyboard                          |
| Documentation        | <https://mpv.io/manual/stable/>                                 |
| Code                 | <https://github.com/mpv-player/mpv>                             |

**Installation.** Both are in the official repositories. Add `yt-dlp` if you want to play online video links:

```bash
sudo pacman -S mpv yt-dlp
```

mpv's configuration lives in `~/.config/mpv/`. A starting point with hardware decoding and modern video output:

```ini
# ~/.config/mpv/mpv.conf
profile=gpu-hq
vo=gpu-next
hwdec=auto-safe
keep-open=yes
```

Basic usage: `mpv file.mkv`, `mpv https://…` and, inside the player, `space` to pause and `f` for fullscreen.

### Celluloid: the GTK interface for mpv

**mpv has an entry cost:** without its configuration and minimal interface, many people miss a window with buttons, a visible playlist and settings in a menu. Since mpv separates the engine from the interface with `libmpv`, anyone can build an interface on top without touching the engine, and **Celluloid** (formerly called GNOME MPV) is the GTK one.

Celluloid was born as a direct answer to the need to democratize mpv: providing a familiar graphical experience without sacrificing the power of the underlying engine. It is a simple graphical interface that follows GNOME's interface guidelines, with an integrated title bar, playlist and classic controls.

By using mpv underneath, it inherits:

- **Full format compatibility** (the same as mpv)
- **Hardware decoding** configured automatically
- **The ability to read your own `mpv.conf`** to keep advanced settings

The trade-off is that it is **one more layer**: if mpv changes an option, Celluloid may be slow to reflect it, and it has fewer advanced features than using mpv directly. It is the right choice if you want mpv's quality with a classic window, and plain mpv if you prefer the keyboard and manual configuration.

| Fact                 | Detail                                         |
| -------------------- | ---------------------------------------------- |
| Origin               | GTK interface for mpv, formerly called GNOME MPV |
| Engine               | `libmpv` (mpv)                                 |
| Toolkit              | GTK (with libadwaita in recent versions)       |
| Documentation        | <https://celluloid-player.github.io>           |
| Code                 | <https://github.com/celluloid-player/celluloid> |

**Installation.**

```bash
sudo pacman -S celluloid
```

To make it use your mpv configuration, enable the option to read mpv configuration files in Celluloid's preferences and point it to `~/.config/mpv/mpv.conf`.

## Practical comparison: which one to choose?

| Need                             | Recommended choice | Reason                                                         |
| -------------------------------- | ------------------ | -------------------------------------------------------------- |
| **Simple daily playback**        | Celluloid          | Familiar interface with mpv's power                            |
| **Maximum quality and control**  | mpv + configuration | Custom shaders, full scripting, minimal overhead              |
| **Corrupt files / DVDs**         | VLC                | Extreme tolerance, bundled codecs, format conversion           |
| **YouTube streaming**            | mpv + yt-dlp       | Direct playback without downloading, perfect integration       |
| **Professional projects**        | mpv                | Scripting, automation, integration with other tools            |
| **Diverse multimedia with no setup** | VLC             | "Works without configuring anything" is its reason to exist    |

**This guide's recommendation:**

- Install **mpv as your daily player**, configured once with `gpu-hq`.
- Keep **VLC for what mpv does not do as well** (optical discs, complex streams, conversion).
- Use **Celluloid if mpv's minimal interface feels uncomfortable**, but remember you can always switch to plain mpv when you need more control.

## Relationship with audio

All these players depend on [PipeWire](./audio/) for audio. When you play a video, the audio is automatically routed through the system's audio server. On modern Wayland systems, PipeWire handles both the audio and the video portals that enable screen sharing in video calls.
