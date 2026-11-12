---
title: "Terminal"
description: "The emulator and the prompt: from xterm to the GPU (Alacritty, Kitty vs Ghostty) and from PS1 to Oh My Posh and Starship."
category: utilities
tags: ["kitty", "ghostty", "starship", "nerd-font"]
---

The terminal is where you will spend the most time, and it is made up of four stacked layers: what you see on each line (the prompt), the window it is drawn in (the terminal emulator), the interpreter that understands what you type (the shell), and the basic programs that run underneath (`ls`, `cp`, `rm`). This page covers the first two layers: the emulator and the prompt; the shell and the coreutils have their own page.

## From xterm to GPU-accelerated emulators

The most influential terminal emulator in history is **xterm**, which was born in the mid-1980s alongside the X Window System itself and is still maintained today. Its importance is twofold: it defined de facto the escape sequences and control codes that every later emulator implements, and it fixed a rendering model that lasted decades: drawing text with the CPU. That model is noticeable when displaying a lot of output at once; besides, the classic emulators (xterm, or the VTE-based ones like GNOME Terminal) do not understand images, ligatures or modern keyboard protocols.

The change of era arrived with **Alacritty**: Joe Wilm announced it on January 6, 2017 as the first major GPU-accelerated emulator, written in Rust and rendering with OpenGL. It is deliberately minimalist (no tabs or splits, because that belongs to the window manager or a multiplexer like tmux), and it proved that GPU rendering mattered: it opened the way for a whole generation of emulators, of which this guide compares the two current benchmarks.

## Kitty vs Ghostty

Kitty, created by Kovid Goyal also in 2017, followed that path and broadened it: GPU-accelerated rendering, its own protocol for displaying images inside the terminal, built-in tabs and splits, and _kittens_, small programs that extend the terminal; it can be controlled from scripts with its remote control. But it draws its own interface instead of using the system's, so it does not look like the rest of your applications.

Ghostty starts from the same base (GPU, modern protocols, including Kitty's image protocol) with a different bet: being a native application on every platform. Its author is Mitchell Hashimoto (co-founder of HashiCorp), he started the repository in 2022, and the public 1.0 release came out on December 26, 2024 under the MIT license, after almost two years of private testing. It is written in Zig and on Linux uses GTK4 (with libadwaita), so it looks and behaves like the rest of the applications in this guide. Its configuration is a text file with good defaults, and the `libghostty` library lets other applications reuse its engine. Since December 2025 the project has Hack Club, a nonprofit organization, as its fiscal sponsor.

The choice depends on what you prioritize. Ghostty fits better with this guide's GTK ecosystem and works well out of the box. Kitty remains the best option if you want scripting and remote control of the terminal, or if you already depend on its _kittens_.

| Fact          | Kitty                                     | Ghostty                                            |
| ------------- | ----------------------------------------- | -------------------------------------------------- |
| First release | 2017                                      | 1.0 on December 26, 2024 (repository since 2022)   |
| Author        | Kovid Goyal                               | Mitchell Hashimoto and community                   |
| Language      | C, Python, and Go                         | Zig (GTK4 on Linux)                                |
| Interface     | Its own (does not use the system toolkit) | Native: GTK4 + libadwaita                          |
| Images        | Its own graphics protocol                 | Compatible with Kitty's protocol                   |
| Extensibility | _Kittens_, remote control, scripting      | Simple configuration; `libghostty` to integrate it |
| License       | GPL-3.0                                   | MIT                                                |
| Documentation | <https://sw.kovidgoyal.net/kitty/>        | <https://ghostty.org/docs>                         |
| Code          | <https://github.com/kovidgoyal/kitty>     | <https://github.com/ghostty-org/ghostty>           |

**Installation.**

```bash
sudo pacman -S kitty
sudo pacman -S ghostty
```

Minimal configuration to use the Starship font (Kitty in `~/.config/kitty/kitty.conf`, Ghostty in `~/.config/ghostty/config`):

```conf
# kitty.conf
font_family JetBrainsMono Nerd Font
font_size 12.0
```

```conf
# ghostty/config
font-family = JetBrainsMono Nerd Font
font-size = 12
```

## From PS1 to Starship

A useful prompt shows more than the current directory: the Git branch, whether there are unsaved changes, the project's language version, how long the last command took. Doing it the traditional way meant fighting with bash's `PS1` variable, whose escape codes are unreadable and tied to a single shell. Then came the themes with colored segments (Powerline and derivatives, like `powerlevel10k`, which is zsh-only), which had to be rewritten when switching shells.

Two projects broke that isolation. **Oh My Posh** began as an evolution of oh-my-posh2 for PowerShell, driven by Jan De Dobbeleer, and ended up as a prompt engine written in Go that works on practically any shell (bash, zsh, fish, Nushell, PowerShell, cmd) and on any operating system. Its segments run concurrently and cache results, so a prompt with a dozen of them renders in milliseconds; its more than a hundred segments are combined with a template language.

**Starship** (Matan Kushner, 2019) followed the same idea with a bet on simplicity: a minimal, fast, customizable prompt that does not care which shell you use. It is written in Rust and compiled as a single binary, works with bash, zsh, fish, Nushell and others, and is configured with a single TOML file that travels with you from one shell to another. Its main traits:

- **Contextual modules:** it only shows what is relevant in the directory you are in (the Rust version in a Rust project, the branch in a Git repository).
- **One configuration for all shells:** `~/.config/starship.toml`.
- **Ready-made presets** to get started without writing configuration from scratch.
- **Requires an icon font** (_Nerd Font_) to display the symbols.

| Fact                 | Oh My Posh                                             | Starship                               |
| -------------------- | ------------------------------------------------------ | -------------------------------------- |
| Origin               | Descendant of oh-my-posh2 (PowerShell)                 | 2019                                   |
| Author               | Jan De Dobbeleer and community                         | Matan Kushner and community            |
| Language and license | Go; MIT                                                | Rust; ISC                              |
| Shells               | bash, zsh, fish, Nushell, PowerShell, cmd, among others | bash, zsh, fish, Nushell, among others |
| Configuration        | JSON, YAML or TOML                                     | TOML                                   |
| Documentation        | <https://ohmyposh.dev/docs>                            | <https://starship.rs>                  |
| Code                 | <https://github.com/JanDeDobbeleer/oh-my-posh>         | <https://github.com/starship/starship> |

This guide sticks with Starship for its simple TOML configuration and its minimalist approach; Oh My Posh is the natural alternative if you come from PowerShell, want more exotic segments (over a hundred) or very elaborate ready-made themes.

**Installation.** Install the prompt and an icon font, apply a preset, and enable it in your shell:

```bash
sudo pacman -S starship ttf-jetbrains-mono-nerd
starship preset nerd-font-symbols -o ~/.config/starship.toml
```

Enabling it is one line at the end of each shell's configuration file:

```bash
# bash (~/.bashrc)
eval "$(starship init bash)"

# zsh (~/.zshrc)
eval "$(starship init zsh)"

# fish (~/.config/fish/config.fish)
starship init fish | source
```
