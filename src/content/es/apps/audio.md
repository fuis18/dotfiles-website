---
title: "Audio"
description: "Audio del sistema con PipeWire, ALSA y reproducción con mpd y ncmpcpp."
category: apps
tags: ["pipewire", "alsa", "mpd", "ncmpcpp"]
---

El sonido en Linux funciona en dos niveles que conviene no confundir. Abajo está el servidor de audio, que reparte la tarjeta de sonido entre todas las aplicaciones y decide a qué altavoz va cada cosa. Arriba está el reproductor de música, que solo sabe leer tu biblioteca y mandar el audio al servidor. Esta página elige una pieza para cada nivel y explica por qué el reproductor debería vivir separado de su interfaz.

## La evolución del audio en Linux: de ALSA a PipeWire

### ALSA: la capa del kernel (1998–2004)

**ALSA** (_Advanced Linux Sound Architecture_) nació a finales de los años 90 como respuesta a una carencia crítica: el kernel de Linux no tenía un subsistema de audio decente. Antes de ALSA, existía OSS (_Open Sound System_), pero era propietario y sus licencias eran conflictivas para el software libre.

El proyecto ALSA comenzó en 1998, liderado por Jaroslav Křičenský, con el objetivo de crear un subsistema de audio completamente libre que pudiera manejar múltiples tarjetas, múltiples flujos y control de mezcla. Fue incluido oficialmente en el kernel 2.5 en 2003 y se convirtió en el estándar en el kernel 2.6 (2004).

ALSA tiene dos rasgos fundamentales:

- **Control directo del hardware:** habla directamente con los chips de audio, proporcionando acceso de bajo nivel con latencia mínima.
- **Sin mezcla por defecto:** si dos aplicaciones quieren sonar al mismo tiempo, ALSA no puede mezclarlas. Solo una aplicación puede abrir el dispositivo a la vez, lo que obligaba a los usuarios a cerrar programas o usar trucos complejos.

Este problema —la incapacidad de mezclar audio de múltiples fuentes— fue lo que impulsó la creación del siguiente nivel.

### PulseAudio: el servidor de escritorio (2004–2020)

En 2004, Lennart Poettering lanzó **PulseAudio** (originalmente llamado Polypaudio) como respuesta directa a las limitaciones de ALSA. Su idea era simple: un servidor intermedio que interceptara todo el audio del escritorio y lo mezclara antes de pasarlo a ALSA.

Las ventajas eran claras:

- **Mezcla por aplicación:** cada programa podía tener su propio volumen sin tocar los controles del sistema.
- **Encaminamiento flexible:** podías redirigir el audio de una aplicación a cualquier dispositivo conectado (altavoces, auriculares, HDMI).
- **Compatible con red:** el audio podía viajar por la red, permitiendo escuchar sonido remoto.
- **Plugins de efectos:** ecualizadores, reverb y procesamiento de audio en tiempo real.

Pero había un precio: **latencia alta**. PulseAudio introducía un buffer grande para manejar la mezcla, lo que causaba problemas en aplicaciones profesionales de audio (DAWs) donde la precisión temporal era crítica. Para esos casos existía **JACK** (_Jack Audio Connection Kit_), creado en 1999 por Paul Davis.

### JACK: audio profesional (1999)

JACK resolvía lo que PulseAudio ignoraba: **latencia ultrabaja y sincronización precisa**. Diseñado para músicos y productores, permitía conectar aplicaciones de audio entre sí con tiempos de reacción de milisegundos. Pero tenía un inconveniente grave: requería configuración manual, y las aplicaciones normales no funcionaban con él.

Resultado: en los años 2010 tenías tres mundos desconectados:

1. **ALSA** para bajo nivel
2. **PulseAudio** para el escritorio
3. **JACK** para audio profesional

Ninguno sabía hablar con los otros. Los músicos usaban JACK, los usuarios comunes PulseAudio, y si querías conectar aplicaciones de escritorio con herramientas profesionales, necesitabas bridges complejos y frágiles.

### PipeWire: la unificación (2017–2026)

Ante ello, Wim Taymans, de Red Hat, empezó a trabajar en **2015** en **PipeWire**. Nació como un servidor de vídeo (con los nombres provisionales PulseVideo y Pinos) y a principios de 2017 incorporó el audio y adoptó su nombre actual; la primera versión es del 20 de junio de 2017. Se relicenció de LGPL a MIT en noviembre de 2018.

