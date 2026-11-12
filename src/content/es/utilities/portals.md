---
title: "XDG Desktop Portals"
description: "Comunicación entre aplicaciones y el escritorio en Wayland"
category: utilities
tags: ["xdg", "portals", "wayland"]
---

En el viejo mundo de X11, cualquier aplicación podía leer la pantalla entera, capturar el teclado y listar las ventanas de las demás, sin pedir permiso. Wayland corrigió esa falta de aislamiento, pero con un costo: una aplicación ya no puede simplemente tomar una captura de pantalla, ni abrir un selector de archivos del sistema, ni compartir tu pantalla en una videollamada. Alguien tiene que hacerlo por ella, preguntándote antes. Ese alguien son los portales, y como funcionan sobre D-Bus (ver [dbus](../dbus/)), dependen de él.

Los portales nacieron en el proyecto Flatpak, de la mano de Alexander Larsson (Red Hat), para que las aplicaciones aisladas en un contenedor pudieran acceder a recursos fuera de él de forma controlada, pero hoy sirven a cualquier aplicación. Funcionan en dos capas. La primera, `xdg-desktop-portal`, es un servicio que recibe las peticiones de las aplicaciones. La segunda son los _backends_, programas que conocen tu compositora y saben cómo cumplir la petición: capturar una pantalla, mostrar el selector de archivos, pedirte confirmación. Cada backend declara qué interfaces implementa y para qué escritorios, y un archivo `portals.conf` elige cuál usar para cada una.

Dos detalles prácticos antes de pasar a los backends. El primero es la configuración: `xdg-desktop-portal` busca primero un archivo específico para el escritorio actual (por ejemplo `hyprland-portals.conf` o `niri-portals.conf`, según `XDG_CURRENT_DESKTOP`), y si no lo encuentra, uno general (`portals.conf`). El segundo es el entorno: para que el backend funcione, las variables `XDG_CURRENT_DESKTOP` y `WAYLAND_DISPLAY` tienen que estar disponibles en la sesión de usuario, y algunas compositoras no las exportan automáticamente (ver cada sección).

**Instalación.** El servicio base y los dos backends de esta guía, más el de GTK como respaldo para las interfaces que los otros no implementan (selector de archivos, por ejemplo):

```bash
sudo pacman -S xdg-desktop-portal xdg-desktop-portal-gtk xdg-desktop-portal-hyprland xdg-desktop-portal-gnome
```

Para aplicar un cambio de configuración, reinicia el servicio:

```bash
systemctl --user restart xdg-desktop-portal
```

| Dato          | Detalle                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| Origen        | Proyecto Flatpak; Alexander Larsson (Red Hat) y comunidad                                                    |
| Documentación | <https://flatpak.github.io/xdg-desktop-portal/docs/> y <https://wiki.archlinux.org/title/XDG_Desktop_Portal> |
| Código        | <https://github.com/flatpak/xdg-desktop-portal>                                                              |

## xdg-desktop-portal-hyprland

Hyprland es una compositora propia, y por eso ningún backend pensado para otros escritorios sabe hablar con ella para lo más pedido: compartir pantalla o ventanas y capturar imágenes. El backend genérico para compositoras basadas en wlroots lo hace, pero sin conocer lo que Hyprland puede ofrecer. Ante ello, el propio proyecto Hyprland publica `xdg-desktop-portal-hyprland`, un backend a medida que implementa principalmente la captura de pantalla (_ScreenCast_), las capturas de imagen (_Screenshot_) y los atajos globales (_GlobalShortcuts_), con una diferencia clave sobre el genérico: permite compartir una ventana individual, no solo una pantalla completa.

Es un backend parcial: solo cubre esas interfaces, así que el resto (selector de archivos, impresión, etc.) lo toma el backend de GTK. Eso se declara en `hyprland-portals.conf`, un archivo que Hyprland ya trae, pero que puedes crear o sobrescribir en `~/.config/xdg-desktop-portal/`:

```ini
[preferred]
default=hyprland;gtk
```

Para que funcione, el backend necesita que `XDG_CURRENT_DESKTOP` y `WAYLAND_DISPLAY` estén en el entorno de activación de la sesión. Hyprland puede no exportarlas por sí mismo; se resuelve añadiendo una línea al inicio de tu configuración (con `systemd`, la opción `--systemd` las pasa también a los servicios de usuario; sin él, se quita):

```lua
hl.on("hyprland.start", function()
  hl.exec_cmd("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
end)
```

| Dato          | Detalle                                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| Origen        | Proyecto Hyprland (hyprwm), junto con la compositora                                                     |
| Interfaces    | ScreenCast, Screenshot, GlobalShortcuts (principalmente)                                                 |
| Toolkit       | Qt 6 (para el selector de qué compartir)                                                                 |
| Documentación | <https://wiki.hypr.land> (sección de utilidades) y <https://wiki.archlinux.org/title/XDG_Desktop_Portal> |
| Código        | <https://github.com/hyprwm/xdg-desktop-portal-hyprland>                                                  |

## xdg-desktop-portal-gnome

El backend de Hyprland cubre solo unas pocas interfaces, y las demás las tendría que resolver alguien más. `xdg-desktop-portal-gnome` es el backend del proyecto GNOME: usa GTK 4 y cubre casi todas las interfaces de portales (selector de archivos, impresión, cuentas, notificaciones, ajustes como el tema claro u oscuro, captura de pantalla y escritorio remoto), por lo que se ve igual que el resto de aplicaciones GTK de esta guía. Para captura y compartición se apoya en las interfaces que ofrece el escritorio GNOME.

Niri lo usa precisamente por eso: implementa esas mismas interfaces, de modo que la grabación de monitores funciona a través de `xdg-desktop-portal-gnome`, y su paquete en Arch lo declara como dependencia. Niri además trae su propio `niri-portals.conf`, que reparte las interfaces entre este backend y el de GTK.

Instalar ambos backends a la vez es lo normal en esta guía, y lo que evita que se pisen son esos archivos por escritorio: cuando inicias Hyprland, `XDG_CURRENT_DESKTOP` hace que se lea `hyprland-portals.conf`, y cuando inicias Niri, se lee `niri-portals.conf`. El problema aparece si no existe ningún archivo para tu escritorio: sin configuración explícita, el backend de GNOME tiene prioridad y puede quedarse con la captura de pantalla en Hyprland, donde no funciona. La solución es fijarlo a mano, como arriba.

Si necesitas escribir tu propio archivo para Niri (el paquete ya trae uno, esto solo es un ejemplo de su forma):

```ini
[preferred]
default=gnome;gtk
org.freedesktop.impl.portal.Access=gtk
org.freedesktop.impl.portal.Notification=gtk
```

| Dato          | Detalle                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Origen        | Proyecto GNOME                                                                                        |
| Toolkit       | GTK 4                                                                                                 |
| Interfaces    | Casi todas: selector de archivos, impresión, cuentas, ajustes, ScreenCast, Screenshot, RemoteDesktop… |
| Documentación | <https://wiki.archlinux.org/title/XDG_Desktop_Portal>                                                 |
| Código        | <https://gitlab.gnome.org/GNOME/xdg-desktop-portal-gnome>                                             |

Para comprobar que todo está en orden, mira que el servicio esté activo y comparte tu pantalla desde un navegador o una aplicación de videollamadas:

```bash
systemctl --user status xdg-desktop-portal
busctl --user list | grep -i portal
```
