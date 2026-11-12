---
title: "Terminal"
description: "El emulador y el prompt: de xterm a la GPU (Alacritty, Kitty vs Ghostty) y del PS1 a Oh My Posh y Starship."
category: utilities
tags: ["kitty", "ghostty", "starship", "nerd-font"]
---

La terminal es donde pasarás más tiempo, y se compone de cuatro capas que se apilan: lo que ves en cada línea (el prompt), la ventana donde se dibuja (el emulador de terminal), el intérprete que entiende lo que escribes (el shell) y los programas básicos que se ejecutan por debajo (`ls`, `cp`, `rm`). Esta página cubre las dos primeras capas: el emulador y el prompt; el shell y las coreutils tienen página propia.

## De xterm a los emuladores con GPU

El emulador de terminal más influyente de la historia es **xterm**, que nació a mediados de los años ochenta junto al propio X Window System y sigue manteniéndose hoy. Su importancia es doble: definió de facto las secuencias de escape y códigos de control que todo emulador posterior implementa, y fijó un modelo de renderizado que duró décadas: dibujar el texto con la CPU. Ese modelo se nota al mostrar mucha salida de golpe; además, los emuladores clásicos (xterm, o los basados en VTE como GNOME Terminal) no entienden imágenes, ligaduras ni protocolos de teclado modernos.

El cambio de época llegó con **Alacritty**: Joe Wilm la anunció el 6 de enero de 2017 como el primer emulador acelerado por GPU importante, escrito en Rust y renderizando con OpenGL. Es deliberadamente minimalista (sin pestañas ni divisiones, porque eso pertenece al gestor de ventanas o a un multiplexor como tmux), y demostró que el renderizado por GPU importaba: abrió el camino para toda una generación de emuladores, de los que esta guía compara los dos referentes actuales.

## Kitty vs Ghostty

Kitty, creado por Kovid Goyal también en 2017, siguió ese camino y lo amplió: renderizado acelerado por GPU, un protocolo propio para mostrar imágenes dentro de la terminal, pestañas y divisiones integradas, y _kittens_, pequeños programas que extienden la terminal; se puede controlar desde scripts con su control remoto. Pero dibuja su propia interfaz en lugar de usar la del sistema, así que no se parece al resto de tus aplicaciones.

Ghostty parte de la misma base (GPU, protocolos modernos, incluido el de imágenes de Kitty) con una apuesta distinta: ser una aplicación nativa en cada plataforma. Su autor es Mitchell Hashimoto (cofundador de HashiCorp), empezó el repositorio en 2022, y la versión pública 1.0 salió el 26 de diciembre de 2024 bajo licencia MIT, tras casi dos años de pruebas privadas. Está escrito en Zig y en Linux usa GTK4 (con libadwaita), de modo que se ve y se comporta como el resto de aplicaciones de esta guía. Su configuración es un archivo de texto con buenos valores por defecto, y la biblioteca `libghostty` permite que otras aplicaciones reutilicen su motor. Desde diciembre de 2025 el proyecto tiene como patrocinador fiscal a Hack Club, una organización sin fines de lucro.

La elección depende de lo que priorices. Ghostty encaja mejor con el ecosistema GTK de esta guía y funciona bien sin configurar. Kitty sigue siendo la mejor opción si quieres scripting y control remoto de la terminal, o si ya dependes de sus _kittens_.

| Dato                | Kitty                                  | Ghostty                                                 |
| ------------------- | -------------------------------------- | ------------------------------------------------------- |
| Primera publicación | 2017                                   | 1.0 el 26 de diciembre de 2024 (repositorio desde 2022) |
| Autor               | Kovid Goyal                            | Mitchell Hashimoto y comunidad                          |
| Lenguaje            | C, Python y Go                         | Zig (GTK4 en Linux)                                     |
| Interfaz            | Propia (no usa el toolkit del sistema) | Nativa: GTK4 + libadwaita                               |
| Imágenes            | Protocolo gráfico propio               | Compatible con el protocolo de Kitty                    |
| Extensibilidad      | _Kittens_, control remoto, scripting   | Configuración simple; `libghostty` para integrarlo      |
| Licencia            | GPL-3.0                                | MIT                                                     |
| Documentación       | <https://sw.kovidgoyal.net/kitty/>     | <https://ghostty.org/docs>                              |
| Código              | <https://github.com/kovidgoyal/kitty>  | <https://github.com/ghostty-org/ghostty>                |

