---
title: "Shell"
description: "Shells y coreutils: historia de bash, qué resolvió zsh, fish, Nushell y uutils."
category: utilities
tags: ["bash", "zsh", "fish", "nushell", "uutils", "coreutils"]
---

Cuando escribes un comando, algo tiene que leerlo, entenderlo y ejecutarlo: ese intérprete es el shell. Es la capa invisible de tu terminal —el emulador solo dibuja la ventana, el prompt solo la decora— y, a la vez, un lenguaje de programación: con él se escriben los scripts de arranque del sistema y la mayoría de las automatizaciones de Unix. Por eso elegir shell importa más allá de la comodidad: define qué comandos entiendes, qué scripts puedes correr y qué tan agradable resulta dialogar con tu máquina.

## De bash a zsh, fish y Nushell

Todo shell moderno desciende del Bourne shell (Stephen Bourne, 1977), el intérprete original de Unix que definió el estilo de scripting que aún usamos. Cuando el proyecto GNU necesitó un reemplazo libre, Brian Fox escribió bash (Bourne-Again SHell), publicado en 1989: hereda la sintaxis de Bourne, incorpora las mejoras estandarizadas por POSIX y añade comodidades como el historial de comandos. Por eso es hoy el shell por defecto en casi todas partes y el lenguaje de la mayoría de scripts del sistema: aprender bash es hablar la lengua franca de Unix. Pero bash heredó también una limitación de su época: fue pensado para ejecutar scripts, no para dialogar con una persona. Como interfaz de uso diario es austero: sin sugerencias, con un autocompletado básico y con tuberías que solo transportan texto, de modo que cada comando tiene que adivinar dónde empieza y termina cada dato.

Un año después de bash, en 1990, Paul Falstad publicó zsh: un shell que tomaba la compatibilidad como premisa (casi todo lo que escribes para bash funciona) y lo llevó al terreno de la interacción. Su sistema de autocompletado programable entiende los argumentos específicos de cada comando, no solo los nombres de archivo, y su ecosistema de temas y plugins —que la comunidad consolidaría más tarde con marcos como oh-my-zsh— popularizó la idea del prompt decorado que hoy dominan herramientas como Starship. El costo de tanto poder fue la complejidad: zsh viene casi vacío de fábrica, y sin un marco de configuración no se siente muy distinto a bash.

La siguiente generación cuestionó otra cosa: por qué usar un shell debía requerir configuración alguna. fish (Axel Liljencrantz, 2005) llega con todo encendido desde el primer momento: sugerencias mientras escribes, resaltado de sintaxis y un autocompletado que lee las páginas de manual. El precio de esa experiencia pulida fue romper la tradición: fish no es compatible con POSIX, así que sus scripts no son los de bash. Desde la versión 4.0 (27 de febrero de 2025) está reescrito en Rust.

Y la apuesta más reciente cambia la pregunta de fondo: ¿por qué los shells transportan texto plano? Nushell (2019, creado por Jonathan Turner y Yehuda Katz, entre otros) las hace transportar datos estructurados (tablas, registros), de modo que filtrar, ordenar o convertir un resultado se parece a trabajar con una hoja de cálculo. Está escrito en Rust y, hasta donde pude confirmar, sigue en versiones 0.x, con cambios que pueden romper scripts entre versiones.

| Dato                | bash                                         | zsh                                | fish                                       | Nushell                                  |
| ------------------- | -------------------------------------------- | ---------------------------------- | ------------------------------------------ | ---------------------------------------- |
| Primera publicación | 1989                                         | 1990                               | 2005                                       | 2019                                     |
| Autor               | Brian Fox (proyecto GNU)                     | Paul Falstad                       | Axel Liljencrantz                          | Jonathan Turner, Yehuda Katz y comunidad |
| Linaje              | Bourne shell + POSIX                         | Bourne-like                        | Propio (no POSIX)                          | Propio                                   |
| Compatible con bash | —                                            | Mayormente                         | No                                         | No                                       |
| Tuberías            | Texto                                        | Texto                              | Texto                                      | Datos estructurados                      |
| Punto fuerte        | Estándar de facto para scripts               | Autocompletado y plugins           | Todo listo sin configurar                  | Datos estructurados                      |
| Documentación       | <https://www.gnu.org/software/bash/manual/>  | <https://zsh.sourceforge.io/Doc/>  | <https://fishshell.com/docs/current/>      | <https://www.nushell.sh/book/>           |
| Código              | <https://git.savannah.gnu.org/cgit/bash.git> | <https://github.com/zsh-users/zsh> | <https://github.com/fish-shell/fish-shell> | <https://github.com/nushell/nushell>     |

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