Su idea central era que audio y vídeo, y el mundo de escritorio y el profesional, son flueros que un solo servidor puede gestionar, y que lo importante es no obligar a nadie a cambiar de aplicaciones:

- **Compatibilidad con los tres mundos anteriores:** `pipewire-alsa`, `pipewire-pulse` (un servidor PulseAudio de reemplazo) y `pipewire-jack` (una biblioteca JACK de reemplazo) hacen que las aplicaciones existentes funcionen sin cambios.
- **Un gestor de sesión aparte, WirePlumber,** que decide cómo se enlazan los flujos y activa dispositivos ALSA, Bluetooth y cámaras; es modular y se programa con scripts.
- **Vídeo y pantalla:** los portales (ver [XDG Desktop Portals](./portals.md)) le piden a PipeWire el flujo de vídeo cuando compartes pantalla en una videollamada.
- **Latencia baja para audio profesional,** con herramientas gráficas de conexión como Helvum o qpwgraph.

Fedora 34 (abril de 2021) fue la primera distribución en usarlo para el audio por defecto, y después lo adoptaron Pop!\_OS, Ubuntu y Debian. El costo es que es una pieza grande y relativamente joven, y todavía hay aplicaciones antiguas que asumen PulseAudio y dependen de la capa de compatibilidad.

| Dato                | Detalle                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| Primera publicación | 20 de junio de 2017 (trabajo desde 2015); versión 1.0 en 2023             |
| Autor               | Wim Taymans (Red Hat) y comunidad                                         |
| Adopción            | Fedora 34 (abril de 2021), Pop!\_OS 22.04, Ubuntu 22.10 y Debian 12       |
| Lenguaje y licencia | C; MIT (desde noviembre de 2018)                                          |
| Documentación       | <https://docs.pipewire.org> y <https://wiki.archlinux.org/title/PipeWire> |
| Código              | <https://gitlab.freedesktop.org/pipewire/pipewire>                        |
| WirePlumber         | <https://pipewire.pages.freedesktop.org/wireplumber/>                     |

**Instalación.** El servidor, las tres capas de compatibilidad y el gestor de sesión (pacman te preguntará si reemplaza a `pulseaudio` si lo tenías instalado):

```bash
sudo pacman -S pipewire pipewire-alsa pipewire-pulse pipewire-jack wireplumber
systemctl --user enable --now pipewire pipewire-pulse wireplumber
```

Para comprobar que funciona y controlar el volumen desde la terminal:

```bash
wpctl status
pactl info | grep "Server Name"
wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
```

Si prefieres un control gráfico, `pavucontrol` y, para conectar flujos a mano, `qpwgraph`:

```bash
sudo pacman -S pavucontrol qpwgraph
```

En sistemas sin `systemd` (ver [PID](./pid.md)) los tres procesos (`pipewire`, `pipewire-pulse` y `wireplumber`) se lanzan desde el arranque de la sesión de usuario, o con los paquetes de servicio de tu init.

## mpd: el reproductor de música por daemon

Los reproductores de música clásicos (Rhythmbox, Amarok y similares) son aplicaciones únicas: la ventana, la biblioteca y la reproducción viven en el mismo proceso, de modo que si cierras la ventana o se cuelga la interfaz, la música se detiene, y cada aplicación escanea y gestiona su propia biblioteca. El Music Player Daemon (MPD) toma el camino contrario, con una arquitectura de cliente y servidor. El demonio es el que reproduce, mantiene la lista de reproducción y la base de datos de tu música, y se ejecuta en segundo plano; para controlarlo usas un cliente, que puede ser una aplicación de terminal, una gráfica, un script o incluso una aplicación móvil en otra máquina de la red, hablándole por un protocolo de texto sobre TCP.

Esa separación tiene consecuencias prácticas. La música sigue sonando aunque cierres cualquier cliente o se reinicie la sesión gráfica, los clientes son intercambiables (puedes cambiar de interfaz sin perder la biblioteca) y el demonio puede vivir en un servidor sin pantalla. Fue publicado en 2003, lo mantiene desde hace años Max Kellermann y está escrito en C++ con licencia GPL; la versión estable más reciente que consulté es la 0.24.12 (mayo de 2026). Incluye `mpc`, un cliente de línea de comandos sencillo.

