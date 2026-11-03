---
title: "Panel de control"
description: "Evolución de barras y shells: Waybar, QuickShell, AGS y lanzadores."
category: apps
tags: ["waybar", "quickshell", "ags", "ironbar", "anyrun", "vicinae"]
---

Una compositora como [Hyprland o Niri](./window-manager.md) dibuja ventanas, pero no trae nada más: ni barra con el reloj y los espacios de trabajo, ni ajustes rápidos de volumen o red, ni forma de lanzar programas. En un escritorio completo como GNOME o Plasma todo eso viene incluido y es difícil de cambiar; aquí te toca ensamblarlo, y a cambio decides cada pieza.

## Waybar: el estándar tradicional (2018–2026)

Waybar (basada en C++ y GTK) creada en 2018, se consolidó como la barra de estado estándar para compositores y gestores de ventanas en mosaico** (_tiling window managers_ como Sway y Hyprland).

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

Para lanzarla con Hyprland, añádela al arranque de tu configuración (ver [Window Manager](./window-manager.md)):

```lua
wl.on("startup", function()
  wl.exec("waybar")
end)
```

## QuickShell: la revolución Qt/QML (2024)

**Se crea en 2023 el proyecto QuickShell, dando una explosión en la comunidad de personalización (ricing) al permitir construir barras, widgets y componentes del sistema usando la potencia de Qt y QML de forma nativa en gestores de ventanas Wayland.**

QuickShell, creado por outfoxxed, llegó como respuesta directa a las limitaciones de las barras estáticas. Usando QtQuick y QML —el mismo lenguaje declarativo que KDE emplea en Plasma—, permite definir interfaces complejas con animaciones, transiciones y lógica reactiva sin salir de la configuración. Su característica clave: **recarga en caliente**. Al guardar cambios, el panel se actualiza instantáneamente sin reiniciar.

La ventaja es la flexibilidad: puedes hacer desde una barra mínima hasta un centro de control desplegable con gráficos en tiempo real. La desventaja es el costo: QML tiene una curva de aprendizaje y el entorno de ejecución añade memoria en comparación con una barra estática. Además, el ecosistema de Qt no está tan integrado en escritorios GTK por defecto, lo que requiere configuración adicional de temas.

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

## AGS: la alternativa GTK/TypeScript (2023)

**Como alternativa dentro del ecosistema GTK, surge en 2023 el proyecto AGS (Aylur's GTK Shell), revolucionando la personalización al permitir definir la interfaz del escritorio utilizando TypeScript / JavaScript y CSS sobre GTK, facilitando la creación de widgets y paneles altamente dinámicos y reactivos.**

AGS (_Aylur's GTK Shell_), creado por Aylur, comenzó como un sucesor espiritual de Eww (una herramienta anterior que usaba XML) pero llevándolo al ecosistema moderno de GTK. La innovación clave: usar **GJS** (el mismo intérprete de JavaScript de GNOME Shell) junto con **Astal**, una colección de bibliotecas en Vala/C que exponen servicios del sistema (red, Bluetooth, batería, MPRIS, bandeja, notificaciones, etc.) como objetos de JavaScript.

AGS se divide en dos partes: Astal son las bibliotecas de bajo nivel, y AGS es la herramienta que compila y ejecuta proyectos escritos en TypeScript/JSX. Esto permite usar el ecosistema completo de GTK y libadwaita, manteniendo la coherencia visual con aplicaciones como Nautilus o GNOME Settings.

La diferencia práctica con QuickShell: AGS encaja naturalmente con escritorios GTK (como el de esta guía), pero no recarga en caliente por defecto —hay que reiniciar o recargar manualmente—. QuickShell, en cambio, recarga solo, pero usa componentes QML que requieren estilizar aparte. En ambos casos, el costo es el mismo: escribes y mantienes tu propio código, y las actualizaciones de las bibliotecas pueden romper tu configuración.

| Dato                | Detalle                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| Origen              | 2023 (Aylur); primer paquete en el AUR en agosto de 2023; AGS 3.1.1 en abril de 2026 |
| Lenguaje y toolkit  | GTK 3/4; TypeScript/JSX (GJS) u otros lenguajes con GObject Introspection            |
| Recarga en caliente | No por defecto                                                                       |
| Licencia            | GPL-3.0                                                                              |
| Documentación       | <https://aylur.github.io/ags/> y <https://aylur.github.io/astal/>                    |
| Código              | <https://github.com/Aylur/ags> y <https://github.com/Aylur/astal>                    |

**Instalación.**

```bash
# AGS y las bibliotecas de Astal
paru -S aylurs-gtk-shell libastal-meta
```

Un proyecto nuevo se crea y ejecuta con su CLI:

```bash
ags init -d ~/.config/ags
ags run ~/.config/ags/app.tsx
```

## Ironbar: Rust + GTK4

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

## Anyrun y Vicinae: los lanzadores

El último elemento de un escritorio sin menús es el lanzador: una caja de búsqueda que se abre con un atajo y arranca programas. Pero un buen lanzador hace más: calcula, busca archivos, abre ventanas, consulta un diccionario. Como el trabajo cambia mucho según quién lo use, lo importante es que sea extensible, y los dos de esta guía lo resuelven de formas opuestas.

**Anyrun** es un lanzador nativo de Wayland, escrito en **Rust**, inspirado en KRunner (el de KDE). Usa GTK4 con _layer shell_ y su filosofía está en el nombre: cualquier cosa que pueda trabajar con una entrada de texto y una selección. Todo lo que ofrece son plugins, bibliotecas dinámicas con una API de solo cuatro funciones (aplicaciones, símbolos, diccionario, búsqueda web, un selector tipo dmenu...), y se estiliza con CSS de GTK. Su desarrollo empezó a finales de 2022 y hoy vive en la organización `anyrun-org`.

**Vicinae** toma la dirección contraria: es un lanzador nativo en **C++ y Qt**, con muchos módulos integrados, que se ejecuta como servidor en segundo plano (de modo que se abre al instante) y que es compatible con extensiones de Raycast mediante una capa de compatibilidad. Si vienes de macOS o te gustan los lanzadores tipo Raycast, es la opción más completa.

La elección depende de cuánto quieras integrar. Anyrun es ligero, solo GTK4 y totalmente modular, y es la opción coherente con el ecosistema de esta guía. Vicinae trae mucho más hecho, a cambio de arrastrar Qt (ver [Ecosistema](./ecosystem.md)).

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
