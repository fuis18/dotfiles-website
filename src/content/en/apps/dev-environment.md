---
title: "Developer Environment"
description: "Development environment and the evolution of editors"
category: apps
tags: ["fnm", "rustup", "zed", "lazyvim", "neovim", "vscode", "sublime-text"]
---

With `pacman` (see [Package Management](./package-management.md)) you install one version of each language, tied to the system's update cadence. That works for running programs, but not for development: one project needs Node 20, another Node 24, one requires a specific version of Rust and another the nightly build. The solution is to manage languages per user, outside the system, with a version manager for each, and reserve `pacman` for the system.

This page walks through the version managers for Node and Rust, and then traces the historical evolution of code editors from 2008 to 2026, from Sublime Text to Zed, passing through VS Code and Neovim. At the end you will find a reference to the complete ecosystem of modern software organized by discipline.

## fnm: version manager for Node.js

Node.js is the typical case: the version in the distribution's repository is usually one or two releases behind, and there is only one at a time. The classic manager, `nvm`, is a set of shell scripts, which is why it is slow to load every time you open a terminal, and it does not work natively in fish (see [Shell](./shell.md)). **fnm** (_Fast Node Manager_) rewrites it as a single Rust binary, created by Gal Schlezinger (Schniz) around 2019, with the same goal and much more speed.

Its main features:

- **Fast, without heavy shell scripts:** a single executable, compatible with bash, zsh, fish and PowerShell.
- **Automatic version switching:** with `--use-on-cd`, when you enter a folder containing a `.nvmrc` or `.node-version` file, fnm activates the version the project requires.
- **Cross-platform** (Linux, macOS, Windows) and compatible with `nvm`'s version files.

The cost is that of any version manager: Node lives in your user directory, so system scripts do not see it, and global `npm` tools are installed per Node version and have to be reinstalled when you switch.

| Fact                 | Detail                                |
| -------------------- | ------------------------------------- |
| Origin               | Around 2019                           |
| Author               | Gal Schlezinger (Schniz) and community |
| Language and license | Rust; MIT                             |
| Documentation        | <https://github.com/Schniz/fnm#readme> |
| Code                 | <https://github.com/Schniz/fnm>        |

**Installation.**

```bash
sudo pacman -S fnm
```

Enable it in your shell (one line at the end of the configuration file):

```fish
# fish (~/.config/fish/config.fish)
fnm env --use-on-cd --shell fish | source
```

```bash
# bash (~/.bashrc) or zsh (~/.zshrc, with --shell zsh)
eval "$(fnm env --use-on-cd --shell bash)"
```

Basic usage:

```bash
fnm install --lts           # install the latest LTS version
fnm default lts-latest      # use it by default
fnm list                    # installed versions
fnm use 22                  # switch to another version in this session
```

## rustup: Rust toolchain manager

With Rust the same happens, with higher stakes: the language publishes a stable release every six weeks, many tools (like `rust-analyzer`, `clippy` or `rustfmt`) must match the compiler version, and it is common to need to build for other platforms or use the nightly version. The `rust` package in the repository offers only a single stable version, with none of that.

**rustup** is the official toolchain installer for the Rust project. It evolved from `multirust` and reached version 1.0 in 2016. A single command installs or switches between channels (_stable_, _beta_ and _nightly_), adds components and registers build targets. In addition, a `rust-toolchain.toml` file at the root of a project tells it which version to use, so the whole team builds with the same one. Arch offers it in its official repositories, as an alternative to the `rust` package (which installs just one compiler, without switching versions).

The cost is the same as with fnm: the compiler lives in `~/.rustup` and `~/.cargo`, outside `pacman`'s control, and each toolchain takes hundreds of megabytes. It also means that Arch packages that build Rust (for example from the AUR) use their own compiler, not rustup's.

| Fact                 | Detail                                                                         |
| -------------------- | ------------------------------------------------------------------------------ |
| Origin               | Official Rust project; successor to `multirust`; version 1.0 in 2016           |
| Authors              | Rust team (rust-lang) and contributors                                         |
| License              | MIT or Apache-2.0                                                              |
| Documentation        | <https://rust-lang.github.io/rustup/> and <https://wiki.archlinux.org/title/Rust> |
| Code                 | <https://github.com/rust-lang/rustup>                                          |
| Website              | <https://rustup.rs>                                                            |

**Installation.** Install rustup, pick the stable toolchain and add the components your editor uses:

```bash
sudo pacman -S rustup
rustup default stable
rustup component add rust-analyzer clippy rustfmt
```