El único requisito es indicarle por dónde sacar el sonido, y es ahí donde se conecta con PipeWire, que MPD soporta como salida nativa:

| Dato                | Detalle                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| Primera publicación | 2003                                                                                    |
| Autor               | Warren Dukes (creador); mantenido por Max Kellermann                                    |
| Lenguaje y licencia | C++; GPL                                                                                |
| Última versión      | 0.24.12 (15 de mayo de 2026) según lo consultado                                        |
| Documentación       | <https://www.musicpd.org/doc/> y <https://wiki.archlinux.org/title/Music_Player_Daemon> |
| Código              | <https://github.com/MusicPlayerDaemon/MPD>                                              |

**Instalación.** Instala el demonio y el cliente `mpc`, crea su configuración en tu directorio de usuario y arranca el servicio de usuario:

```bash
sudo pacman -S mpd mpc
mkdir -p ~/.config/mpd/playlists
```

```conf
# ~/.config/mpd/mpd.conf
music_directory     "~/Musica"
playlist_directory  "~/.config/mpd/playlists"
db_file             "~/.config/mpd/database"
state_file          "~/.config/mpd/state"

audio_output {
    type "pipewire"
    name "PipeWire"
}
```

```bash
systemctl --user enable --now mpd
mpc update
mpc add /
mpc play
```

Sin `systemd`, basta ejecutar `mpd` al iniciar la sesión (se pone en segundo plano por sí mismo).

## ncmpcpp: el cliente de terminal

MPD no tiene interfaz propia, y eso exige elegir un cliente. Los gráficos suelen ser vistosos pero pesados, y los más simples, como `mpc`, solo sirven para comandos sueltos. **ncmpcpp** es el cliente de terminal más completo: una interfaz de texto (basada en ncurses) inspirada en `ncmpc`, escrita por Andrzej Rybczak, pensada para quien ya vive en la terminal (ver [Shell](./shell.md)) y quiere gestionar toda su música con el teclado.

Sus rasgos principales:

- **Editor de etiquetas** (artista, álbum, año…) integrado, algo poco común en un cliente de MPD.
- **Editor de listas de reproducción, biblioteca y buscador** para encontrar canciones sin salir de la interfaz.
- **Visualizador de espectro** y una interfaz alternativa, configurable.
- **Teclas totalmente reasignables** y apariencia personalizable.

Un aviso sobre su estado: el autor declara el proyecto en modo de mantenimiento: ncmpcpp está terminado en lo que él necesita y lo usa a diario, pero dispone de poco tiempo para atender el repositorio. Para un cliente que hace una sola cosa bien, es una razón de poco peso, pero conviene saberlo si dependes de una función nueva.

| Dato                | Detalle                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| Autor               | Andrzej Rybczak                                                        |
| Estado              | Modo de mantenimiento (función completa, poco tiempo para incidencias) |
| Lenguaje y licencia | C++; GPL-2.0                                                           |
| Documentación       | <https://rybczak.net/ncmpcpp>                                          |
| Código              | <https://github.com/ncmpcpp/ncmpcpp>                                   |

**Instalación.**

```bash
sudo pacman -S ncmpcpp
mkdir -p ~/.config/ncmpcpp
cp /usr/share/doc/ncmpcpp/config ~/.config/ncmpcpp/config
ncmpcpp
```

Para activar el visualizador, añade a `mpd.conf` una salida de tipo `fifo` y dile a ncmpcpp que la lea:

```conf
# ~/.config/mpd/mpd.conf
audio_output {
    type   "fifo"
    name   "visualizer"
    path   "/tmp/mpd.fifo"
    format "44100:16:2"
}
```

```conf
# ~/.config/ncmpcpp/config
visualizer_data_source = /tmp/mpd.fifo
visualizer_output_name = visualizer
visualizer_type = spectrum
```

## Relación con el vídeo

El audio que aquí gestionas afecta también al vídeo: cuando reproduces un video con [mpv](./video.md), el audio pasa por PipeWire. Del mismo modo, las capturas de pantalla en Videollamandas usan PipeWire para transportar tanto el audio como el vídeo con los mismos mecanismos de seguridad.
