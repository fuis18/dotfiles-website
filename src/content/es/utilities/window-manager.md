---
title: "Window Manager"
description: "Gestores de ventanas para Wayland: Hyprland y Niri."
category: utilities
tags: ["hyprland", "niri", "wayland"]
---

Después del [greeter](./greeter.md) viene el escritorio, y en Wayland el gestor de ventanas es además la compositora: el programa que dibuja la pantalla, gestiona el teclado y el ratón, y decide dónde va cada ventana. No hay un servidor gráfico aparte, así que esta elección define cómo se siente todo el sistema. Esta guía mantiene instalados dos, con filosofías opuestas, y deja que [ReGreet](./greeter.md) te permita elegir cuál iniciar.

## Hyprland

Los escritorios tradicionales (GNOME, KDE) usan ventanas flotantes: tú las colocas y las redimensionas a mano, y todo el tiempo se pierde en ordenarlas. Los gestores _tiling_ de X11, como i3 o bspwm, resolvieron eso colocando las ventanas automáticamente sin solaparse, pero a costa de una estética austera y de las limitaciones de X11. En Wayland, Sway recogió el modelo de i3 con la misma sobriedad. Ante ello, Vaxry (Vaxerski) creó Hyprland: una compositora de _dynamic tiling_ para Wayland que no sacrifica la apariencia.

La primera versión pública, v0.1.0beta, salió el 27 de mayo de 2022. Está escrita en C++, empezó sobre wlroots y hoy usa su propio motor de pantalla (Aquamarine), con un renderizador propio. Sus rasgos principales son:

- **Dynamic tiling:** las ventanas se reparten solas al abrirse y se reacomodan al cerrarse, con dos disposiciones integradas y más disponibles como plugins (`hyprpm`).
- **Apariencia cuidada:** animaciones, esquinas redondeadas, desenfoque y sombras, todo configurable.
- **Configuración que se aplica al guardar**, sin reiniciar la sesión, y control en caliente mediante `hyprctl`.
- **Un ecosistema propio** de herramientas (`hyprlock`, `hypridle`, `hyprpaper` y otras) que comparten estilo y configuración.

Hasta la versión 0.54, la configuración usaba un formato propio (`hyprlang`, en `hyprland.conf`). En la versión 0.55 (mayo de 2026) se añadió un sistema de configuración basado en Lua, que permite escribir lógica real (condiciones, funciones, eventos) en lugar de solo listas de opciones; el sistema anterior se conserva si no hay un archivo Lua.

Esa velocidad de cambio es también su principal costo: Hyprland sigue en versiones 0.x y ha cambiado de formato de configuración más de una vez, así que una actualización puede romper tu configuración y conviene leer las notas de cada versión. Es la compositora con más personalización, y la que más mantenimiento te pide.

| Dato                | Detalle                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| Primera publicación | 27 de mayo de 2022 (v0.1.0beta)                                                 |
| Autor               | Vaxry (Vaxerski) y comunidad                                                    |
| Lenguaje y licencia | C++; BSD-3-Clause                                                               |
| Última versión      | 0.56.2 (5 de agosto de 2026) según lo consultado; Lua desde 0.55 (mayo de 2026) |
| Documentación       | <https://wiki.hypr.land> y <https://wiki.archlinux.org/title/Hyprland>          |
| Código              | <https://github.com/hyprwm/Hyprland>                                            |
| Sitio               | <https://hypr.land>                                                             |

**Instalación.** Instálalo y arráncalo desde una tty (nunca con `sudo`) o elígelo en el greeter:

```bash
sudo pacman -S hyprland
start-hyprland
```

Con la configuración en Lua, el archivo es `~/.config/hypr/hyprland.lua`. Un ejemplo mínimo que lanza una barra al iniciar la sesión (confirma la sintaxis exacta en la wiki de tu versión, porque es reciente):

```lua
hl.on("hyprland.start", function()
  hl.exec_cmd("waybar")
end)
```

Para que los portales (captura de pantalla, selector de archivos) funcionen, el entorno de la sesión debe estar disponible para ellos; ver [XDG Desktop Portals](./portals.md).

## Niri

En Hyprland, como en i3, cada ventana nueva se hace sitio reduciendo a las demás: abre cinco ventanas y todas quedan estrechas, y las que ya tenías cambian de tamaño sin que lo pidas. El _tiling_ dinámico resuelve el desorden, pero a costa de que el espacio de la pantalla sea un juego de suma cero.

Niri parte de otra idea, tomada del PaperWM (una extensión de GNOME): las ventanas se organizan en columnas sobre una franja infinita que se extiende hacia la derecha, y abrir una ventana nueva nunca cambia el tamaño de las existentes. Para ver más, te desplazas por la franja. Fue creado por Ivan Molodetskikh (YaLTeR), escrito en Rust sobre el kit Smithay, y su desarrollo empezó en 2023. Entre sus rasgos principales:

- **Cada monitor tiene su propia franja** y sus propios espacios de trabajo dinámicos apilados verticalmente, de modo que los monitores no se mezclan entre sí.
- **Captura de pantalla integrada** y grabación del monitor mediante el portal de GNOME (ver [XDG Desktop Portals](./portals.md)).
- **Configuración en KDL** (`~/.config/niri/config.kdl`) que se recarga al guardar, con `niri validate` para comprobarla antes de aplicarla.
- **Control desde el terminal** con `niri msg`, que devuelve datos en JSON para scripts.

Su ritmo es más pausado y predecible: desde 2025 numera sus versiones por fecha (25.02, 25.05, 25.08…), y la 26.04 (abril de 2026) añadió efectos de desenfoque y archivos de configuración opcionales con `include`. El costo es que el modelo de columnas desplazables es una forma distinta de trabajar y requiere acostumbrarse, y que tiene menos efectos visuales que Hyprland.

| Dato                | Hyprland                             | Niri                                                                       |
| ------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| Modelo de ventanas  | Dynamic tiling (se reacomodan)       | Scrollable tiling (columnas en franja infinita)                            |
| Primera publicación | 27 de mayo de 2022                   | Desarrollo desde 2023                                                      |
| Autor               | Vaxry (Vaxerski)                     | Ivan Molodetskikh (YaLTeR)                                                 |
| Lenguaje            | C++                                  | Rust (Smithay)                                                             |
| Configuración       | Lua (desde 0.55); antes `hyprlang`   | KDL                                                                        |
| Licencia            | BSD-3-Clause                         | GPL-3.0                                                                    |
| Última versión      | 0.56.2 (agosto de 2026)              | 26.04 (abril de 2026)                                                      |
| Documentación       | <https://wiki.hypr.land>             | <https://yalter.github.io/niri/> y <https://wiki.archlinux.org/title/Niri> |
| Código              | <https://github.com/hyprwm/Hyprland> | <https://github.com/niri-wm/niri>                                          |

**Instalación.**

```bash
sudo pacman -S niri
niri-session
```

`niri-session` arranca Niri como servicio de la sesión; si prefieres hacerlo sin ese servicio, `niri --session` lo inicia directamente. Si no existe un archivo de configuración, Niri usa uno por defecto; para personalizarlo, copia el de ejemplo y edítalo (la ruta puede variar según el paquete):

```bash
mkdir -p ~/.config/niri
cp /usr/share/doc/niri/default-config.kdl ~/.config/niri/config.kdl
niri validate
```

Niri incluye archivos de servicio también para `dinit`, útiles en Artix (ver [PID](./pid.md)).