Add the Cargo binaries to your `PATH`:

```fish
# fish
fish_add_path ~/.cargo/bin
```

```bash
# bash or zsh
export PATH="$HOME/.cargo/bin:$PATH"
```

To pin a project's version, create `rust-toolchain.toml` at its root:

```toml
[toolchain]
channel = "stable"
components = ["rust-analyzer", "clippy", "rustfmt"]
```

## The evolution of editors: from Sublime Text to Zed

With the languages managed, the next step is the editor. But not all editors are alike: each one answered a problem of its era. This section traces the historical evolution from 2008 to 2026, showing how each generation solved the previous one's limitations.

### Sublime Text (2008–2012): speed when everything was slow

In 2008, most editors were slow and heavy. **Sublime Text**, created by Jon Skinner and Jeremy Hodgson in 2008, arrived with a radical proposition: **extreme speed**. Written in C++ and Python, it used the same architecture as TextMate but with its own rendering engine that made it feel instant even on large files.

Its innovations were key:

- **Go to Anything:** opening files and searching symbols in seconds with a single keystroke
- **Multiple Selection:** editing multiple lines at once (a feature VS Code and others later copied)
- **Command palette:** quick access to every feature without memorizing shortcuts
- **Plugin API:** extensibility through Python, opening up the ecosystem

The cost: it was proprietary (with an infinite but annoying evaluation), the interface quickly looked dated, and real-time collaboration did not exist. Still, it set the standard for what an editor should feel like: fast, lightweight and responsive.

### VS Code (2015–2024): the standard with LSP

Microsoft released **Visual Studio Code** in April 2015, and changed the game forever. Written in Electron (HTML/CSS/JavaScript on a Chromium runtime), it had the inherent problem of being heavy on RAM, but made up for it with decisive advantages:

1.  **Language Server Protocol (LSP):** Microsoft created LSP as an open standard for connecting editors with code analyzers. This allowed a single language server (for TypeScript, Python, Rust, etc.) to run in VS Code, Sublime Text, Neovim and others. **It was the most important event for editor interoperability** of the decade.
2.  **Unprecedented extensibility:** a Marketplace with thousands of extensions, native Git integration, integrated terminal.
3.  **Constant updates:** a fast development cycle with new features every month.

The result: VS Code reached **75.9% usage among professional developers in 2025** (Stack Overflow Developer Survey), becoming the dominant editor. Most modern tools assume VS Code as their primary platform.

The persistent criticism: high RAM usage due to Electron, and dependence on Chrome/Chromium as the runtime. For small projects or modest machines, this was noticeable.

### Neovim and LazyVim (2014–2026): total control in the terminal

While Electron dominated, one current kept the tradition of modal editors alive. **Neovim** was born in 2014 as a fork of Vim to modernize it: it kept modal editing (total keyboard control) but allowed configuration in **Lua**, integrated a native LSP client and supported asynchronous plugins.

The problem: an empty Neovim is barely functional. Without autocompletion, without a file tree or fuzzy finder, it takes months of configuration to reach VS Code's level.

