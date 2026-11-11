---
title: "Explorador de archivos"
description: "Exploradores de archivos: Yazi, Nautilus y Spacedrive."
category: apps
tags: ["yazi", "nautilus", "spacedrive"]
---

Moverse por los archivos es la tarea más repetida de cualquier sistema, y hay dos formas tradicionales de hacerlo: la terminal, rápida pero ciega (`ls` no te enseña la foto ni el PDF), y el explorador gráfico, cómodo pero lento y dependiente del ratón.

## Yazi

Un explorador clásico de terminal, como `ranger` o `nnn`, resuelve la parte de la navegación, pero se detiene mientras lee un directorio grande o genera una vista previa, y los más antiguos no muestran imágenes. Yazi (que significa «pato» en chino) parte de otra idea: todas las operaciones de entrada y salida son asíncronas, y las tareas pesadas se reparten entre varios hilos, de modo que la interfaz nunca se bloquea mientras el disco trabaja. Fue creado por sxyazi, está escrito en Rust y publicó sus primeras versiones en 2023.

Sus rasgos principales son:

- **Vistas previas inmediatas** de imágenes, vídeo, PDF, archivos comprimidos, directorios y código con resaltado, con protocolos de imagen integrados para Kitty y Ghostty (ver [Shell](./shell.md)), y otros terminales mediante Sixel o Überzug++.
- **Navegación con teclas al estilo Vim:** pestañas, selección entre directorios, modo visual y renombrado en lote.
- **Se integra con las herramientas de siempre:** `ripgrep`, `fd`, `fzf` y `zoxide`.
- **Un sistema de plugins en Lua** (con gestor de paquetes propio) para añadir previsualizadores, temas y hasta cambiar la interfaz.

El costo es la estabilidad: el propio proyecto se describe como una beta pública que puede usarse a diario, con cambios incompatibles frecuentes, así que conviene leer las notas de cada versión.

| Dato                | Detalle                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| Primera publicación | 2023 (versión 0.2.4 en marzo de 2024; numeración por fecha desde 2025) |
| Autor               | sxyazi y comunidad                                                     |
| Lenguaje y licencia | Rust (con plugins en Lua); MIT                                         |
| Documentación       | <https://yazi-rs.github.io>                                            |
| Código              | <https://github.com/sxyazi/yazi>                                       |

**Instalación.** Yazi y las herramientas opcionales que habilitan las vistas previas:

```bash
sudo pacman -S yazi ffmpeg 7zip jq poppler fd ripgrep fzf zoxide imagemagick
```

Para que tu shell cambie al directorio donde salgas de Yazi, añade esta función (la de fish va en `~/.config/fish/config.fish`; la de bash o zsh, en `~/.bashrc` o `~/.zshrc`) y úsala con `y` en lugar de `yazi`:

```fish
# fish
function y
    set tmp (mktemp -t "yazi-cwd.XXXXXX")
    command yazi $argv --cwd-file="$tmp"
    if read -z cwd < "$tmp"; and [ "$cwd" != "$PWD" ]; and test -d "$cwd"
        builtin cd -- "$cwd"
    end
    rm -f -- "$tmp"
end
```

```bash
# bash o zsh
function y() {
  local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
  yazi "$@" --cwd-file="$tmp"
  IFS= read -r -d '' cwd < "$tmp"
  [ "$cwd" != "$PWD" ] && [ -d "$cwd" ] && builtin cd -- "$cwd"
  rm -f -- "$tmp"
}
```

La configuración vive en `~/.config/yazi/` (`yazi.toml`, `keymap.toml`, `theme.toml` e `init.lua`).

## Thunar

Thunar, el explorador de XFCE, es un explorador gráfico completo (miniaturas, GVfs, papelera, red) que arranca en una fracción del tiempo y consume una fracción de la memoria. Fue escrito por Benedikt Meurer como reemplazo de `xffm`, el explorador anterior de XFCE; su desarrollo empezó en 2004, debutó con Xfce 4.4 en 2007 y llegó a la versión 1.0 en 2009. El nombre viene del dios del trueno de la mitología babilónica, un guiño al mantenerlo rápido. Sus rasgos principales:

- **Acciones personalizadas:** un sistema potente de entradas de menú contextual (`uca.xml`) donde cualquier comando puede recibir el archivo seleccionado como parámetro: comprimir, subir a un servidor, convertir una imagen…
- **Renombrado en lote** integrado, con patrones de número, fecha y metadatos de audio.
- **Integración con GVfs y Thunar-VFS:** unidades externas, MTP y recursos de red sin configurar nada.
- **Extensiones como paquetes aparte:** `thunar-archive-plugin` para comprimir desde el menú, `tumbler` para las miniaturas, `thunar-volman` para unidades automáticas.

Su costo es el ritmo: al estar atado al calendario de XFCE, recibe novedades lentamente, y algunas funciones modernas (integración profunda con Wayland, búsqueda de contenido) no existen o dependen de herramientas externas.

