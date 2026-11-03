---
title: "Shell"
description: "Shell y terminal: Starship, Kitty vs Ghostty, zsh, fish, Nushell y coreutils con uutils."
category: utilities
tags: ["kitty", "ghostty", "zsh", "fish", "nushell", "uutils", "starship"]
---

La terminal es donde pasarás más tiempo, y se compone de cuatro capas que se apilan: lo que ves en cada línea (el prompt), la ventana donde se dibuja (el emulador de terminal), el intérprete que entiende lo que escribes (el shell) y los programas básicos que se ejecutan por debajo (`ls`, `cp`, `rm`). Esta página recorre esas capas de arriba abajo, y en cada una explica qué problema resolvió la tecnología elegida.

## Kitty vs Ghostty

Los emuladores de terminal clásicos (xterm, o los basados en VTE como GNOME Terminal) dibujan el texto con la CPU, y se nota al mostrar mucha salida de golpe; además no entienden imágenes, ligaduras ni protocolos de teclado modernos. Kitty, creado por Kovid Goyal en 2017, fue de los primeros en resolverlo con un renderizado acelerado por GPU, un protocolo propio para mostrar imágenes dentro de la terminal, pestañas y divisiones integradas, y _kittens_, pequeños programas que extienden la terminal; se puede controlar desde scripts con su control remoto. Pero dibuja su propia interfaz en lugar de usar la del sistema, así que no se parece al resto de tus aplicaciones.

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

## zsh, fish y Nushell

bash es el shell por defecto en casi todas partes y el lenguaje de la mayoría de scripts del sistema, pero como interfaz de uso diario es austero: sin sugerencias, con un autocompletado básico y con tuberías que solo transportan texto, de modo que cada comando tiene que adivinar dónde empieza y termina cada dato. Tres shells lo atacan desde ángulos distintos:

- **zsh** (Paul Falstad, 1990) es el más cercano a bash: casi todo lo que escribes para bash funciona, y añade un sistema de autocompletado potente y un ecosistema enorme de plugins. El costo es que por sí solo viene casi vacío y se acaba dependiendo de marcos de configuración para tener comodidad.
- **fish** (Axel Liljencrantz, 2005) apuesta por que todo funcione sin configurar: sugerencias mientras escribes, resaltado de sintaxis, autocompletado que lee las páginas de manual. No es compatible con POSIX, así que sus scripts no son los de bash. Desde la versión 4.0 (27 de febrero de 2025) está reescrito en Rust.
- **Nushell** (2019, creado por Jonathan Turner y Yehuda Katz, entre otros) cambia el modelo: sus tuberías transportan datos estructurados (tablas, registros) en lugar de texto, de modo que filtrar, ordenar o convertir un resultado se parece a trabajar con una hoja de cálculo. Está escrito en Rust y, hasta donde pude confirmar, sigue en versiones 0.x, con cambios que pueden romper scripts entre versiones.

La recomendación de esta guía es fish como shell interactivo, y mantener bash o sh para los scripts del sistema. Para no romper nada, en lugar de cambiar tu shell de inicio de sesión con `chsh`, haz que tu terminal lo ejecute: así los scripts de arranque y las herramientas externas siguen usando bash. Nushell se reserva para cuando trabajes con datos (JSON, CSV, resultados de comandos); zsh, para quien necesite compatibilidad con bash y sus plugins.

| Dato                | zsh                                | fish                                       | Nushell                                  |
| ------------------- | ---------------------------------- | ------------------------------------------ | ---------------------------------------- |
| Primera publicación | 1990                               | 2005                                       | 2019                                     |
| Autor               | Paul Falstad                       | Axel Liljencrantz                          | Jonathan Turner, Yehuda Katz y comunidad |
| Lenguaje            | C                                  | Rust (desde 4.0, febrero de 2025)          | Rust                                     |
| Compatible con bash | Mayormente                         | No                                         | No                                       |
| Tuberías            | Texto                              | Texto                                      | Datos estructurados                      |
| Documentación       | <https://zsh.sourceforge.io/Doc/>  | <https://fishshell.com/docs/current/>      | <https://www.nushell.sh/book/>           |
| Código              | <https://github.com/zsh-users/zsh> | <https://github.com/fish-shell/fish-shell> | <https://github.com/nushell/nushell>     |

**Instalación.**

```bash
sudo pacman -S fish
sudo pacman -S zsh
sudo pacman -S nushell
```

Haz que tu terminal ejecute fish sin tocar el shell de inicio de sesión:

```conf
# kitty.conf
shell /usr/bin/fish
```

```conf
# ghostty/config
command = /usr/bin/fish
```

Si prefieres cambiar el shell de tu usuario de forma permanente, y asumiendo que sabes cómo deshacerlo:

```bash
chsh -s /usr/bin/fish
```

