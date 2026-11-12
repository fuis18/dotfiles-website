---
title: "Ecosistema"
description: "Evolución de los toolkits: Qt, GTK y iced-cosmic."
category: apps
tags: ["gtk", "qt", "iced", "cosmic"]
---

Un toolkit es la biblioteca con la que una aplicación dibuja sus ventanas, botones y menús, y es la decisión que más condiciona a todas las aplicaciones de esta sección: define cómo se ven, cuánta memoria usan, cómo se les aplica un tema y qué bibliotecas arrastra cada una al sistema. Mezclar toolkits funciona, pero cada uno trae sus propias dependencias y su propio criterio de apariencia, así que conviene elegir uno como base y tratar a los demás como excepciones.

## Historia

**Alrededor de 1995**, Troll Tech (Noruega) publica la primera versión pública de Qt (0.90), escrita en C++. Su atractivo era doble: permitía construir interfaces gráficas complejas con un solo toolkit multiplataforma y ofrecía un modelo de licenciamiento flexible. Era de código abierto en parte, pero con condiciones que a la comunidad del software libre no le bastaban.

**En 1996** se fundó el proyecto KDE, adoptando Qt como pilar técnico. Una de sus mayores ventajas radicaba en que, al mantener un entorno unificado en Qt, el consumo de memoria se optimizaba al máximo: el sistema y las aplicaciones compartían las mismas bibliotecas cargadas en RAM. Para los usuarios que montaban un escritorio KDE completo, las aplicaciones Qt eran ligeras porque no duplicaban dependencias.

**En 1997**, como respuesta directa a la cuestión de las licencias de Qt, se creó GTK (originalmente _GIMP ToolKit_), escrito en C. Sus autores, Spencer Kimball y Peter Mattis, lo habían desarrollado para dar vida al editor de imágenes GIMP, pero rápidamente se convirtió en el motor gráfico preferido para el proyecto GNOME, que acababa de fundarse. GNOME apostó por la simplicidad, la modularidad y una experiencia de usuario limpia y enfocada.

**Para 2020** llega GTK4 con una nueva arquitectura enfocada en el rendimiento mediante aceleración por GPU (Vulkan y OpenGL), redefiniendo las reglas del diseño en GNOME e introduciendo librerías como libadwaita para garantizar interfaces adaptativas y coherentes. La versión 4.0 se publicó el 16 de diciembre de 2020.

**Ventajas iniciales de Qt:** bajo consumo de RAM, **siempre y cuando tuvieras el escritorio completo** — KDE—. Para los usuarios minimalistas el ecosistema de GTK era más atractivo y modulable, ya que no cargaba toda la infraestructura de KDE si solo querías unas pocas aplicaciones.

## GTK: el estándar modular (1997 – Actualidad)

GTK se convirtió en la base de casi todo lo que ya usamos hoy en día. La versión actual es GTK 4, publicada el 16 de diciembre de 2020, con un renderizado acelerado por GPU y pensada para Wayland. Sobre ella se apoya libadwaita, la biblioteca de widgets de GNOME que da a las aplicaciones un estilo coherente y se adapta a pantallas de distintos tamaños. GTK 3 sigue existiendo, pero a marzo de 2026 su desarrollo se reduce a un lanzamiento por año.

GTK es el toolkit de [ReGreet](../../utilities/greeter/), [Ghostty](../../utilities/shell/), el backend [xdg-desktop-portal-gnome](../../utilities/portals/), Nautilus, Epiphany, Celluloid y [AGS](../control-panel/). Sus rasgos principales:

- **Una convención de apariencia clara:** libadwaita define estilos, tamaños y comportamiento, de modo que las aplicaciones se parecen entre sí sin configurar nada.
- **El tema oscuro se pide por una sola vía:** el ajuste `color-scheme` se propaga a las aplicaciones a través del portal de ajustes.
- **Una limitación deliberada:** las aplicaciones libadwaita ignoran los temas GTK de terceros; solo se personalizan con CSS propio en `~/.config/gtk-4.0/gtk.css`.

### gtk-rs: GTK en Rust

