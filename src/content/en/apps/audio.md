---
title: "Audio"
description: "System audio with PipeWire and ALSA, plus playback with mpd and ncmpcpp."
category: apps
tags: ["pipewire", "alsa", "mpd", "ncmpcpp"]
---

Sound on Linux works on two levels that should not be confused. At the bottom is the audio server, which shares the sound card among all applications and decides which speaker each thing goes to. At the top is the music player, which only knows how to read your library and send the audio to the server. This page picks one piece for each level and explains why the player should live separate from its interface.

## The evolution of audio in Linux: from ALSA to PipeWire

### ALSA: the kernel layer (1998–2004)

**ALSA** (_Advanced Linux Sound Architecture_) emerged in the late 1990s as a response to a critical gap: the Linux kernel had no decent audio subsystem. Before ALSA there was OSS (_Open Sound System_), but it was proprietary and its licenses were problematic for free software.

The ALSA project started in 1998, led by Jaroslav Křičenský, with the goal of creating a fully free audio subsystem that could handle multiple cards, multiple streams and mix control. It was officially included in kernel 2.5 in 2003 and became the standard in kernel 2.6 (2004).

ALSA has two fundamental traits:

- **Direct hardware control:** it talks straight to the audio chips, providing low-level access with minimal latency.
- **No mixing by default:** if two applications want to play at the same time, ALSA cannot mix them. Only one application can open the device at a time, which forced users to close programs or resort to complex tricks.

This problem —the inability to mix audio from multiple sources— is what drove the creation of the next level.

### PulseAudio: the desktop server (2004–2020)

In 2004, Lennart Poettering released **PulseAudio** (originally called Polypaudio) as a direct answer to ALSA's limitations. The idea was simple: an intermediary server that intercepted all desktop audio and mixed it before handing it to ALSA.

The advantages were clear:

- **Mixing per application:** each program could have its own volume without touching the system controls.
- **Flexible routing:** you could redirect an application's audio to any connected device (speakers, headphones, HDMI).
- **Network-aware:** audio could travel over the network, letting you listen to remote sound.
- **Effect plugins:** equalizers, reverb and real-time audio processing.

But there was a price: **high latency**. PulseAudio introduced a large buffer to handle mixing, which caused problems in professional audio applications (DAWs) where timing precision was critical. For those cases there was **JACK** (_Jack Audio Connection Kit_), created in 1999 by Paul Davis.

### JACK: professional audio (1999)

JACK solved what PulseAudio ignored: **ultra-low latency and precise synchronization**. Designed for musicians and producers, it let you connect audio applications to one another with millisecond reaction times. But it had a serious drawback: it required manual configuration, and regular applications did not work with it.

The result: in the 2010s you had three disconnected worlds:

1. **ALSA** for low level
2. **PulseAudio** for the desktop
3. **JACK** for professional audio

None of them knew how to talk to the others. Musicians used JACK, everyday users PulseAudio, and if you wanted to connect desktop applications with professional tools, you needed complex and fragile bridges.

### PipeWire: unification (2017–2026)

In response, Wim Taymans, at Red Hat, started working on **PipeWire** in **2015**. It was born as a video server (under the provisional names PulseVideo and Pinos) and in early 2017 it took on audio and adopted its current name; the first version dates from June 20, 2017. It was relicensed from LGPL to MIT in November 2018.

Its central idea was that audio and video, and the desktop and professional worlds, are flows that a single server can manage, and that the important thing is not forcing anyone to switch applications:

- **Compatibility with the previous three worlds:** `pipewire-alsa`, `pipewire-pulse` (a drop-in PulseAudio server) and `pipewire-jack` (a drop-in JACK library) make existing applications work without changes.
- **A separate session manager, WirePlumber,** which decides how streams are linked and activates ALSA, Bluetooth and camera devices; it is modular and scripted.
- **Video and screens:** portals (see [XDG Desktop Portals](./portals.md)) request the video stream from PipeWire when you share your screen on a video call.
- **Low latency for professional audio,** with graphical patching tools such as Helvum or qpwgraph.

Fedora 34 (April 2021) was the first distribution to use it for audio by default, and Pop!\_OS, Ubuntu and Debian followed. The cost is that it is a large and relatively young component, and there are still old applications that assume PulseAudio and depend on the compatibility layer.

| Fact                 | Detail                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| First release        | June 20, 2017 (work since 2015); version 1.0 in 2023                               |
| Author               | Wim Taymans (Red Hat) and community                                               |
| Adoption             | Fedora 34 (April 2021), Pop!\_OS 22.04, Ubuntu 22.10 and Debian 12                 |
| Language and license | C; MIT (since November 2018)                                                      |
| Documentation        | <https://docs.pipewire.org> and <https://wiki.archlinux.org/title/PipeWire>        |
| Code                 | <https://gitlab.freedesktop.org/pipewire/pipewire>                                 |
| WirePlumber          | <https://pipewire.pages.freedesktop.org/wireplumber/>                              |

**Installation.** The server, the three compatibility layers and the session manager (pacman will ask you whether it replaces `pulseaudio` if you had it installed):