## coreutils (uutils)

Bajo todo lo anterior están los programas que el shell ejecuta de verdad: `ls`, `cp`, `mv`, `rm`, `cat` y cerca de un centenar más. Son las GNU coreutils, escritas en C hace décadas. Funcionan y son la referencia, pero el lenguaje en el que están escritas permite errores de memoria que son difíciles de detectar, y son la base de casi todos los scripts del sistema, de modo que un fallo ahí se paga caro.

uutils (también llamado Rust Coreutils) es una reescritura de esas utilidades en Rust, iniciada por Jordi Boggiano en 2013. Su objetivo es ser un reemplazo directo, de modo que cualquier diferencia con GNU se considera un error: busca igualar exactamente la salida y los códigos de retorno, mejorar los mensajes de error y funcionar también fuera de Linux (macOS, Windows). Ya no es un experimento: Ubuntu lo usa por defecto desde la versión 25.10, aunque en esa versión mantuvo las `cp`, `mv` y `rm` de GNU tras una auditoría de seguridad, hasta que el proyecto resolvió los problemas. La versión 0.12.0 (septiembre de 2026) corrigió todo lo que Ubuntu pidió priorizar.

Lo que todavía falta es compatibilidad total: su comparación con el conjunto de pruebas de GNU rondaba el 95 % en la versión 0.8.0 (abril de 2026), y quedan diferencias en casos extremos que un script antiguo podría descubrir. Además, tiene licencia MIT, mientras que GNU usa GPL, algo que a parte de la comunidad le importa. Por eso esta guía lo plantea como un complemento que pruebas, y no como un reemplazo del sistema.

Una particularidad de Arch: el paquete oficial instala un único binario, `uu-coreutils`, y enlaces con prefijo (`uu-ls`, `uu-cp`…), sin reemplazar a GNU. Esto permite convivir con ambos, y para usarlos como los comandos por defecto en tu shell, se crean enlaces sin prefijo en un directorio que se coloca antes en el `PATH`.

| Dato                | Detalle                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| Origen              | 2013                                                                              |
| Autor               | Jordi Boggiano y comunidad                                                        |
| Lenguaje y licencia | Rust; MIT                                                                         |
| Adopción            | Predeterminado en Ubuntu desde 25.10; también en AerynOS y Redox OS               |
| Compatibilidad      | Alrededor del 95 % de las pruebas de GNU coreutils (versión 0.8.0, abril de 2026) |
| Documentación       | <https://uutils.github.io/coreutils/docs/>                                        |
| Código              | <https://github.com/uutils/coreutils>                                             |

**Instalación.** Instala el paquete y prueba las utilidades con su prefijo:

```bash
sudo pacman -S uutils-coreutils
uu-ls -la
```

Para usarlas sin prefijo solo en tu shell (los scripts del sistema siguen usando GNU), crea los enlaces y añade el directorio al principio del `PATH`:

```bash
mkdir -p ~/.local/uubin
for f in /usr/bin/uu-*; do
  ln -sf "$f" ~/.local/uubin/"$(basename "$f" | sed 's/^uu-//')"
done
```

```bash
# bash o zsh (~/.bashrc, ~/.zshrc)
export PATH="$HOME/.local/uubin:$PATH"

# fish (~/.config/fish/config.fish)
fish_add_path --prepend ~/.local/uubin
```

## Starship

Un prompt útil muestra algo más que el directorio actual: la rama de Git, si hay cambios sin guardar, la versión del lenguaje del proyecto, el tiempo que tardó el último comando. Hacerlo tradicionalmente significaba pelear con la variable `PS1` de bash, o depender de un tema que solo funciona en un shell concreto (por ejemplo `powerlevel10k`, que es solo de zsh) y que había que reescribir al cambiar de shell.

Ante ello, Matan Kushner creó Starship en 2019: un prompt mínimo, rápido y personalizable al que no le importa qué shell uses. Está escrito en Rust y compilado como un solo binario, funciona con bash, zsh, fish, Nushell y otros, y se configura con un único archivo TOML que viaja contigo de un shell a otro. Sus rasgos principales:

- **Módulos contextuales:** solo muestra lo que es relevante en el directorio donde estás (la versión de Rust en un proyecto Rust, la rama en un repositorio Git).
- **Una configuración para todos los shells:** `~/.config/starship.toml`.
- **Presets listos** para empezar sin escribir configuración desde cero.
- **Requiere una fuente con iconos** (_Nerd Font_) para mostrar los símbolos.

| Dato                | Detalle                                |
| ------------------- | -------------------------------------- |
| Primera publicación | 2019                                   |
| Autor               | Matan Kushner y comunidad              |
| Lenguaje y licencia | Rust; ISC                              |
| Documentación       | <https://starship.rs>                  |
| Código              | <https://github.com/starship/starship> |

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