**LazyVim**, created by Folke Lemaitre starting in 2023, solved this: a pre-built configuration on `lazy.nvim` (the same author's plugin manager) that turns Neovim into a full IDE with reasonable defaults. Its features:

- **Fast startup:** plugins load on demand
- **LSP, autocompletion, Treesitter, fuzzy finder and file tree** ready to use
- **Language extras:** `:LazyExtras` enables support for TypeScript, Rust, Python, etc.
- **Modular configuration:** your changes go in `lua/plugins/`, the core updates without overwriting them

The stated requirements are Neovim 0.11.2 or higher (LuaJIT), Git 2.19 or higher. With Neovim 0.11 and 0.12 (2025–2026), many features were integrated into the core (LSP, autocompletion, IDE-style keymaps), reducing the dependence on external plugins.

The cost: a steep learning curve (modal editing requires retraining your muscle memory), and complex configuration when something breaks. Ideal for those who live in the terminal and value absolute control.

### Zed Editor (2024–2026): performance and collaboration as the future

Zed was born in 2024 as a direct answer to VS Code's and Electron's problems: **an editor written from scratch in Rust** with GPU acceleration and a multi-process architecture designed for speed and real-time collaboration.

Zed's story is notable: created by **Joshua Moore and Nick Coldwell** (former Atom creators), after the Atom team was dismantled at GitHub/Microsoft. The project receives **$32 million from Sequoia Capital in 2025** and reaches its stable 1.0 version in **April 2026**. It is not just another editor: it is a bet on the future centered on **speed, collaboration and built-in AI**.

Its key features:

- **GPU-accelerated rendering:** interface drawn by the graphics card, not the CPU. Smooth scrolling even on massive files.
- **Real-time collaboration:** multiple developers edit the same file simultaneously, with shared cursors, integrated chat and video calls. Like Google Docs, but for code.
- **Built-in AI (Agent Client Protocol):** real-time code suggestions with models like Claude or GPT-4o, without external extensions.
- **Extreme speed:** millisecond startup, instant search in giant repositories, lag-free symbol navigation.
- **Rust-native:** low RAM usage (a fraction of Electron's), thread-safe design, guaranteed memory safety.

The practical benefit: Zed is **fast where VS Code gets slow**, especially in large repositories or projects with thousands of files. Live collaboration removes the need to share your screen for pair programming.

The trade-off: youth. Version 1.0 in 2026, but it still lacks some of VS Code's mature features: limited built-in debugging, fewer third-party extensions, ecosystem-specific integrations (Azure, .NET) unavailable.

| Fact                 | Detail                                                |
| -------------------- | ----------------------------------------------------- |
| Origin               | 2024 (Atom creators: Joshua Moore and Nick Coldwell) |
| Version 1.0          | April 2026                                           |
| Engine               | Rust (no Electron)                                   |
| Funding              | $32M from Sequoia Capital (2025)                     |
| Platforms            | Linux, macOS, Windows                                |
| License              | Apache-2.0                                           |
| Documentation        | <https://zed.dev>                                    |
| Code                 | <https://github.com/zed-industries/zed>              |

**Zed installation:**

```bash
sudo pacman -S zed
```

**Recommended first-time setup:**

1.  **Configure LSP:** `zed: Install Language Server` for your main language (Rust, TypeScript, Python, etc.)
2.  **Enable AI:** Set your API key in `Settings → AI` to enable suggestions with Claude or GPT
3.  **Create a workspace:** `Command Palette → Create Workspace` for shared projects
4.  **Install themes:** Search for themes in `Extensions` to customize the appearance

### Editor comparison table

| Editor           | Year          | Architecture        | Performance | Maturity             | Ideal for                              |
| ---------------- | ------------- | ------------------- | ----------- | -------------------- | -------------------------------------- |
| **Sublime Text** | 2008          | C++ + Python        | Excellent   | High                 | Those who value speed and simplicity   |
| **VS Code**      | 2015          | Electron (Chromium) | Good        | Very High            | Complete ecosystem, maximum extension  |
| **Neovim**       | 2014 (v0.1+)  | C + LuaJIT          | Excellent   | High                 | Total control, pure terminal           |
| **LazyVim**      | 2023          | Neovim + Lua        | Excellent   | Medium-High          | Pre-configured Neovim                  |
| **Zed**          | 2024          | Rust + GPU          | Excellent   | Young (1.0 in 2026)  | Performance, collaboration, teams      |

## Modern Software Ecosystem

The modern development stack is vast. A single page cannot cover all the disciplines. For a complete reference to the current ecosystem, organized by area of expertise, see this curated knowledge base:

### 📚 Ecosystem Reference

**[fuis18.is-a.dev/software](https://fuis18.is-a.dev/software/)** — A knowledge base for resolving technical decisions about modern tools.

This reference covers five main disciplines:

| Discipline                       | What does it cover?                          | Key tools                                     |
| -------------------------------- | -------------------------------------------- | --------------------------------------------- |
| **Dev** (Development)            | Web, backend, mobile and desktop apps        | Node, Rust, Python, Go, React, Flutter, Electron |
| **Sec** (Security)               | Networks, systems and supply chain           | Burp Suite, Metasploit, OWASP, sigstore, cosign |
| **Ops** (Infrastructure)         | Systems, containers, orchestration           | Docker, Kubernetes, Terraform, Ansible, Prometheus |
| **AI** (Artificial Intelligence) | Models, training, inference                  | PyTorch, TensorFlow, Hugging Face, ONNX, LangChain |
| **Games** (Video games)          | Engines, graphics, physics, audio            | Unity, Unreal Engine, Godot, SDL, Vulkan, FMOD |

**What it's for:**

- Knowing **which tool exists** for a concrete problem
- Understanding **what each tool solves** and its limits
- Choosing **when** to use each one based on context and the current stack
- Staying up to date on **tools in active development**
