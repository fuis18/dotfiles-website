---
title: "Developer Environment"
description: "Entorno de desarrollo y la evolución de editores"
category: apps
tags: ["fnm", "rustup", "zed", "lazyvim", "neovim", "vscode", "sublime-text"]
---

Con `pacman` (ver [Package Management](./package-management/)) instalas una versión de cada lenguaje, atada al ritmo de actualización del sistema. Eso sirve para ejecutar programas, pero no para desarrollar: un proyecto necesita Node 20, otro Node 24, uno exige una versión concreta de Rust y otro, la versión nocturna. La solución es gestionar los lenguajes por usuario, fuera del sistema, con un administrador de versiones para cada uno, y reservar `pacman` para el sistema.

## fnm: gestor de versiones para Node.js

Node.js es el caso típico: la versión del repositorio de la distribución suele estar una o dos versiones por detrás, y solo hay una a la vez. El administrador clásico, `nvm`, es un conjunto de scripts de shell, y por eso tarda en cargar cada vez que abres una terminal, y no funciona de forma nativa en fish (ver [Shell](./shell/)). **fnm** (_Fast Node Manager_) lo reescribe como un solo binario en Rust, creado por Gal Schlezinger (Schniz) hacia 2019, con el mismo objetivo y mucha más velocidad.

Sus rasgos principales:

- **Rápido y sin scripts de shell pesados:** un único ejecutable, compatible con bash, zsh, fish y PowerShell.
- **Cambio automático de versión:** con `--use-on-cd`, al entrar en una carpeta con un archivo `.nvmrc` o `.node-version`, fnm activa la versión que el proyecto pide.
- **Multiplataforma** (Linux, macOS, Windows) y compatible con los archivos de versión de `nvm`.

El costo es el de cualquier administrador de versiones: Node vive en tu directorio de usuario, así que los scripts del sistema no lo ven, y las herramientas globales de `npm` se instalan por versión de Node y hay que reinstalarlas al cambiar.

| Dato                | Detalle                                |
| ------------------- | -------------------------------------- |
| Origen              | Hacia 2019                             |
| Autor               | Gal Schlezinger (Schniz) y comunidad   |
| Lenguaje y licencia | Rust; MIT                              |
| Documentación       | <https://github.com/Schniz/fnm#readme> |
| Código              | <https://github.com/Schniz/fnm>        |

**Instalación.**

```bash
sudo pacman -S fnm
```

Actívalo en tu shell (una línea al final del archivo de configuración):

```fish
# fish (~/.config/fish/config.fish)
fnm env --use-on-cd --shell fish | source
```

```bash
# bash (~/.bashrc) o zsh (~/.zshrc, con --shell zsh)
eval "$(fnm env --use-on-cd --shell bash)"
```

Uso básico:

```bash
fnm install --lts           # instala la última versión LTS
fnm default lts-latest      # la usa por defecto
fnm list                    # versiones instaladas
fnm use 22                  # cambia a otra versión en esta sesión
```

## rustup: gestor de toolchains de Rust

Con Rust ocurre lo mismo con más exigencia: el lenguaje publica una versión estable cada seis semanas, muchas herramientas (como `rust-analyzer`, `clippy` o `rustfmt`) deben coincidir con la versión del compilador, y es común necesitar compilar para otras plataformas o usar la versión nocturna. El paquete `rust` del repositorio ofrece solo una versión estable, sin nada de eso.

**rustup** es el instalador oficial de toolchains del proyecto Rust. Evolucionó a partir de `multirust` y alcanzó la versión 1.0 en 2016. Un solo comando instala o cambia entre los canales (_stable_, _beta_ y _nightly_), añade componentes y agrega destinos de compilación. Además, un archivo `rust-toolchain.toml` en la raíz de un proyecto le indica qué versión usar, de modo que todo el equipo compila con la misma. Arch lo ofrece en sus repositorios oficiales, como alternativa al paquete `rust` (que instala solo un compilador, sin cambiar de versión).

El costo es el mismo que con fnm: el compilador vive en `~/.rustup` y `~/.cargo`, fuera del control de `pacman`, y cada toolchain ocupa cientos de megabytes. También significa que los paquetes de Arch que compilan Rust (por ejemplo desde el AUR) usan su propio compilador y no el de rustup.

| Dato          | Detalle                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| Origen        | Proyecto oficial de Rust; sucesor de `multirust`; versión 1.0 en 2016           |
| Autores       | Equipo de Rust (rust-lang) y colaboradores                                      |
| Licencia      | MIT o Apache-2.0                                                                |
| Documentación | <https://rust-lang.github.io/rustup/> y <https://wiki.archlinux.org/title/Rust> |
| Código        | <https://github.com/rust-lang/rustup>                                           |
| Sitio         | <https://rustup.rs>                                                             |

**Instalación.** Instala rustup, elige la toolchain estable y añade los componentes que usa tu editor:

```bash
sudo pacman -S rustup
rustup default stable
rustup component add rust-analyzer clippy rustfmt
```

Añade los binarios de Cargo a tu `PATH`:

```fish
# fish
fish_add_path ~/.cargo/bin
```