| Dato               | Detalle                                                                                |
| ------------------ | -------------------------------------------------------------------------------------- |
| Origen             | 2004 (Benedikt Meurer, proyecto XFCE); debut con Xfce 4.4 en 2007; versión 1.0 en 2009 |
| Toolkit y licencia | GTK3; GPL-2.0                                                                          |
| Documentación      | <https://docs.xfce.org/xfce/thunar/start> y <https://wiki.archlinux.org/title/Thunar>  |
| Código             | <https://gitlab.xfce.org/xfce/thunar>                                                  |

**Instalación.** Thunar más las extensiones que lo completan: miniaturas, acciones de archivado, gestión de unidades y GVfs para MTP y red:

```bash
sudo pacman -S thunar tumbler thunar-archive-plugin thunar-volman gvfs gvfs-mtp
```

Para abrirlo, `thunar`, y para fijarlo como explorador predeterminado de carpetas:

```bash
xdg-mime default thunar.desktop inode/directory
```

## Nautilus

Thunar demuestra que un explorador puede ser ligero, pero su base GTK3 de la era X11 se nota: interfaces que no escalan con HiDPI como las modernas, integración de Wayland parcial y ninguna conexión con el resto del escritorio. Nautilus es el paso siguiente en la misma historia: el gestor de GNOME, nacido en Eazel, una empresa fundada en 1999 por antiguos desarrolladores de Apple; su versión 1.0 es de 2001 —mayor incluso que Thunar— y desde entonces es el explorador de referencia en GNOME. Lo que lo sitúa aquí no es su edad sino su generación de toolkit: desde GNOME 43 está construido con GTK4 y libadwaita (ver [Ecosistema](./ecosystem.md)).

Sus rasgos principales:

- **Integración con el sistema:** gracias a GVfs monta unidades externas, dispositivos MTP, recursos de red y la papelera sin configurar nada.
- **Selector de archivos del sistema:** el portal de GNOME (ver [XDG Desktop Portals](./portals.md)) lo usa, de modo que los cuadros de «Abrir» y «Guardar» de otras aplicaciones se ven igual.
- **Extensible:** admite extensiones (por ejemplo, con `nautilus-python`) y vistas previas rápidas con la barra espaciadora si instalas `sushi`.

En Hyprland o Niri no trae todos sus componentes por defecto: hay que añadir GVfs y las utilidades de archivos comprimidos y vistas previas.

| Dato               | Detalle                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Origen             | Eazel (empresa fundada en 1999); Nautilus 1.0 en 2001; hoy, proyecto GNOME                       |
| Toolkit y licencia | GTK4 + libadwaita (desde GNOME 43); GPL                                                          |
| Documentación      | <https://help.gnome.org/users/nautilus/stable/> y <https://wiki.archlinux.org/title/GNOME/Files> |
| Código             | <https://gitlab.gnome.org/GNOME/nautilus>                                                        |

**Instalación.** Nautilus más los componentes que lo completan: GVfs para unidades, MTP y red, soporte de archivos comprimidos y vista previa:

```bash
sudo pacman -S nautilus gvfs gvfs-mtp gvfs-smb file-roller sushi
```

Para abrirlo, `nautilus`, y para fijarlo como explorador predeterminado de carpetas:

```bash
xdg-mime default org.gnome.Nautilus.desktop inode/directory
```

## Spacedrive

Con el tiempo, tus archivos acaban repartidos entre el portátil, un disco externo, el móvil y varios servicios en la nube, y ningún explorador te los muestra como un solo conjunto: sabes que la foto existe, pero no en qué dispositivo. Spacedrive, creado por Jamie Pine, intenta resolverlo con un sistema de archivos virtual distribuido (VDFS): tus archivos se quedan donde están, pero Spacedrive los indexa e identifica por su contenido, de modo que puedes encontrarlos, etiquetarlos y copiarlos entre dispositivos como si estuvieran en una sola biblioteca.

Es un proyecto ambicioso y joven. La versión 2, de diciembre de 2025, es una reescritura completa: el núcleo del VDFS está escrito en Rust sobre SQLite, la aplicación de escritorio usa Tauri con una interfaz web (React) para macOS, Windows y Linux, existe un servidor sin interfaz para Docker, y las funciones adicionales se construyen como extensiones basadas en WASM. Algunas, como el reconocimiento facial en fotos o la gestión de copias de seguridad, siguen en desarrollo o planificadas.

Hay que ser claro con su estado: pasó por años de alfa y reescrituras, y lo que ofrece hoy es una promesa más que un reemplazo de Nautilus o Yazi.

| Dato          | Detalle                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| Origen        | Proyecto de Jamie Pine; en alfa en 2024; versión 2 (reescritura) en diciembre de 2025 |
| Tecnología    | Núcleo en Rust (SQLite); escritorio con Tauri y React; extensiones WASM               |
| Licencia      | Código abierto (consulta el repositorio para la licencia vigente de cada parte)       |
| Documentación | <https://spacedrive.com>                                                              |
| Código        | <https://github.com/spacedriveapp/spacedrive>                                         |

**Instalación.** No hay un paquete oficial en los repositorios de Arch. Las versiones para Linux se descargan desde la página de descargas de <https://spacedrive.com> o desde las versiones publicadas en el repositorio; compruébalo ahí, porque el proyecto cambia con rapidez:

```bash
# Ejemplo con un AppImage descargado
chmod +x Spacedrive-*.AppImage
./Spacedrive-*.AppImage
```
