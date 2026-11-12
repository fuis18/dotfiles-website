---
title: "Package Management"
description: "Gestión de paquetes: paru y el AUR."
category: utilities
tags: ["paru", "aur", "pacman"]
---

En Arch, `pacman` instala y actualiza todo lo que está en los repositorios oficiales de forma rápida y predecible: paquetes binarios comprimidos con `zstd` (ver [Components Optimization](./components-optimization/)), con una sola orden y con dependencias resueltas. Pero ningún repositorio oficial puede contener todo el software del mundo. Lo que queda fuera (un greeter nuevo, un tema, una herramienta de escritorio recién publicada) vive en el AUR, y ahí `pacman` no llega.

## paru

El AUR (_Arch User Repository_) no guarda programas compilados, sino recetas: cada paquete es un `PKGBUILD`, un script de shell que describe de dónde bajar el código y cómo construirlo, y que cualquier persona puede subir. Sin ayuda, instalar algo del AUR significa clonar su repositorio, leer el `PKGBUILD`, ejecutar `makepkg -si`, resolver a mano las dependencias que también sean del AUR y acordarse de repetir todo el proceso para actualizarlo, porque `pacman -Syu` nunca consulta el AUR.

Los _AUR helpers_ automatizan ese proceso. El más conocido es `yay`, escrito en Go por Jguer. En 2020, uno de sus dos desarrolladores, Morganamilo, dejó el proyecto y empezó el suyo: paru, escrito en Rust y basado en el diseño de `yay`, con una diferencia de enfoque. Un `PKGBUILD` es código que se ejecuta en tu equipo y el AUR no lo audita, así que paru pone la revisión en el centro: muestra el `PKGBUILD` antes de construir, se niega a ejecutarse como root y ofrece herramientas para inspeccionar el paquete antes de instalarlo.

Sus rasgos principales son:

- **Revisión previa del `PKGBUILD`**, con resaltado de sintaxis si tienes `bat`, y con la opción de abrirlo en un gestor de archivos (`FileManager`) para editarlo.
- **Comentarios del AUR en la terminal** (`paru -Gc paquete`), útiles para ver si alguien reportó un problema antes de instalar.
- **Compilación en un entorno aislado** (`--chroot`), que evita contaminar el sistema con dependencias de construcción.
- **Interfaz idéntica a `pacman`:** paru funciona como envoltura, así que `paru -Syu` actualiza oficiales y AUR de una vez.

Como paru termina instalando con `pacman`, los snapshots automáticos de `snap-pac` (ver [Mounts](./mounts/)) también cubren los paquetes del AUR. Y como muchos `PKGBUILD` traen unidades de `systemd`, en Artix y Obarun hay que buscar el servicio equivalente para tu init (ver [PID](./pid/)).

El estado del proyecto merece una advertencia honesta: según lo reportado en 2026, paru lleva un ritmo de mantenimiento lento. Su última versión estable (2.1.0) es de julio de 2025 y, cuando `pacman` subió la versión de `libalpm` a finales de 2025, el paquete binario precompilado (`paru-bin`) dejó de funcionar, mientras que reconstruirlo desde el código fuente (paquete `paru`) sí lo arregló. Por eso esta guía instala `paru` compilado en tu máquina, no el `-bin`. Si más adelante falla y no se corrige, `yay` sigue activo (su versión 13 salió en junio de 2026) y la sintaxis es casi idéntica.

| Dato                | Detalle                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Creación            | Repositorio creado en agosto de 2020; versión 1.0.0 en 2020, al anunciar su autor que dejaba `yay` |
| Autor               | Morganamilo (antes, segundo desarrollador de `yay`)                                                |
| Lenguaje y licencia | Rust; GPL-3.0                                                                                      |
| Última versión      | 2.1.0 (julio de 2025)                                                                              |
| Documentación       | <https://github.com/Morganamilo/paru> y <https://wiki.archlinux.org/title/AUR_helpers>             |
| Código              | <https://github.com/Morganamilo/paru>                                                              |
| AUR                 | <https://aur.archlinux.org> y <https://wiki.archlinux.org/title/Arch_User_Repository>              |
| Alternativa         | `yay`: <https://github.com/Jguer/yay>                                                              |

**Instalación.** Paru está en el AUR, así que la primera vez se construye a mano (como usuario normal, no como root):

```bash
sudo pacman -S --needed base-devel git
git clone https://aur.archlinux.org/paru.git
cd paru
makepkg -si
```

Uso diario:

```bash
paru                    # actualiza oficiales y AUR (equivale a -Syu)
paru -S paquete         # instalar
paru -Ss texto          # buscar
paru -Sua               # actualizar solo el AUR
paru -Gp paquete        # ver el PKGBUILD sin instalar
paru -Gc paquete        # leer los comentarios del AUR
paru -c                 # eliminar dependencias huérfanas
paru -Qm                # listar paquetes que no son de los repositorios oficiales
```

Una configuración útil en `/etc/paru.conf` (descomenta las opciones que quieras):

```ini
[options]
BottomUp    # muestra los resultados con el más relevante abajo
SudoLoop    # mantiene sudo activo durante compilaciones largas
Devel       # comprueba actualizaciones de paquetes -git
```