Gracias a la librería **gtk-rs** (GTK bindings para Rust), el ecosistema de GTK ha ganado mucha atención por su rendimiento y seguridad. Rust elimina los errores de memoria inherentes a C/C++, y gtk-rs permite escribir aplicaciones GTK seguras sin sacrificar compatibilidad. Esto ha atraído a nuevos desarrolladores que quieren lo mejor de ambos mundos: la madurez de GTK con la seguridad de Rust.

| Dato           | Detalle                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Origen         | Medios de los años 90, para GIMP (Spencer Kimball y Peter Mattis)                 |
| Mantenedor     | Proyecto GNOME                                                                    |
| Versión actual | GTK 4 (4.0 el 16 de diciembre de 2020); libadwaita 1.8 (septiembre de 2025)       |
| Lenguaje       | C; bindings para Rust disponibles (gtk-rs)                                        |
| Licencia       | LGPL-2.1 o posterior                                                              |
| Documentación  | <https://docs.gtk.org/gtk4/> y <https://gnome.pages.gitlab.gnome.org/libadwaita/> |
| Código         | <https://gitlab.gnome.org/GNOME/gtk>                                              |

**Instalación.** Instala GTK 4 y libadwaita, GTK 3 para las aplicaciones antiguas y una herramienta para ajustar el tema fuera de GNOME:

```bash
sudo pacman -S gtk4 libadwaita gtk3 nwg-look
gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
```

## Qt: el poder en C++ (1995 - Actualidad)

Qt está escrito en C++ y se complementa con QML y Qt Quick, un lenguaje declarativo para interfaces animadas, que es justo lo que usan [QuickShell](../control-panel/) y [Vicinae](../control-panel/) para construir paneles y lanzadores. Es también el toolkit de KDE y de aplicaciones como OBS o VLC.

La empresa noruega Troll Tech publicó su primera versión pública (Qt 0.90) el 20 de mayo de 1995, creado por Haavard Nord y Eirik Chambe-Eng. Era de código abierto solo en parte, con una licencia que a la comunidad del software libre no le bastaba. Esa inquietud llevó a la creación de GNOME como alternativa, y en 1998 a la fundación KDE Free Qt Foundation, que garantiza que Qt seguirá disponible como software libre. Desde 2000 se ofrece bajo GPL y, desde la versión 4.5 (2009), también bajo LGPL. Hoy lo desarrolla The Qt Company, y su versión actual, Qt 6, salió en diciembre de 2020.

Usar Qt en un escritorio basado en GTK tiene un costo conocido: las aplicaciones traen sus propias bibliotecas y, sin configuración, se ven distintas al resto. Se resuelve con dos piezas: `qt6ct`, que permite elegir tema, fuente e iconos de Qt fuera de KDE, y Kvantum, un motor de temas que permite imitar el aspecto del resto del escritorio. En Wayland hace falta además el módulo `qt6-wayland`. Un caso que ilustra que los ecosistemas se mezclan: EasyEffects, un clásico de GTK, pasó de GTK4 a Qt con su versión 8.0 (noviembre de 2025).

| Dato                | Detalle                                                                          |
| ------------------- | -------------------------------------------------------------------------------- |
| Primera publicación | 20 de mayo de 1995 (Qt 0.90, Troll Tech); Qt 6 en diciembre de 2020              |
| Autores             | Haavard Nord y Eirik Chambe-Eng (Troll Tech); hoy, The Qt Company y la comunidad |
| Lenguaje y licencia | C++ (más QML); LGPL-3, GPL o comercial                                           |
| Documentación       | <https://doc.qt.io>                                                              |
| Código              | <https://code.qt.io/cgit/qt/>                                                    |
| Utilidades          | <https://github.com/trialuser02/qt6ct> y <https://github.com/tsujan/Kvantum>     |

**Instalación.** Qt base con soporte de Wayland, más las herramientas de tema; después, indica a Qt cuál usar:

```bash
sudo pacman -S qt6-base qt6-wayland qt6ct kvantum
```

```bash
# En el entorno de tu sesión (por ejemplo, en tu configuración de Hyprland o Niri)
export QT_QPA_PLATFORMTHEME=qt6ct
```

## iced-cosmic: todo en Rust (2024–2026)

