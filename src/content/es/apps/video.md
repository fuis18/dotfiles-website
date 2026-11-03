---
title: "Video"
description: "Evolución de los reproductores: VLC, mpv y Celluloid."
category: apps
tags: ["vlc", "mpv", "celluloid"]
---

Reproducir un vídeo parece trivial hasta que aparece el problema de siempre: un archivo que no abre, subtítulos desincronizados, un vídeo que se entrecorta porque el reproductor no usa la tarjeta gráfica.

## La evolución de los reproductores de vídeo

### VLC: el reproductor universal (1996–2026)

**VLC nació en 1996 en la École Centrale Paris** como un cliente de vídeo en red para estudiantes del proyecto VideoLAN. En aquella época, reproducir vídeos en Linux era una aventura: cada formato necesitaba códecs propietarios, las interfaces gráficas eran escasas y los reproductores apenas podían manejar archivos locales, mucho menos flujos de red.

La visión de sus creadores (Tristan Matthews, Olivier Faure, y otros del equipo de VideoLAN) era radicalmente distinta: **un solo programa que reprodujera absolutamente cualquier cosa sin configuración**. Cuando el proyecto se convirtió en software libre en 2001, esa filosofía quedó codificada en el nombre _VLC Media Player_: un reproductor que incorporara todos los códecs necesarios internamente, eliminando la dependencia externa que causaba tantos problemas en Linux.

Las innovaciones clave que VLC introdujo:

- **Códecs integrados:** no necesitabas instalar paquetes adicionales para ver MPEG, AVI, MOV o cualquier formato.
- **Streaming de red:** podía reproducir flujos HTTP, RTP, UDP y torrents antes de que eso fuera común.
- **Tolerancia a archivos dañados:** continuaba reproduciendo aunque el archivo estuviera corrupto o incompleto.
- **Conversión de formatos:** podía transcodificar videos en tiempo real, algo que ningún otro reproductor hacía.

Durante casi dos décadas, VLC fue **la única opción viable** para usuarios que querían certeza absoluta de que un vídeo se abriría. Su interfaz Qt, aunque funcional, no era elegante, pero funcionaba en Windows, macOS, Linux y cientos de plataformas más.

**La situación actual:** la versión estable es la **3.0.23** (enero de 2026, la 24.ª de la serie 3.0), y el desarrollo se concentra en **VLC 4.0**, que a julio de 2026 todavía no tenía versión estable de escritorio (existe una alfa funcionando en otras plataformas, con una interfaz nueva basada en QML). Además, la interfaz de VLC 3 usa Qt y puede ejecutarse a través de XWayland en vez de Wayland nativo, lo que añade latencia en sistemas modernos.

| Dato                | Detalle                                                |
| ------------------- | ------------------------------------------------------ |
| Primera publicación | 1996 (École Centrale Paris); software libre desde 2001 |
| Autores             | VideoLAN (proyecto y organización sin fines de lucro)  |
| Última versión      | 3.0.23 (enero de 2026); 4.0 en desarrollo              |
| Lenguaje y licencia | C/C++; GPL-2.0 o posterior (libVLC bajo LGPL)          |
| Interfaz            | Completa (Qt), con menús y ajustes                     |
| Documentación       | <https://docs.videolan.me/vlc-user/desktop/>           |
| Código              | <https://code.videolan.org/videolan/vlc>               |

**Instalación.**

```bash
sudo pacman -S vlc
```

VLC es ideal cuando necesitas:

- Reproducir discos DVD/Blu-ray físicos
- Convertir o transcodificar formatos
- Manejar flujos de red complejos
- Abrir archivos corruptos o parcialmente descargados

### mpv: el motor minimalista (2013–2026)

**En 2012, Vincent Lang (wm4)** tomó una decisión que cambiaría el panorama: bifurcar mplayer2 (que a su vez venía de MPlayer, el reproductor clásico de Linux) para crear **mpv**. El objetivo era claro: **eliminar todo el código imposible de mantener** y el soporte de sistemas muy antiguos, concentrándose únicamente en la calidad de reproducción y la eficiencia.

La primera versión estable se publicó en **agosto de 2013**, y desde entonces mpv ha seguido una filosofía radical:

- **Sin interfaz por defecto:** el reproductor no tiene menús, solo una mínima superposición que muestra controles básicos.
- **Configuración por archivos de texto:** todo se personaliza editando `mpv.conf`, sin diálogos ni asistentes.
- **Motor desacoplado:** `libmpv` permite que otras aplicaciones lo incrusten, creando sus propias interfaces.
- **Decodificación por hardware y Wayland nativo:** aprovecha al máximo la GPU moderna sin intermediarios.

Lo que mpv resolvió que VLC no hacía tan bien:

- **Calidad de imagen superior:** shaders personalizados, escalado avanzado, gestión precisa del color.
- **Rendimiento en hardware limitado:** menor uso de RAM y CPU gracias a la simplicidad.
- **Automatización total:** scripts en Lua y JavaScript, interfaz IPC en JSON para control remoto.
- **Integración con Internet:** reproduce directamente enlaces de YouTube u otras plataformas mediante `yt-dlp`.