```bash
# bash o zsh
export PATH="$HOME/.cargo/bin:$PATH"
```

Para fijar la versión de un proyecto, crea `rust-toolchain.toml` en su raíz:

```toml
[toolchain]
channel = "stable"
components = ["rust-analyzer", "clippy", "rustfmt"]
```

## La evolución de los editores: de Sublime Text a Zed

Con los lenguajes gestionados, el siguiente paso es el editor. Pero no todos los editores son iguales: cada uno respondió a un problema de su época.

### Sublime Text (2008–2012): velocidad cuando todo era lento

En 2008, la mayoría de editores eran lentos y pesados. **Sublime Text**, creado por Jon Skinner y Jeremy Hodgson en 2008, llegó con una propuesta radical: **velocidad extrema**. Escrito en C++ y Python, usaba la misma arquitectura que TextMate pero con un motor propio de renderizado que lo hacía sentir instantáneo incluso en archivos grandes.

Sus innovaciones fueron clave:

- **Go to Anything:** apertura de archivos y búsqueda de símbolos en segundos con una sola tecla
- **Multiple Selection:** editar múltiples líneas simultáneamente (una característica que después copiaron VS Code y otros)
- **Paleta de comandos:** acceso rápido a todas las funcionalidades sin memorizar atajos
- **Plugin API:** extensibilidad mediante Python, abriendo el ecosistema

El costo: era propietario (con evaluación infinita pero molesta), la interfaz se veía anticuada rápidamente, y la colaboración en tiempo real no existía. Sin embargo, estableció el estándar de lo que un editor debería sentirse: rápido, ligero y responsive.

### VS Code (2015–2024): el estándar con LSP

Microsoft lanzó **Visual Studio Code** en abril de 2015, y cambió el juego para siempre. Escrito en Electron (HTML/CSS/JavaScript en un runtime de Chromium), tenía el problema inherente de ser pesado en RAM, pero compensó con ventajas decisivas:

1.  **Language Server Protocol (LSP):** Microsoft creó LSP como estándar abierto para conectar editores con analizadores de código. Esto permitió que un solo servidor de lenguaje (para TypeScript, Python, Rust, etc.) funcionara en VS Code, Sublime Text, Neovim y otros. **Fue el evento más importante para la interoperabilidad de editores** en la década.
2.  **Extensibilidad sin precedentes:** Marketplace con miles de extensiones, integración nativa con Git, terminal integrada.
3.  **Actualizaciones constantes:** ciclo de desarrollo rápido con nuevas funcionalidades cada mes.

El resultado: VS Code alcanzó **75.9% de uso entre desarrolladores profesionales en 2025** (Stack Overflow Developer Survey), convirtiéndose en el editor dominante. La mayoría de herramientas modernas asumen VS Code como plataforma principal.

La crítica persistente: consumo de RAM elevado debido a Electron, y dependencia de Chrome/Chromium como runtime. Para proyectos pequeños o máquinas modestas, esto se notaba.

### Neovim y LazyVim (2014–2026): control total en terminal

Mientras Electron dominaba, una corriente mantenía viva la tradición de los editores modales. **Neovim** nació en 2014 como bifurcación de Vim para modernizarlo: conservaba la edición modal (control total por teclado) pero permitía configurarse con **Lua**, integraba un cliente LSP nativo y admitía plugins asíncronos.

El problema: Neovim vacío es apenas funcional. Sin autocompletado, sin árbol de archivos ni buscador, requiere meses de configuración para alcanzar el nivel de VS Code.

**LazyVim**, creado por Folke Lemaitre desde 2023, resolvió esto: una configuración pre-armada sobre `lazy.nvim` (gestor de plugins del mismo autor) que transforma Neovim en un IDE completo con valores por defecto razonables. Sus características:

- **Arranque rápido:** plugins cargan bajo demanda
- **LSP, autocompletado, Treesitter, buscador y árbol de archivos** listos para usar
- **Extras por lenguaje:** `:LazyExtras` activa soporte para TypeScript, Rust, Python, etc.
- **Configuración modular:** tus cambios van en `lua/plugins/`, el núcleo se actualiza sin pisarlos

Los requisitos declarados son Neovim 0.11.2 o superior (LuaJIT), Git 2.19 o superior. Con Neovim 0.11 y 0.12 (2025–2026), muchas funcionalidades se integraron en el núcleo (LSP, autocompletado, keymaps estilo IDE), reduciendo la dependencia de plugins externos.

El costo: curva de aprendizaje alta (edición modal requiere reentrenamiento muscular), y configuración compleja cuando algo falla. Ideal para quienes viven en la terminal y valoran el control absoluto.

### Zed Editor (2024–2026): performance y colaboración como futuro

Zed nace en 2024 como respuesta directa a los problemas de VS Code y Electron: **un editor escrito desde cero en Rust** con GPU acceleration y arquitectura multi-proceso diseñada para velocidad y colaboración en tiempo real.

La historia de Zed es notable: creada por **Joshua Moore y Nick Coldwell** (ex-creadores de Atom), tras ser desmantelado el equipo de Atom en GitHub/Microsoft. El proyecto recibe **$32 millones de Sequoia Capital en 2025** y alcanza su versión 1.0 estable en **abril de 2026**. No es solo un editor más: es una apuesta por el futuro centrada en **velocidad, colaboración y AI integrada**.

