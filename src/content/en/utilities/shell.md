---
title: "Shell"
description: "Shell and terminal: Starship, Kitty vs Ghostty, zsh, fish, Nushell and coreutils with uutils."
category: utilities
tags: ["kitty", "ghostty", "zsh", "fish", "nushell", "uutils", "starship"]
---

The terminal is where you will spend the most time, and it is made up of four stacked layers: what you see on each line (the prompt), the window it is drawn in (the terminal emulator), the interpreter that understands what you type (the shell), and the basic programs that run underneath (`ls`, `cp`, `rm`). This page walks through those layers from top to bottom, and on each one explains what problem the chosen technology solved.

## Kitty vs Ghostty

Classic terminal emulators (xterm, or the VTE-based ones like GNOME Terminal) draw text with the CPU, and it shows when displaying a lot of output at once; moreover they do not understand images, ligatures, or modern keyboard protocols. Kitty, created by Kovid Goyal in 2017, was among the first to solve it with GPU-accelerated rendering, its own protocol for displaying images inside the terminal, built-in tabs and splits, and _kittens_, small programs that extend the terminal; it can be controlled from scripts with its remote control. But it draws its own interface instead of using the system's, so it does not look like the rest of your applications.

Ghostty starts from the same base (GPU, modern protocols, including Kitty's image protocol) with a different bet: being a native application on every platform. Its author is Mitchell Hashimoto (co-founder of HashiCorp), he started the repository in 2022, and the public 1.0 release came out on December 26, 2024 under the MIT license, after almost two years of private testing. It is written in Zig and on Linux uses GTK4 (with libadwaita), so it looks and behaves like the rest of the applications in this guide. Its configuration is a text file with good defaults, and the `libghostty` library lets other applications reuse its engine. Since December 2025 the project has Hack Club, a nonprofit organization, as its fiscal sponsor.

The choice depends on what you prioritize. Ghostty fits better with this guide's GTK ecosystem and works well out of the box. Kitty remains the best option if you want scripting and remote control of the terminal, or if you already depend on its _kittens_.

| Fact                | Kitty                                  | Ghostty                                                 |
| ------------------- | -------------------------------------- | ------------------------------------------------------- |
| First release       | 2017                                   | 1.0 on December 26, 2024 (repository since 2022)        |
| Author              | Kovid Goyal                            | Mitchell Hashimoto and community                        |
| Language            | C, Python, and Go                      | Zig (GTK4 on Linux)                                     |
| Interface           | Its own (does not use the system toolkit) | Native: GTK4 + libadwaita                             |
| Images              | Its own graphics protocol              | Compatible with Kitty's protocol                        |
| Extensibility       | _Kittens_, remote control, scripting   | Simple configuration; `libghostty` to integrate it      |
| License             | GPL-3.0                                | MIT                                                     |
| Documentation       | <https://sw.kovidgoyal.net/kitty/>     | <https://ghostty.org/docs>                              |
| Code                | <https://github.com/kovidgoyal/kitty>  | <https://github.com/ghostty-org/ghostty>                |

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

## zsh, fish and Nushell

bash is the default shell almost everywhere and the language of most system scripts, but as a daily interface it is austere: no suggestions, basic autocompletion, and pipelines that only carry text, so every command has to guess where each piece of data starts and ends. Three shells attack it from different angles:

- **zsh** (Paul Falstad, 1990) is the closest to bash: almost everything you write for bash works, and it adds a powerful autocompletion system and a huge plugin ecosystem. The cost is that on its own it comes almost empty, and you end up depending on configuration frameworks to get comfort.
- **fish** (Axel Liljencrantz, 2005) bets on everything working out of the box: suggestions as you type, syntax highlighting, autocompletion that reads the man pages. It is not POSIX-compatible, so its scripts are not bash's. Since version 4.0 (February 27, 2025) it has been rewritten in Rust.
- **Nushell** (2019, created by Jonathan Turner and Yehuda Katz, among others) changes the model: its pipelines carry structured data (tables, records) instead of text, so filtering, sorting, or converting a result feels like working with a spreadsheet. It is written in Rust and, as far as I could confirm, is still in 0.x versions, with changes that can break scripts between versions.

This guide's recommendation is fish as the interactive shell, and keeping bash or sh for system scripts. To avoid breaking anything, instead of changing your login shell with `chsh`, have your terminal run it: that way startup scripts and external tools keep using bash. Nushell is reserved for when you work with data (JSON, CSV, command output); zsh, for whoever needs bash compatibility and its plugins.

| Fact                | zsh                                | fish                                       | Nushell                                  |
| ------------------- | ---------------------------------- | ------------------------------------------ | ---------------------------------------- |
| First release       | 1990                               | 2005                                       | 2019                                     |
| Author              | Paul Falstad                       | Axel Liljencrantz                          | Jonathan Turner, Yehuda Katz, and community |
| Language            | C                                  | Rust (since 4.0, February 2025)            | Rust                                     |
| bash-compatible     | Mostly                             | No                                         | No                                       |
| Pipelines           | Text                               | Text                                       | Structured data                          |
| Documentation       | <https://zsh.sourceforge.io/Doc/>  | <https://fishshell.com/docs/current/>      | <https://www.nushell.sh/book/>           |
| Code                | <https://github.com/zsh-users/zsh> | <https://github.com/fish-shell/fish-shell> | <https://github.com/nushell/nushell>     |

**Installation.**

```bash
sudo pacman -S fish
sudo pacman -S zsh
sudo pacman -S nushell
```

Have your terminal run fish without touching the login shell:

```conf
# kitty.conf
shell /usr/bin/fish
```

```conf
# ghostty/config
command = /usr/bin/fish
```

If you prefer to change your user's shell permanently, and assuming you know how to undo it:

```bash
chsh -s /usr/bin/fish
```

## coreutils (uutils)

Under all of the above are the programs the shell actually runs: `ls`, `cp`, `mv`, `rm`, `cat`, and about a hundred more. They are the GNU coreutils, written in C decades ago. They work and are the reference, but the language they are written in allows memory errors that are hard to detect, and they are the foundation of almost every system script, so a failure there is costly.

uutils (also called Rust Coreutils) is a rewrite of those utilities in Rust, started by Jordi Boggiano in 2013. Its goal is to be a drop-in replacement, so any difference from GNU is considered a bug: it aims to match output and return codes exactly, improve error messages, and also work outside Linux (macOS, Windows). It is no longer an experiment: Ubuntu uses it by default since version 25.10, although in that version it kept GNU's `cp`, `mv`, and `rm` after a security audit, until the project fixed the issues. Version 0.12.0 (September 2026) fixed everything Ubuntu asked to prioritize.

What is still missing is full compatibility: its comparison against the GNU test suite was around 95% in version 0.8.0 (April 2026), and there are still differences in edge cases that an old script might uncover. Also, it has the MIT license, while GNU uses GPL, something part of the community cares about. That is why this guide presents it as a complement you try out, not as a system replacement.

One Arch peculiarity: the official package installs a single binary, `uu-coreutils`, and prefixed links (`uu-ls`, `uu-cp`…), without replacing GNU. This allows both to coexist, and to use them as the default commands in your shell, unprefixed links are created in a directory placed earlier in the `PATH`.

| Fact                | Detail                                                                            |
| ------------------- | --------------------------------------------------------------------------------- |
| Origin              | 2013                                                                              |
| Author              | Jordi Boggiano and community                                                      |
| Language and license | Rust; MIT                                                                         |
| Adoption            | Default in Ubuntu since 25.10; also in AerynOS and Redox OS                       |
| Compatibility       | Around 95% of the GNU coreutils tests (version 0.8.0, April 2026)                 |
| Documentation       | <https://uutils.github.io/coreutils/docs/>                                        |
| Code                | <https://github.com/uutils/coreutils>                                             |

**Installation.** Install the package and try the utilities with their prefix:

```bash
sudo pacman -S uutils-coreutils
uu-ls -la
```

To use them unprefixed only in your shell (system scripts keep using GNU), create the links and add the directory to the front of the `PATH`:

```bash
mkdir -p ~/.local/uubin
for f in /usr/bin/uu-*; do
  ln -sf "$f" ~/.local/uubin/"$(basename "$f" | sed 's/^uu-//')"
done
```

```bash
# bash or zsh (~/.bashrc, ~/.zshrc)
export PATH="$HOME/.local/uubin:$PATH"

# fish (~/.config/fish/config.fish)
fish_add_path --prepend ~/.local/uubin
```

## Starship

A useful prompt shows more than the current directory: the Git branch, whether there are unsaved changes, the project's language version, how long the last command took. Doing it the traditional way meant fighting with bash's `PS1` variable, or depending on a theme that only works in one particular shell (for example `powerlevel10k`, which is zsh-only) and had to be rewritten when switching shells.

In response, Matan Kushner created Starship in 2019: a minimal, fast, customizable prompt that does not care which shell you use. It is written in Rust and compiled as a single binary, works with bash, zsh, fish, Nushell, and others, and is configured with a single TOML file that travels with you from one shell to another. Its main traits:

- **Contextual modules:** it only shows what is relevant in the directory you are in (the Rust version in a Rust project, the branch in a Git repository).
- **One configuration for all shells:** `~/.config/starship.toml`.
- **Ready-made presets** to get started without writing configuration from scratch.
- **Requires an icon font** (_Nerd Font_) to display the symbols.

| Fact                | Detail                                |
| ------------------- | -------------------------------------- |
| First release       | 2019                                   |
| Author              | Matan Kushner and community            |
| Language and license | Rust; ISC                              |
| Documentation       | <https://starship.rs>                  |
| Code                | <https://github.com/starship/starship> |

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