```bash
sudo pacman -S pipewire pipewire-alsa pipewire-pulse pipewire-jack wireplumber
systemctl --user enable --now pipewire pipewire-pulse wireplumber
```

To check that it works and control the volume from the terminal:

```bash
wpctl status
pactl info | grep "Server Name"
wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
```

If you prefer graphical control, `pavucontrol` and, to patch streams by hand, `qpwgraph`:

```bash
sudo pacman -S pavucontrol qpwgraph
```

On systems without `systemd` (see [PID](./pid.md)), the three processes (`pipewire`, `pipewire-pulse` and `wireplumber`) are launched at user session startup, or by your init's service packages.

## mpd: the daemon music player

Classic music players (Rhythmbox, Amarok and the like) are single applications: the window, the library and playback live in the same process, so if you close the window or the interface hangs, the music stops, and each application scans and manages its own library. The Music Player Daemon (MPD) takes the opposite path, with a client-server architecture. The daemon is what plays, maintains the playlist and the database of your music, and runs in the background; to control it you use a client, which can be a terminal application, a GUI, a script or even a mobile app on another machine on the network, talking to it over a text protocol on TCP.

That separation has practical consequences. The music keeps playing even if you close any client or the graphical session restarts, clients are interchangeable (you can switch interfaces without losing the library) and the daemon can live on a headless server. It was released in 2003, has been maintained for years by Max Kellermann and is written in C++ under the GPL; the most recent stable version I checked is 0.24.12 (May 2026). It includes `mpc`, a simple command-line client.

The only requirement is telling it where to get the sound from, and that is where it connects with PipeWire, which MPD supports as a native output:

| Fact                 | Detail                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------- |
| First release        | 2003                                                                                         |
| Author               | Warren Dukes (creator); maintained by Max Kellermann                                        |
| Language and license | C++; GPL                                                                                     |
| Latest version       | 0.24.12 (May 15, 2026) as checked                                                            |
| Documentation        | <https://www.musicpd.org/doc/> and <https://wiki.archlinux.org/title/Music_Player_Daemon>     |
| Code                 | <https://github.com/MusicPlayerDaemon/MPD>                                                   |

**Installation.** Install the daemon and the `mpc` client, create its configuration in your user directory and start the user service:

```bash
sudo pacman -S mpd mpc
mkdir -p ~/.config/mpd/playlists
```

```conf
# ~/.config/mpd/mpd.conf
music_directory     "~/Music"
playlist_directory  "~/.config/mpd/playlists"
db_file             "~/.config/mpd/database"
state_file          "~/.config/mpd/state"

audio_output {
    type "pipewire"
    name "PipeWire"
}
```

```bash
systemctl --user enable --now mpd
mpc update
mpc add /
mpc play
```

Without `systemd`, just run `mpd` when the session starts (it backgrounds itself).

## ncmpcpp: the terminal client

MPD has no interface of its own, and that forces you to pick a client. The graphical ones are usually pretty but heavy, and the simplest, like `mpc`, are only good for one-off commands. **ncmpcpp** is the most complete terminal client: a text interface (based on ncurses) inspired by `ncmpc`, written by Andrzej Rybczak, designed for people who already live in the terminal (see [Shell](./shell.md)) and want to manage all their music from the keyboard.

Its main features:

- **Built-in tag editor** (artist, album, year…), something rare in an MPD client.
- **Playlist, library and search editors** to find songs without leaving the interface.
- **Spectrum visualizer** and an alternative, configurable interface.
- **Fully remappable keys** and customizable appearance.

One note about its status: the author declares the project in maintenance mode: ncmpcpp is finished for what he needs and he uses it daily, but he has little time to attend to the repository. For a client that does one thing well, that is a minor reason, but it is worth knowing if you depend on a new feature.

| Fact                 | Detail                                                               |
| -------------------- | -------------------------------------------------------------------- |
| Author               | Andrzej Rybczak                                                      |
| Status               | Maintenance mode (feature-complete, little time for issues)          |
| Language and license | C++; GPL-2.0                                                         |
| Documentation        | <https://rybczak.net/ncmpcpp>                                        |
| Code                 | <https://github.com/ncmpcpp/ncmpcpp>                                 |

**Installation.**

```bash
sudo pacman -S ncmpcpp
mkdir -p ~/.config/ncmpcpp
cp /usr/share/doc/ncmpcpp/config ~/.config/ncmpcpp/config
ncmpcpp
```

To enable the visualizer, add a `fifo` output to `mpd.conf` and tell ncmpcpp to read it:

```conf
# ~/.config/mpd/mpd.conf
audio_output {
    type   "fifo"
    name   "visualizer"
    path   "/tmp/mpd.fifo"
    format "44100:16:2"
}
```

```conf
# ~/.config/ncmpcpp/config
visualizer_data_source = /tmp/mpd.fifo
visualizer_output_name = visualizer
visualizer_type = spectrum
```

## Relationship with video

The audio you manage here also affects video: when you play a video with [mpv](./video.md), the audio goes through PipeWire. Likewise, screen captures on video calls use PipeWire to carry both the audio and the video with the same security mechanisms.