Sus características clave:

- **GPU-accelerated rendering:** interfaz dibujada con la tarjeta gráfica, no la CPU. Scroll fluido incluso en archivos masivos.
- **Colaboración en tiempo real:** múltiples desarrolladores editan el mismo archivo simultáneamente, con cursores compartidos, chat integrado y videollamada. Similar a Google Docs pero para código.
- **AI integrada (Agent Client Protocol):** sugerencias de código en tiempo real con modelos como Claude o GPT-4o, sin extensiones externas.
- **Velocidad extrema:** inicio en milisegundos, búsqueda instantánea en repositorios gigantes, navegación de símbolos sin lag.
- **Rust-native:** bajo consumo de RAM (fracción de Electron), diseño thread-safe, seguridad de memoria garantizada.

El beneficio práctico: Zed es **rápido donde VS Code se vuelve lento**, especialmente en repositorios grandes o proyectos con miles de archivos. La colaboración en vivo elimina la necesidad de compartir pantalla para pair programming.

La contrapartida: joven. Version 1.0 en 2026, pero todavía carece de algunas funciones maduras de VS Code: depuración integrada limitada, menos extensiones de terceros, integraciones específicas de ecosistema (Azure, .NET) no disponibles.

| Dato          | Detalle                                                |
| ------------- | ------------------------------------------------------ |
| Origen        | 2024 (creadores de Atom: Joshua Moore y Nick Coldwell) |
| Versión 1.0   | Abril de 2026                                          |
| Motor         | Rust (sin Electron)                                    |
| Financiación  | $32M de Sequoia Capital (2025)                         |
| Plataformas   | Linux, macOS, Windows                                  |
| Licencia      | Apache-2.0                                             |
| Documentación | <https://zed.dev>                                      |
| Código        | <https://github.com/zed-industries/zed>                |

**Instalación de Zed:**

```bash
sudo pacman -S zed
```

**Primera configuración recomendada:**

1.  **Configurar LSP:** `zed: Install Language Server` para tu lenguaje principal (Rust, TypeScript, Python, etc.)
2.  **Habilitar AI:** Configura tu clave de API en `Settings → AI` para activar sugerencias con Claude o GPT
3.  **Crear workspace:** `Command Palette → Create Workspace` para proyectos compartidos
4.  **Instalar temas:** Busca temas en `Extensions` para personalizar apariencia

### Tabla comparativa de editores

| Editor           | Año          | Arquitectura        | Performance | Madurez             | Ideal para                              |
| ---------------- | ------------ | ------------------- | ----------- | ------------------- | --------------------------------------- |
| **Sublime Text** | 2008         | C++ + Python        | Excelente   | Alta                | Quienes valoran velocidad y simplicidad |
| **VS Code**      | 2015         | Electron (Chromium) | Buena       | Muy Alta            | Ecosistema completo, extensión máxima   |
| **Neovim**       | 2014 (v0.1+) | C + LuaJIT          | Excelente   | Alta                | Control total, terminal puro            |
| **LazyVim**      | 2023         | Neovim + Lua        | Excelente   | Media-Alta          | Neovim pre-configurado                  |
| **Zed**          | 2024         | Rust + GPU          | Excelente   | Joven (1.0 en 2026) | Performance, colaboración, equipos      |

## Ecosistema del Software Moderno

El stack de desarrollo moderno es vasto. Una sola página no puede cubrir todas las disciplinas. Para una referencia completa del ecosistema actual, organizado por área de especialización, consulta esta base de conocimiento curada:

### 📚 Referencia del Ecosistema

**[fuis18.is-a.dev/software](https://fuis18.is-a.dev/software/)** — Una base de conocimientos para resolver decisiones técnicas sobre herramientas modernas.

Esta referencia cubre cinco disciplinas principales:

| Disciplina                       | ¿Qué cubre?                                | Herramientas clave                                 |
| -------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| **Dev** (Desarrollo)             | Web, backend, apps móviles y de escritorio | Node, Rust, Python, Go, React, Flutter, Electron   |
| **Sec** (Seguridad)              | Redes, sistemas y cadena de suministro     | Burp Suite, Metasploit, OWASP, sigstore, cosign    |
| **Ops** (Infraestructura)        | Sistemas, contenedores, orquestación       | Docker, Kubernetes, Terraform, Ansible, Prometheus |
| **IA** (Inteligencia Artificial) | Modelos, entrenamiento, inferencia         | PyTorch, TensorFlow, Hugging Face, ONNX, LangChain |
| **Games** (Videojuegos)          | Motores, gráficos, física, audio           | Unity, Unreal Engine, Godot, SDL, Vulkan, FMOD     |

**Para qué sirve:**

- Saber **qué herramienta existe** para un problema concreto
- Entender **qué resuelve** cada herramienta y sus límites
- Elegir **cuándo** usar cada una según contexto y stack vigente
- Mantenerse actualizado sobre **herramientas en desarrollo activo**
