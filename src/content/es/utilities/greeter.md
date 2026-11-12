---
title: "Greeter"
description: "Greeter de inicio de sesión con ReGreet."
category: utilities
tags: ["regreet", "greeter", "login"]
---

El greeter es lo primero que ves al arrancar y lo último que sale de la [tty](../../iso/install-media/): la pantalla donde eliges usuario, escribes la contraseña y decides qué sesión iniciar. Parece un detalle de apariencia, pero es el punto donde el sistema pasa de ser un conjunto de servicios a ser tu escritorio, y por eso conviene que sea pequeño y que no imponga nada sobre lo que viene después.

## ReGreet

Los gestores de inicio de sesión tradicionales (GDM, SDDM, LightDM) nacieron ligados a un entorno de escritorio completo. GDM arrastra a GNOME, SDDM a Qt y a KDE, y casi todos asumen que ellos mismos arrancan el servidor gráfico y conocen cada sesión posible. Para un escritorio compuesto por piezas sueltas, como el de esta guía, eso es una dependencia enorme para mostrar una ventana de contraseña.

Ante ello, Kenny Levinsen diseñó `greetd`, un demonio de inicio de sesión mínimo escrito en Rust que no asume nada sobre lo que se vaya a lanzar. Su idea central es separar dos papeles: `greetd` solo autentica y arranca sesiones, y la interfaz es un programa aparte, el _greeter_, que se comunica con él por un protocolo JSON simple. Todo lo que puedas ejecutar desde una tty, `greetd` puede iniciarlo; y todo programa que hable ese protocolo puede ser un greeter. Existen greeters de terminal (`agreety`, `tuigreet`), de GTK (`gtkgreet`), de Qt y de Wayland (`wlgreet`).

ReGreet es el greeter de esta guía: una interfaz GTK4 limpia y personalizable, escrita en Rust con Relm4. Como GTK4 es la base del resto de aplicaciones que usamos, se ve y se comporta como una más. Sus rasgos principales son:

- **Recuerda** el último usuario y la última sesión elegidos.
- **Detecta las sesiones** que hay instaladas leyendo `/usr/share/wayland-sessions` y `/usr/share/xsessions`, así que Hyprland y Niri aparecen solos, sin listarlos a mano.
- **Se personaliza** con un archivo TOML (fondo, tema GTK, iconos, fuente) y con CSS propio.
- **Corre dentro de una compositora mínima**, la que prefieras: Cage (la opción recomendada, porque solo muestra una ventana), Sway, [Hyprland o Niri](../window-manager/), o Gamescope.

Para funcionar necesita `greetd`, GTK 4.16 o superior, D-Bus (ver [dbus](../dbus/)), AccountsService y una compositora donde ejecutarse. Está en los repositorios oficiales de Arch, así que no hace falta pasar por el AUR (ver [Package Management](../package-management/)).

Con `systemd`, `greetd` ocupa la primera consola virtual y reemplaza a `getty@tty1`; sin él, `greetd` funciona igual con el init que uses, ya que no depende de `systemd`.

| Dato                | greetd                                                                                | ReGreet                                      |
| ------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- |
| Autor               | Kenny Levinsen                                                                        | rharish101 (GitHub)                          |
| Desarrollo          | Desde 2019                                                                            | Versión 0.2.0 (la más reciente consultada)   |
| Lenguaje y licencia | Rust; GPL-3.0                                                                         | Rust (Relm4, GTK4); GPL-3.0-or-later         |
| Documentación       | <https://man.sr.ht/~kennylevinsen/greetd> y <https://wiki.archlinux.org/title/Greetd> | <https://github.com/rharish101/ReGreet/wiki> |
| Código              | <https://git.sr.ht/~kennylevinsen/greetd>                                             | <https://github.com/rharish101/ReGreet>      |

**Instalación.**

```bash
sudo pacman -S greetd greetd-regreet cage
sudo systemctl enable greetd.service
```

Edita `/etc/greetd/config.toml` para que el greeter se ejecute dentro de Cage (`-s` permite cambiar de consola virtual, por si necesitas salir; `-mlast` usa solo el último monitor conectado y `-d` evita decoraciones de ventana). `dbus-run-session` le da su propio bus de sesión:

```toml
[terminal]
vt = 1

[default_session]
command = "dbus-run-session cage -s -mlast -d -- regreet"
user = "greeter"
```

Copia la configuración de ejemplo, con todas las opciones comentadas, y retoca lo que quieras:

```bash
sudo cp /usr/share/doc/greetd-regreet/regreet.sample.toml /etc/greetd/regreet.toml
```

Si quieres que un usuario inicie sesión automáticamente al arrancar, añade una sesión inicial a `/etc/greetd/config.toml`:

```toml
[initial_session]
command = "start-hyprland"
user = "usuario"
```

Para probarlo, reinicia o ejecuta `sudo systemctl restart greetd`. Si algo falla, cambia de consola virtual con `Ctrl+Alt+F2` (el parámetro `-s` de Cage mantiene ese cambio disponible) y revisa los registros desde la tty.

En Artix y Obarun, `greetd` se instala con el paquete de servicio de tu init (ver [PID](../../iso/pid/)).