GTK y Qt comparten un rasgo: están escritos en C y C++, lenguajes en los que un error de memoria es fácil de cometer y difícil de encontrar, y para usarlos desde Rust hace falta una capa de enlaces que añade complejidad. **iced** parte de cero en Rust: es un toolkit puramente en Rust, creado por Héctor Ramón (hecrj), con un modelo de programación reactivo inspirado en la arquitectura de Elm, donde la interfaz es una función del estado de la aplicación. Su propio repositorio lo describe como experimental, pero lo suficientemente sólido como para sostener un escritorio completo.

Ese escritorio es **COSMIC**, de System76. Empezó como una versión modificada de GNOME para Pop!\_OS y se reescribió desde cero sobre iced, con una biblioteca propia, `libcosmic`, que añade widgets, un sistema de temas y integración con el escritorio: eso es lo que esta sección llama iced-cosmic. La primera alfa salió el 5 de agosto de 2024 y la versión 1.0 (_Epoch 1_), el 11 de diciembre de 2025 junto con Pop!\_OS 24.04 LTS; la 1.2.0 es de julio de 2026. Es solo para Wayland, no está atado a una distribución, y sus bibliotecas se publican bajo MPL-2.0 y sus aplicaciones bajo GPL-3.0.

Dos detalles: No espera `systemd` (su documentación en Alpine lo describe como pensado para ser portable, y la versión 1.1 añadió soporte de OpenRC para Bluetooth), y su gestor de ajustes ya usa Varlink en lugar de D-Bus (ver [dbus](../../utilities/dbus/)).

**Notable:** System76 optó por desarrollar todo en Rust porque busca eliminar por completo los errores de memoria que son comunes en C y C++. No se trata solo de rendimiento, sino de **seguridad garantizada en tiempo de compilación**. El costo es la madurez: el ecosistema de aplicaciones es pequeño y, según los análisis de su lanzamiento, el pulido de las aplicaciones y la documentación todavía están en trabajo. Por eso no lo tomamos como base, pero sí recomienda probar sus aplicaciones sueltas (archivos, terminal, editor) como alternativa a las de GTK, y seguir su evolución si te interesa desarrollar en Rust.

| Dato                | Detalle                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| Origen              | iced: Héctor Ramón (hecrj); libcosmic y COSMIC: System76                                              |
| Hitos               | Primera alfa de COSMIC el 5 de agosto de 2024; 1.0 el 11 de diciembre de 2025; 1.2.0 en julio de 2026 |
| Lenguaje y licencia | Rust; bibliotecas MPL-2.0, aplicaciones GPL-3.0                                                       |
| Documentación       | <https://iced.rs> y <https://system76.com/cosmic>                                                     |
| Código              | <https://github.com/iced-rs/iced> y <https://github.com/pop-os/libcosmic>                             |

**Instalación.** Las aplicaciones de COSMIC se pueden instalar sueltas, sin el escritorio completo (confirma los nombres de paquete disponibles en tu repositorio):

```bash
sudo pacman -S cosmic-files cosmic-term cosmic-edit
```

Para desarrollar con libcosmic hay una plantilla de aplicación que genera un proyecto listo para compilar (requiere `rustup`, ver [Developer Environment](../dev-environment/)):

```bash
cargo install cargo-generate
cargo generate gh:pop-os/cosmic-app-template
```

## Comparativa rápida

| Aspecto           | GTK                             | Qt                             | iced-cosmic                |
| ----------------- | ------------------------------- | ------------------------------ | -------------------------- |
| Año de origen     | 1997 (GIMP)                     | 1995 (Troll Tech)              | 2024 (System76)            |
| Lenguaje          | C                               | C++                            | Rust                       |
| Seguridad memoria | Riesgo manual (C)               | Riesgo manual (C++)            | Garantizada (Rust)         |
| Madurez           | Alta (30 años)                  | Alta (30 años)                 | Experimental               |
| Consumo RAM       | Moderado (sin entorno completo) | Bajo (con escritorio completo) | Similar a GTK              |
| Temas             | Libadwaita (integrado)          | Kvantum / qt6ct                | Propio (cosmic-settings)   |
| Ideal para        | Escritorio GNOME, modularidad   | KDE, aplicaciones complejas    | Desarrollo Rust, futurismo |
