---
title: "Panel de control"
description: "Evolución de barras y shells: Waybar, QuickShell, AGS y lanzadores."
category: apps
tags: ["ags", "ironbar", "anyrun"]
---

Una compositora como [Hyprland o Niri](./window-manager/) dibuja ventanas, pero no trae nada más: ni barra con el reloj y los espacios de trabajo, ni ajustes rápidos de volumen o red, ni forma de lanzar programas. En un escritorio completo como GNOME o Plasma todo eso viene incluido y es difícil de cambiar; aquí te toca ensamblarlo, y a cambio decides cada pieza.

## Rofi y Wofi (2012, 2020)

Antes de los lanzadores nativos de Wayland, el estándar de facto venía del mundo X11. **Rofi**, de Dave Davenport, empezó en marzo de 2012 como una bifurcación de `simpleswitcher`, un diminuto cambiador de ventanas de Sean Pringle, y terminó absorbiéndolo por completo: añadió modos para lanzar aplicaciones, conectarse por SSH y, sobre todo, reemplazar a `dmenu` con entrada de texto libre. Escrito en C, ligero y configurable con temas en formato rasi (una variante de CSS propia), Rofi se volvió el lanzador universal de los gestores de ventanas en mosaico durante toda la década.

Su talón de Aquiles fue el cambio a Wayland: Rofi se diseñó sobre X11 y XCB, y durante años no funcionó (o funcionaba a medias, vía XWayland) en compositoras nativas. De ahí nació en 2020 **Wofi**, de Seth Barberee: un clon ligero de Rofi escrito en C pero sobre GTK3 y `wlr-layer-shell`, la capa de protocolos que permite dibujar superposiciones en Wayland. Copiaba su modelo mental —modos, atajos, un cuadro de texto— y resolvía el problema de la natividad. Durante unos años fue el lanzador por defecto en las guías de Sway y de la primera etapa de Hyprland.

Ambos envejecieron de maneras distintas. Rofi sigue mantenido y recibió soporte de Wayland (primero mediante el fork `rofi-wayland` de lbonn, cuyos parches llegaron con el tiempo a la rama principal), así que sigue siendo una opción válida si aceptas su propio motor de temas. Wofi, en cambio, está prácticamente detenido: funciona, pero acumula años sin mantenimiento y su base GTK3 queda lejos de las GTK4 de esta guía. Su sucesión natural son los lanzadores que vienen a continuación.

| Dato               | Rofi                                   | Wofi                             |
| ------------------ | -------------------------------------- | -------------------------------- |
| Origen             | Marzo de 2012 (Dave Davenport)         | 2020 (Seth Barberee)             |
| Lenguaje y toolkit | C; X11/XCB (soporte Wayland posterior) | C; GTK3 + wlr-layer-shell        |
| Configuración      | Temas rasi + formatos propios          | CSS + archivo de configuración   |
| Estado             | Mantenido activamente                  | Mantenimiento detenido           |
| Licencia           | MIT                                    | GPL-3.0                          |
| Documentación      | <https://github.com/davatorium/rofi>   | <https://hg.sr.ht/~scoopta/wofi> |

**Instalación.**

```bash
# Rofi (con soporte de Wayland en las versiones recientes)
sudo pacman -S rofi

# Wofi
sudo pacman -S wofi
```

## Waybar: el estándar tradicional (2018)

Waybar (basada en C++ y GTK) creada en 2018, se consolidó como la barra de estado estándar para compositores y gestores de ventanas en mosaico (_tiling window managers_ como Sway y Hyprland).

Creada por Alexays como respuesta a la falta de soluciones modernas para Wayland, Waybar llegó justo cuando wlroots unificaba el soporte para compositoras como Sway, Hyprland y otros. Su éxito radicó en tres cosas: configuración sencilla (JSON + CSS), madurez rápida y una comunidad enorme que generó miles de ejemplos. Para 2020 ya era la opción por defecto en casi todas las guías de Hyprland y Sway.

