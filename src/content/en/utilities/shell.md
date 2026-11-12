---
title: "Shell"
description: "Shells and coreutils: the history of bash, what zsh solved, fish, Nushell and uutils."
category: utilities
tags: ["bash", "zsh", "fish", "nushell", "uutils", "coreutils"]
---

When you type a command, something has to read it, understand it and execute it: that interpreter is the shell. It is the invisible layer of your terminal —the emulator only draws the window, the prompt only decorates it— and, at the same time, a programming language: with it the system's startup scripts and most Unix automations are written. That is why choosing a shell matters beyond convenience: it defines which commands you understand, which scripts you can run and how pleasant it is to talk to your machine.

## From bash to zsh, fish and Nushell

Every modern shell descends from the Bourne shell (Stephen Bourne, 1977), the original Unix interpreter that defined the scripting style we still use. When the GNU project needed a free replacement, Brian Fox wrote bash (Bourne-Again SHell), released in 1989: it inherits Bourne's syntax, incorporates the improvements standardized by POSIX and adds conveniences such as command history. That is why it is today the default shell almost everywhere and the language of most system scripts: learning bash is speaking the lingua franca of Unix. But bash also inherited a limitation of its era: it was designed to run scripts, not to hold a conversation with a person. As a daily interface it is austere: no suggestions, basic autocompletion, and pipelines that only carry text, so every command has to guess where each piece of data starts and ends.

One year after bash, in 1990, Paul Falstad released zsh: a shell that took compatibility as a premise (almost everything you write for bash works) and moved it into the realm of interaction. Its programmable autocompletion system understands the specific arguments of each command, not just file names, and its ecosystem of themes and plugins —which the community would later consolidate with frameworks like oh-my-zsh— popularized the decorated prompt that tools like Starship dominate today. The cost of so much power was complexity: zsh comes almost empty from the factory, and without a configuration framework it does not feel very different from bash.

The next generation questioned something else: why using a shell should require any configuration at all. fish (Axel Liljencrantz, 2005) arrives with everything switched on from the very first moment: suggestions as you type, syntax highlighting and autocompletion that reads the man pages. The price of that polished experience was breaking with tradition: fish is not POSIX-compatible, so its scripts are not bash's. Since version 4.0 (February 27, 2025) it has been rewritten in Rust.

And the most recent bet changes the underlying question: why do shells carry plain text? Nushell (2019, created by Jonathan Turner and Yehuda Katz, among others) makes them carry structured data (tables, records), so filtering, sorting or converting a result feels like working with a spreadsheet. It is written in Rust and, as far as I could confirm, is still in 0.x versions, with changes that can break scripts between versions.

| Fact                | bash                                         | zsh                                | fish                                       | Nushell                                  |
| ------------------- | -------------------------------------------- | ---------------------------------- | ------------------------------------------ | ---------------------------------------- |
| First release       | 1989                                         | 1990                               | 2005                                       | 2019                                     |
| Author              | Brian Fox (GNU project)                      | Paul Falstad                       | Axel Liljencrantz                          | Jonathan Turner, Yehuda Katz, and community |
| Lineage             | Bourne shell + POSIX                         | Bourne-like                        | Own (not POSIX)                            | Own                                      |
| bash-compatible     | —                                            | Mostly                             | No                                         | No                                       |
| Pipelines           | Text                                         | Text                               | Text                                       | Structured data                          |
| Strength            | De facto standard for scripts                | Autocompletion and plugins         | Everything ready out of the box            | Structured data                          |
| Documentation       | <https://www.gnu.org/software/bash/manual/>  | <https://zsh.sourceforge.io/Doc/>  | <https://fishshell.com/docs/current/>      | <https://www.nushell.sh/book/>           |
| Code                | <https://git.savannah.gnu.org/cgit/bash.git> | <https://github.com/zsh-users/zsh> | <https://github.com/fish-shell/fish-shell> | <https://github.com/nushell/nushell>     |

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

| Fact                 | Detail                                                            |
| -------------------- | ----------------------------------------------------------------- |
| Origin               | 2013                                                              |
| Author               | Jordi Boggiano and community                                      |
| Language and license | Rust; MIT                                                         |
| Adoption             | Default in Ubuntu since 25.10; also in AerynOS and Redox OS       |
| Compatibility        | Around 95% of the GNU coreutils tests (version 0.8.0, April 2026) |
| Documentation        | <https://uutils.github.io/coreutils/docs/>                        |
| Code                 | <https://github.com/uutils/coreutils>                             |

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