El costo: **curva de aprendizaje**. Sin su configuración inicial, mucha gente echa de menos botones visibles y menús familiares. Pero quienes lo dominan obtienen un reproductor que simplemente funciona, sin sobrecargas.

| Dato                | Detaille                                                         |
| ------------------- | ---------------------------------------------------------------- |
| Origen              | 2012, bifurcación de mplayer2; primera versión en agosto de 2013 |
| Autor               | Vincent Lang (wm4) y comunidad                                   |
| Última versión      | 0.41.0 (21 de diciembre de 2025)                                 |
| Lenguaje y licencia | C; GPL-2.0 o posterior (partes LGPL-2.1+)                        |
| Interfaz            | Mínima, controlada con el teclado                                |
| Documentación       | <https://mpv.io/manual/stable/>                                  |
| Código              | <https://github.com/mpv-player/mpv>                              |

**Instalación.** Ambos están en los repositorios oficiales. Añade `yt-dlp` si quieres reproducir enlaces de vídeo en línea:

```bash
sudo pacman -S mpv yt-dlp
```

La configuración de mpv vive en `~/.config/mpv/`. Un punto de partida con decodificación por hardware y salida de vídeo moderna:

```ini
# ~/.config/mpv/mpv.conf
profile=gpu-hq
vo=gpu-next
hwdec=auto-safe
keep-open=yes
```

Uso básico: `mpv archivo.mkv`, `mpv https://…` y, dentro del reproductor, `espacio` para pausar y `f` para pantalla completa.

### Celluloid: la interfaz GTK para mpv

**mpv tiene un coste de entrada:** sin su configuración y su interfaz mínima, mucha gente echa de menos una ventana con botones, una lista de reproducción visible y los ajustes en un menú. Como mpv separa el motor de la interfaz con `libmpv`, cualquiera puede construir una interfaz encima sin tocar el motor, y **Celluloid** (antes llamado GNOME MPV) es la de GTK.

Celluloid nació como respuesta directa a la necesidad de democratizar mpv: proporcionar una experiencia gráfica familiar sin sacrificar la potencia del motor subyacente. Es una interfaz gráfica sencilla que sigue las guías de interfaz de GNOME, con barra de título integrada, lista de reproducción y controles clásicos.

Al usar mpv por debajo, hereda:

- **Compatibilidad total de formatos** (los mismos que mpv)
- **Decodificación por hardware** configurada automáticamente
- **Posibilidad de leer tu propio `mpv.conf`** para conservar la configuración avanzada

La contrapartida es que es **una capa más**: si mpv cambia una opción, Celluloid puede tardar en reflejarla, y tiene menos funciones avanzadas que usar mpv directamente. Es la opción adecuada si quieres la calidad de mpv con una ventana clásica, y mpv a secas si prefieres el teclado y la configuración manual.

| Dato          | Detalle                                         |
| ------------- | ----------------------------------------------- |
| Origen        | Interfaz GTK para mpv, antes llamada GNOME MPV  |
| Motor         | `libmpv` (mpv)                                  |
| Toolkit       | GTK (con libadwaita en las versiones recientes) |
| Documentación | <https://celluloid-player.github.io>            |
| Código        | <https://github.com/celluloid-player/celluloid> |

**Instalación.**

```bash
sudo pacman -S celluloid
```

Para que use tu configuración de mpv, activa la opción de leer archivos de configuración de mpv en las preferencias de Celluloid y apunta a `~/.config/mpv/mpv.conf`.

## Comparativa práctica: ¿cuál elegir?

| Necesidad                        | Elección recomendada | Razón                                                         |
| -------------------------------- | -------------------- | ------------------------------------------------------------- |
| **Reproducción diaria simple**   | Celluloid            | Interfaz familiar con la potencia de mpv                      |
| **Máxima calidad y control**     | mpv + configuración  | Shaders personalizados, scripting completo, mínimo overhead   |
| **Archivos corruptos / DVDs**    | VLC                  | Tolerancia extrema, códecs integrados, conversión de formatos |
| **Streaming de YouTube**         | mpv + yt-dlp         | Reproducción directa sin descargar, integración perfecta      |
| **Proyectos profesionales**      | mpv                  | Scripting, automatización, integración con otras herramientas |
| **Multimedia diversa sin setup** | VLC                  | "Funciona sin configurar nada" es su razón de ser             |

**Recomendación de esta guía:**

- Instala **mpv como reproductor diario**, configurado una sola vez con `gpu-hq`.
- Mantén **VLC para lo que mpv no hace tan bien** (discos ópticos, flujos complejos, conversión).
- Usa **Celluloid si la interfaz mínima de mpv te resulta incómoda**, pero recuerda que siempre puedes cambiar a mpv puro cuando necesites más control.

## Relación con el audio

Todos estos reproductores dependen de [PipeWire](./audio.md) para el audio. Cuando reproduces un vídeo, el audio se enruta automáticamente a través del servidor de audio del sistema. En sistemas Wayland modernos, PipeWire maneja tanto el audio como los portales de vídeo que permiten compartir pantalla en videollamadas.