**Instalación.**

```bash
sudo pacman -S kitty
sudo pacman -S ghostty
```

Configuración mínima para usar la fuente de Starship (Kitty en `~/.config/kitty/kitty.conf`, Ghostty en `~/.config/ghostty/config`):

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

## Del PS1 a Starship

Un prompt útil muestra algo más que el directorio actual: la rama de Git, si hay cambios sin guardar, la versión del lenguaje del proyecto, el tiempo que tardó el último comando. Hacerlo tradicionalmente significaba pelear con la variable `PS1` de bash, cuyos códigos de escape son ilegibles y están atados a un solo shell. Después vinieron los temas con segmentos de colores (Powerline y derivados, como `powerlevel10k`, que es solo de zsh), que había que reescribir al cambiar de shell.

Dos proyectos rompieron ese aislamiento. **Oh My Posh** comenzó como una evolución de oh-my-posh2 para PowerShell, impulsada por Jan De Dobbeleer, y acabó convertida en un motor de prompts escrito en Go que funciona en prácticamente cualquier shell (bash, zsh, fish, Nushell, PowerShell, cmd) y en cualquier sistema operativo. Sus segmentos se ejecutan en concurrente y cachean resultados, de modo que un prompt con una docena de ellos se renderiza en milisegundos; sus más de cien segmentos se combinan con un lenguaje de plantillas.

**Starship** (Matan Kushner, 2019) siguió la misma idea con una apuesta por la sencillez: un prompt mínimo, rápido y personalizable al que no le importa qué shell uses. Está escrito en Rust y compilado como un solo binario, funciona con bash, zsh, fish, Nushell y otros, y se configura con un único archivo TOML que viaja contigo de un shell a otro. Sus rasgos principales:

- **Módulos contextuales:** solo muestra lo que es relevante en el directorio donde estás (la versión de Rust en un proyecto Rust, la rama en un repositorio Git).
- **Una configuración para todos los shells:** `~/.config/starship.toml`.
- **Presets listos** para empezar sin escribir configuración desde cero.
- **Requiere una fuente con iconos** (_Nerd Font_) para mostrar los símbolos.

| Dato                | Oh My Posh                                             | Starship                               |
| ------------------- | ------------------------------------------------------ | -------------------------------------- |
| Origen              | Descendiente de oh-my-posh2 (PowerShell)               | 2019                                   |
| Autor               | Jan De Dobbeleer y comunidad                           | Matan Kushner y comunidad              |
| Lenguaje y licencia | Go; MIT                                                | Rust; ISC                              |
| Shells              | bash, zsh, fish, Nushell, PowerShell, cmd, entre otros | bash, zsh, fish, Nushell, entre otros  |
| Configuración       | JSON, YAML o TOML                                      | TOML                                   |
| Documentación       | <https://ohmyposh.dev/docs>                            | <https://starship.rs>                  |
| Código              | <https://github.com/JanDeDobbeleer/oh-my-posh>         | <https://github.com/starship/starship> |

Esta guía se queda con Starship por su configuración TOML simple y su enfoque minimalista; Oh My Posh es la alternativa natural si vienes de PowerShell, quieres segmentos más exóticos (más de un centenar) o temas muy elaborados listos para usar.

**Instalación.** Instala el prompt y una fuente con iconos, aplica un preset y actívalo en tu shell:

```bash
sudo pacman -S starship ttf-jetbrains-mono-nerd
starship preset nerd-font-symbols -o ~/.config/starship.toml
```

La activación es una línea al final del archivo de configuración de cada shell:

```bash
# bash (~/.bashrc)
eval "$(starship init bash)"

# zsh (~/.zshrc)
eval "$(starship init zsh)"

# fish (~/.config/fish/config.fish)
starship init fish | source
```