Waybar sigue siendo hoy la opción más estable y documentada. Funciona bien si quieres una barra funcional sin escribir código: eliges módulos predefinidos, los estilizas con CSS y listo. El costo es la rigidez: si necesitas algo que no cabe en un módulo, hay que programar uno nuevo en C++, algo fuera del alcance de la mayoría.

| Dato               | Detalle                                  |
| ------------------ | ---------------------------------------- |
| Origen             | 2018 (Alexays)                           |
| Lenguaje y toolkit | C++; GTK                                 |
| Configuración      | JSON con comentarios + CSS               |
| Licencia           | MIT                                      |
| Documentación      | <https://github.com/Alexays/Waybar/wiki> |
| Código             | <https://github.com/Alexays/Waybar>      |

**Instalación.**

```bash
sudo pacman -S waybar
mkdir -p ~/.config/waybar
cp /etc/xdg/waybar/config.jsonc /etc/xdg/waybar/style.css ~/.config/waybar/
waybar
```

Para lanzarla con Hyprland, añádela al arranque de tu configuración (ver [Window Manager](./window-manager/)):

```lua
wl.on("startup", function()
  wl.exec("waybar")
end)
```

## Ironbar: Rust + GTK4 (2022)

No todas las herramientas siguen la ruta de JavaScript/QML. Ironbar, de Jake Stanger (agosto de 2022), nació de la frustración con las alternativas existentes: quería un panel completo sin necesidad de programar desde cero. Está escrita en **Rust con GTK4**, y su diseño es multihilo y asíncrono: si un módulo o servicio se bloquea, el resto de la barra sigue funcionando.

La ventaja: seguridad de memoria, menor consumo de recursos y un código base más pequeño y auditable. La desventaja: menos documentación y un ritmo de desarrollo más activo que puede romper configuraciones entre versiones (actualmente en 0.x).

Ironbar encaja mejor con el resto de las aplicaciones GTK4 de esta guía, y su configuración admite varios formatos (JSON, TOML, YAML) además de CSS.

| Dato               | Detalle                                       |
| ------------------ | --------------------------------------------- |
| Origen             | 13 de agosto de 2022 (Jake Stanger)           |
| Lenguaje y toolkit | Rust; GTK4                                    |
| Configuración      | JSON/TOML/YAML + CSS                          |
| Licencia           | MIT                                           |
| Última versión     | 0.19.0 (mayo de 2026)                         |
| Documentación      | <https://github.com/JakeStanger/ironbar/wiki> |
| Código             | <https://github.com/JakeStanger/ironbar>      |

**Instalación.**

```bash
sudo pacman -S ironbar ttf-jetbrains-mono-nerd
ironbar
```

## AGS: la alternativa GTK/TypeScript (2023, 2024)

**Como alternativa dentro del ecosistema GTK, surge en 2023 el proyecto AGS (Aylur's GTK Shell), revolucionando la personalización al permitir definir la interfaz del escritorio utilizando TypeScript / JavaScript y CSS sobre GTK, facilitando la creación de widgets y paneles altamente dinámicos y reactivos.**

AGS (_Aylur's GTK Shell_), creado por Aylur, comenzó como un sucesor espiritual de Eww (una herramienta anterior que usaba XML) pero llevándolo al ecosistema moderno de GTK. La innovación clave: usar **GJS** (el mismo intérprete de JavaScript de GNOME Shell) junto con **Astal**, una colección de bibliotecas en Vala/C que exponen servicios del sistema (red, Bluetooth, batería, MPRIS, bandeja, notificaciones, etc.) como objetos de JavaScript.

**AGS v1** fue el gran éxito de 2023: un marco propio donde la interfaz se describía con funciones de JavaScript (`Widget.Window`, `Widget.Box`…) y las variables reactivas (`Variable`, `bind`) actualizaban la barra sin tocar GTK directamente. Miles de configuraciones se publicaron con él, y dominó el _ricing_ de Hyprland durante un año entero. Después, Aylur tomó una decisión que partió el proyecto: extraer todo lo sustancial hacia las bibliotecas Astal y reducir AGS a un intérprete delgado que ejecuta aplicaciones escritas con ellas. **AGS v2** cambió el modelo mental —los widgets pasaron a escribirse con JSX en TypeScript, las APIs se redistribuyeron entre módulos de Astal— y la versión 1 quedó congelada como legado.

El resultado fue doble. Por un lado, casi todas las configuraciones de la era v1 se rompieron, y la migración costó reescribir el shell completo: muchos usuarios abandonaron en plena transición. Por otro, quedó una separación que hoy conviene conocer antes de copiar cualquier dotfiles de internet: una configuración de AGS v1 no corre en v2 ni al revés, y el paquete antiguo sigue existiendo solo para mantener vivo lo heredado.

| Dato               | AGS v1                       | AGS v2+                                |
| ------------------ | ---------------------------- | -------------------------------------- |
| Período            | 2023 (congelado como legado) | Desde 2024; AGS 3.1.1 en abril de 2026 |
| Modelo de interfaz | Widgets en JS (`Widget.*`)   | JSX en TypeScript sobre Astal          |
| Estado             | Legado, sin nuevas funciones | Desarrollo activo                      |
| Compatibilidad     | Ninguna entre versiones      | Es la base futura del proyecto         |

| Dato                | Detalle                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| Origen              | 2023 (Aylur); primer paquete en el AUR en agosto de 2023                  |
| Lenguaje y toolkit  | GTK 3/4; TypeScript/JSX (GJS) u otros lenguajes con GObject Introspection |
| Recarga en caliente | No por defecto                                                            |
| Licencia            | GPL-3.0                                                                   |
| Documentación       | <https://aylur.github.io/ags/> y <https://aylur.github.io/astal/>         |
| Código              | <https://github.com/Aylur/ags> y <https://github.com/Aylur/astal>         |

**Instalación.** Los dos eras conviven como paquetes distintos:

```bash
# AGS v1 (legado, para configuraciones antiguas)
paru -S aylurs-gtk-shell-v1

# AGS actual (v2 y posteriores, sobre las bibliotecas de Astal)
paru -S aylurs-gtk-shell-v2 libastal-meta
```

Un proyecto nuevo se crea y ejecuta con su CLI:

```bash
ags init -d ~/.config/ags
ags run ~/.config/ags/app.tsx
```

La coherencia visual es su mayor argumento: encaja naturalmente con escritorios GTK (como el de esta guía) y permite usar el ecosistema completo de GTK y libadwaita, manteniendo la coherencia con aplicaciones como Nautilus o GNOME Settings

## QuickShell: la revolución Qt/QML (2023)

**Se crea en 2023 el proyecto QuickShell, dando una explosión en la comunidad de personalización (ricing) al permitir construir barras, widgets y componentes del sistema usando la potencia de Qt y QML de forma nativa en gestores de ventanas Wayland.**

QuickShell, creado por outfoxxed, llegó como respuesta directa a las limitaciones de las barras estáticas. Usando QtQuick y QML —el mismo lenguaje declarativo que KDE emplea en Plasma—, permite definir interfaces complejas con animaciones, transiciones y lógica reactiva sin salir de la configuración. Su característica clave: **recarga en caliente**. Al guardar cambios, el panel se actualiza instantáneamente sin reiniciar, algo que hace tolerable la curva de aprendizaje.

Durante la transición de AGS, buena parte de la comunidad de personalización probó QuickShell y se quedó: hoy es la shell más popular para construir escritorios dinámicos, y la cantidad de temas y ejemplos disponibles creció hasta superar a la de cualquier alternativa, desde una barra mínima hasta un centro de control desplegable con gráficos en tiempo real.

La desventaja es el costo: QML tiene su propia curva de aprendizaje y el entorno de ejecución añade memoria en comparación con una barra estática. Además, el ecosistema de Qt no está tan integrado en escritorios GTK por defecto, lo que requiere configuración adicional de temas.

| Dato                | Detalle                                          |
| ------------------- | ------------------------------------------------ |
| Origen              | 2023–2024 (outfoxxed)                            |
| Lenguaje y toolkit  | QML / QtQuick; Qt 6                              |
| Recarga en caliente | Sí                                               |
| Licencia            | LGPL-3.0                                         |
| Documentación       | <https://quickshell.outfoxxed.me>                |
| Código              | <https://git.outfoxxed.me/quickshell/quickshell> |

**Instalación.**

```bash
paru -S quickshell
```

Un primer panel mínimo en `~/.config/quickshell/shell.qml`:

```qml
import Quickshell
import QtQuick

PanelWindow {
  anchors { top: true; left: true; right: true }
  implicitHeight: 30

  Text {
    anchors.centerIn: parent
    text: "Hola"
    font.pixelSize: 16
  }
}
```

```bash
quickshell
```

## Anyrun y Vicinae: los lanzadores

El último elemento de un escritorio sin menús es el lanzador: una caja de búsqueda que se abre con un atajo y arranca programas. Pero un buen lanzador hace más: calcula, busca archivos, abre ventanas, consulta un diccionario. Como el trabajo cambia mucho según quién lo use, lo importante es que sea extensible.

**Anyrun** es un lanzador nativo de Wayland, escrito en **Rust**, inspirado en KRunner (el de KDE). Usa GTK4 con _layer shell_ y su filosofía está en el nombre: cualquier cosa que pueda trabajar con una entrada de texto y una selección. Todo lo que ofrece son plugins, bibliotecas dinámicas con una API de solo cuatro funciones (aplicaciones, símbolos, diccionario, búsqueda web, un selector tipo dmenu...), y se estiliza con CSS de GTK. Su desarrollo empezó a finales de 2022 y hoy vive en la organización `anyrun-org`.

**Vicinae** toma la dirección contraria: es un lanzador nativo en **C++ y Qt**, con muchos módulos integrados, que se ejecuta como servidor en segundo plano (de modo que se abre al instante) y que es compatible con extensiones de Raycast mediante una capa de compatibilidad. Si vienes de macOS o te gustan los lanzadores tipo Raycast, es la opción más completa.

La elección depende de cuánto quieras integrar. Anyrun es ligero, solo GTK4 y totalmente modular, y es la opción coherente con el ecosistema de esta guía. Vicinae trae mucho más hecho, a cambio de arrastrar Qt (ver [Ecosistema](./ecosystem/)).

| Dato               | Anyrun                                 | Vicinae                                     |
| ------------------ | -------------------------------------- | ------------------------------------------- |
| Origen             | Finales de 2022 (Kirottu)              | Proyecto reciente (2025)                    |
| Autor              | Kirottu y comunidad                    | Comunidad de Vicinae                        |
| Lenguaje y toolkit | Rust; GTK4 + gtk4-layer-shell          | C++; Qt                                     |
| Extensibilidad     | Plugins (bibliotecas dinámicas)        | Módulos integrados y extensiones de Raycast |
| Configuración      | RON (`config.ron`) + CSS               | Interfaz y archivos del propio servidor     |
| Documentación      | <https://github.com/anyrun-org/anyrun> | <https://github.com/vicinaehq/vicinae>      |

**Instalación.**

```bash
paru -S anyrun-git
paru -S vicinae-bin
```

Anyrun busca su configuración en `~/.config/anyrun/` (el archivo `config.ron`, el CSS y la carpeta `plugins/`). Para abrirlo, enlaza el comando `anyrun` a un atajo de teclado en la configuración de tu compositora.

## Filosofías actuales: dos caminos

**En la actualidad, la brecha del escritorio en Linux se ha dividido claramente entre dos filosofías: la hiperpersonalización reactiva mediante herramientas como QuickShell o AGS (asumiendo un mayor consumo de RAM al ejecutar entornos de ejecución como JS/QML), frente al rendimiento extremo y la seguridad que ofrece el desarrollo nativo en Rust.**

| Enfoque                  | Herramientas            | Ventajas                                     | Desventajas                             |
| ------------------------ | ----------------------- | -------------------------------------------- | --------------------------------------- |
| **Hiperpersonalización** | AGS, QuickShell         | Flexibilidad total, animaciones, reactividad | Mayor RAM, curva de aprendizaje         |
| **Minimalismo Rust**     | Ironbar, Anyrun, Waybar | Consumo bajo, seguridad, estabilidad         | Menos flexibilidad, menos documentación |
