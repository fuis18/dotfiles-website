---
title: "Kernel e Initramfs"
description: "Variantes de kernel, generadores de initramfs (mkinitcpio, dracut) y UKI."
category: iso
tags: ["kernel", "initramfs", "mkinitcpio", "dracut", "uki", "sbctl"]
---

El gestor de arranque (ver [Bootloader](./bootloader.md)) encuentra el kernel, lo carga en memoria y le pasa el control junto con unos parámetros. Pero ahí aparece un problema que el propio kernel no puede resolver: para leer tu disco necesita el controlador de tu NVMe, el soporte de Btrfs o el contenedor cifrado, y muchos de esos elementos son módulos que viven dentro de la raíz a la que todavía no puede acceder. El initramfs rompe ese círculo, y la imagen de kernel unificada (UKI) resuelve el último cabo suelto: que nada de esa cadena pueda alterarse sin que el firmware lo note.

## Kernel: qué es y qué variantes hay

El kernel es el núcleo del sistema: el programa que habla con el hardware, reparte el tiempo del procesador, gestiona la memoria y expone a los programas una interfaz uniforme para hacer todo eso. Linux nació en 1991 como un proyecto personal de Linus Torvalds, que anunció la versión 0.01 ese septiembre y publicó la 1.0 en marzo de 1994. Es un kernel monolítico con módulos: el núcleo central se carga de una vez, y los controladores que no siempre hacen falta (Wi-Fi, sistemas de archivos, tarjetas de sonido) se cargan y descargan en caliente según se necesiten.

Arch no publica un solo kernel, sino varios en sus repositorios oficiales, cada uno pensado para un uso:

| Paquete          | Qué es                                                                                 | Para quién                                                |
| ---------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `linux`          | El kernel vanilla, sin parches añadidos                                                | Quien quiere exactamente lo que publica el proyecto Linux |
| `linux-lts`      | Rama de soporte largo, con menos cambios y más probada                                 | Servidores y quien prioriza estabilidad                   |
| `linux-zen`      | Parches orientados a la respuesta de escritorio, mantenidos por el proyecto Zen Kernel | Equipos de uso diario                                     |
| `linux-hardened` | Endurecimiento de seguridad, con mitigaciones y restricciones extra                    | Quien prioriza seguridad sobre rendimiento                |
| `linux-cachyos`  | Kernel propio de CachyOS, con planificadores adicionales                               | Usuarios de CachyOS (ver [Distro Base](./distro-base.md)) |

Esta guía usa **`linux-zen`** como kernel principal y deja **`linux-lts`** instalado como respaldo. La razón es concreta: en una distribución rolling release, una actualización del kernel puede romper el arranque o un controlador. Si eso ocurre, eliges la entrada LTS en el menú del gestor de arranque y el sistema sigue funcionando con la versión anterior. Es una red de seguridad barata —ocupa unos cientos de megabytes— que complementa a los snapshots de [Mounts](./mounts.md).

Tres detalles prácticos que conviene tener claros:

- **Los encabezados** (`linux-zen-headers`, `linux-lts-headers`) hacen falta para compilar módulos externos mediante DKMS, como los controladores propietarios de NVIDIA. Sin ellos, el módulo no se reconstruye al actualizar el kernel.
- **El firmware es un solo paquete**, `linux-firmware`, compartido por todos los kernels. No hay variantes por kernel: son los archivos que el propio hardware necesita para funcionar, y se instalan una vez.
- **El microcódigo del procesador** (`intel-ucode` o `amd-ucode`) se carga como el **primer** `initrd` en cada entrada del gestor de arranque, antes que el initramfs. Corrige erratas del procesador desde el arranque, y por eso va primero.

| Dato              | Detalle                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| Origen            | Linux 0.01 anunciado en septiembre de 1991; versión 1.0 en marzo de 1994     |
| Autor             | Linus Torvalds y la comunidad del kernel                                     |
| Licencia          | GPL-2.0                                                                      |
| Variantes en Arch | `linux`, `linux-lts`, `linux-zen`, `linux-hardened` (repositorios oficiales) |
| Firmware          | `linux-firmware` (compartido por todos los kernels)                          |
| Microcódigo       | `intel-ucode` o `amd-ucode`, como primer `initrd`                            |
| Documentación     | <https://wiki.archlinux.org/title/Kernel> y <https://docs.kernel.org>        |
| Zen Kernel        | <https://github.com/zen-kernel/zen-kernel>                                   |

**Instalación.**

```bash
pacman -S linux-zen linux-zen-headers linux-lts linux-lts-headers linux-firmware
```

## initramfs: el sistema de archivos temporal

El kernel acaba de cargarse y no sabe leer tu disco: el controlador de tu NVMe, el soporte de Btrfs o el contenedor cifrado pueden ser módulos que están dentro de la raíz a la que todavía no tiene acceso. El initramfs resuelve ese círculo: es un pequeño sistema de archivos que el gestor de arranque carga en RAM junto al kernel, con los módulos y scripts necesarios para desbloquear y montar la raíz, y que después cede el control al sistema real.

La idea no es nueva. **initrd** apareció en Linux 1.1 (1994) y se estabilizó en 1.2 (1995): una imagen de disco comprimida que el kernel montaba como un dispositivo de bloques, lo que obligaba a dimensionarla, a formatearla y a convivir con un sistema de archivos de tamaño fijo. **initramfs** lo sustituyó por algo más simple: un archivo comprimido en formato `cpio` que el kernel descomprime directamente en una instancia de `tmpfs`, sin dispositivo de bloques, sin formatear y con el tamaño que necesite. Llegó en la serie de desarrollo 2.5 (finales de 2002) y se estabilizó en 2.6.10 (diciembre de 2004). Parte del trabajo vino de **klibc**, una biblioteca C mínima creada por H. Peter Anvin para poder escribir los programas del arranque sin arrastrar glibc entera. Desde entonces, todo generador de initramfs trabaja sobre este modelo.

En Arch lo genera **`mkinitcpio`**, que arma la imagen a partir de una lista de _hooks_ en `/etc/mkinitcpio.conf`. Cada hook añade una función concreta al arranque:

| Hook                 | Qué hace                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| `base`               | Instala el esqueleto mínimo y el script `init`                                    |
| `udev`               | Detecta el hardware y carga los módulos que hagan falta                           |
| `microcode`          | Incluye el microcódigo del procesador en la imagen                                |
| `keyboard`, `keymap` | Teclado disponible en el arranque (necesario para escribir la contraseña de LUKS) |
| `block`              | Controladores de disco (NVMe, SATA, USB)                                          |
| `encrypt`            | Desbloquea el contenedor LUKS                                                     |
| `filesystems`        | Añade el soporte del sistema de archivos de la raíz                               |
| `fsck`               | Comprueba el sistema de archivos antes de montarlo                                |

Hay **dos familias de hooks que no se mezclan**. La clásica, basada en BusyBox, usa `udev` y `encrypt`; la basada en systemd usa `systemd` y `sd-encrypt`. Elegir una y respetarla importa: combinar hooks de ambas produce imágenes que no arrancan o que se comportan de forma imprevisible. **dracut**, creado por Harald Hoyer en Red Hat (primera versión en julio de 2009), es la alternativa, con un diseño modular basado en systemd pero agnóstico al init del sistema final.

Esto deja un problema que ninguna de las piezas anteriores resuelve. El kernel, el initramfs y los parámetros son archivos sueltos en la ESP, que no está cifrada, y cualquiera con acceso físico puede cambiarlos. El Secure Boot del firmware solo comprueba firmas de programas EFI, y un kernel con su initramfs aparte no lo es. La imagen de kernel unificada (UKI) lo corrige, y la detallo más abajo.

La consecuencia práctica es sencilla: si no cifras el disco, un initramfs normal es suficiente. Si lo cifras (ver [Cifrado de disco](./encryption.md)), la UKI es la forma de proteger también el arranque.

### mkinitcpio vs dracut: dos filosofías

Ambos generan initramfs, pero con enfoques distintos. **mkinitcpio** es el generador "oficial" de Arch, creado por el equipo de Arch en 2006 como reemplazo de `geninitcpio`. Es ligero, modular y configurable vía hooks. Tiene una peculiaridad: si el array `HOOKS` incluye `systemd`, genera un initramfs basado en systemd (con servicios systemd en lugar de hooks shell); si no lo incluye, genera un initramfs basado en BusyBox (con scripts ash). Son dos initramfs distintos, no una misma imagen con opciones.

**dracut** es más genérico: diseñado para funcionar en cualquier distribución, detecta automáticamente qué módulos necesita según los parámetros del kernel y los módulos cargados. Es "más opinionado", pero también más robusto en ciertos escenarios, especialmente con UKI y Secure Boot. No depende de systemd para funcionar, aunque se pueden incluir componentes de systemd en el initramfs si se requiere. En lugar de hooks usa **módulos** que se añaden o se quitan con `--add` y `--omit`, y su configuración vive en `/etc/dracut.conf.d/`. Es el generador por defecto de Fedora, RHEL y openSUSE y, tras la transición iniciada con Ubuntu 25.10 y consolidada en 26.04 LTS, también de Ubuntu (que venía usando `initramfs-tools`). Desde octubre de 2021, tras la salida de Hoyer de Red Hat, lo mantiene la comunidad.

| Dato             | mkinitcpio                                                             | dracut                                                                    |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Origen           | Proyecto Arch Linux; escrito en Bash, basado en hooks                  | Julio de 2009, por Harald Hoyer y otros (Red Hat); basado en módulos      |
| Mantenimiento    | Equipo de Arch Linux                                                   | Comunidad desde octubre de 2021                                           |
| Configuración    | `/etc/mkinitcpio.conf` (lista de `HOOKS`)                              | `/etc/dracut.conf.d/*.conf` (`--add`, `--omit`)                           |
| Familia de hooks | - BusyBox (`udev`, `encrypt`)<br />- systemd (`systemd`, `sd-encrypt`) | Diseño modular apoyado en systemd y udev                                  |
| Adopción         | Arch, EndeavourOS, Manjaro, CachyOS, Garuda                            | Fedora, RHEL, openSUSE, Ubuntu (plan anunciado en febrero de 2025)        |
| Licencia         | GPL-2.0                                                                | GPL-2.0 o posterior (partes LGPL-2.1+)                                    |
| Documentación    | <https://wiki.archlinux.org/title/Mkinitcpio>                          | <https://dracut-ng.github.io> y <https://wiki.archlinux.org/title/Dracut> |
| Código           | <https://gitlab.archlinux.org/archlinux/mkinitcpio/mkinitcpio>         | <https://github.com/dracut-ng/dracut-ng>                                  |

### mkinitcpio con hooks clásicos (BusyBox)

Es la opción por defecto de Arch. No incluye systemd en el initramfs, usa scripts shell y es más fácil de depurar porque los hooks se ejecutan secuencialmente.

```bash
# /etc/mkinitcpio.conf
MODULES=()
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt filesystems fsck)
COMPRESSION="zstd"
```

Regenera con:

```bash
mkinitcpio -P
```

Sin cifrado, los hooks por defecto se quedan sin `encrypt`:

```bash
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block filesystems fsck)
```

Si cifras el disco, se añade `encrypt` antes de `filesystems`, y `keyboard` y `keymap` dejan de ser opcionales, porque hay que poder escribir la contraseña antes de que exista el sistema.

### dracut

Es más modular y automatizado. Detecta automáticamente qué módulos necesita según el kernel y los parámetros de arranque.

```bash
sudo pacman -S dracut
```

```bash
# /etc/dracut.conf.d/custom.conf
add_dracutmodules+=" base udev kmod dm crypt lvm btrfs "
omit_dracutmodules+=" systemd "
hostonly="yes"
compress="zstd"
```

La opción `omit_dracutmodules+=" systemd "` es clave si no quieres systemd en el initramfs. Puedes también omitir módulos específicos según tu necesidad. Regenera con:

```bash
sudo dracut --force --regenerate-all
```

Para probarlo sin tocar la configuración global, genera la imagen indicando el kernel:

```bash
sudo dracut --force --hostonly /boot/initramfs-linux-zen.img
```

### Hook automático para actualizaciones de kernel

Independientemente del generador que elijas, necesitas que el initramfs se regenere automáticamente tras actualizar el kernel. Crea un hook de pacman:

```ini
# /etc/pacman.d/hooks/90-initramfs.hook
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = linux
Target = linux-lts
Target = linux-zen
Target = linux-hardened

[Action]
Description = Regenerating initramfs...
When = PostTransaction
# Para mkinitcpio
Exec = /usr/bin/mkinitcpio -P
# Para dracut, comenta la anterior y descomenta esta:
# Exec = /usr/bin/dracut --force --regenerate-all
```

## UKI: la imagen de kernel unificada

Queda un problema que ninguna de las piezas anteriores resuelve. El kernel, el initramfs y los parámetros de arranque son **archivos sueltos** en la ESP, que no está cifrada, y cualquiera con acceso físico puede reemplazarlos. El Secure Boot del firmware (ver [Firmware](./firmware.md)) solo comprueba firmas de programas EFI, y un kernel con su initramfs aparte no lo es: no hay nada que firmar como un todo.

La **imagen de kernel unificada** (UKI, _Unified Kernel Image_) corrige eso. Definida por el grupo UAPI, es un **único archivo EFI** que empaqueta el kernel, el initramfs, el microcódigo y los parámetros de arranque en una sección `.cmdline` propia. Al ser un solo archivo, se puede firmar entero, y el firmware verifica la firma antes de ejecutarlo. `systemd-boot` las detecta solas en `EFI/Linux/`, sin necesidad de entradas `.conf`.

El efecto es que la cadena de arranque queda cerrada: firmware → gestor de arranque firmado → UKI firmada → sistema. Con tus propias claves de Secure Boot, cualquier cambio en cualquiera de esos eslabones impide el arranque, lo que protege también contra un ataque con acceso físico al equipo.

El costo es que configurar claves propias de Secure Boot es un proceso manual que varía según el firmware, y que hay que repetir para cada archivo que cambie. El hook de `sbctl` lo automatiza en cada actualización de kernel.

| Dato          | mkinitcpio                                                     | UKI                                                                 |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| Qué es        | Generador de initramfs de Arch, con hooks                      | Un archivo EFI con kernel, initramfs, microcódigo y parámetros      |
| Define        | Proyecto Arch Linux                                            | Grupo UAPI (<https://uapi-group.org>)                               |
| Detección     | —                                                              | `systemd-boot` las detecta en `EFI/Linux/`                          |
| Firma         | —                                                              | `sbctl` (hook automático en cada actualización de kernel)           |
| Documentación | <https://wiki.archlinux.org/title/Mkinitcpio>                  | <https://uapi-group.org/specifications/specs/unified_kernel_image/> |
| Código        | <https://gitlab.archlinux.org/archlinux/mkinitcpio/mkinitcpio> | <https://github.com/Foxboron/sbctl> (firma)                         |

### Con mkinitcpio + ukify

`ukify` es una herramienta de systemd que empaqueta los componentes en una UKI; Arch la ofrece como paquete `systemd-ukify`. Para pasar a una UKI, indica a `mkinitcpio` que genere la imagen en la ESP y guarda los parámetros de arranque en `/etc/kernel/cmdline`:

```bash
# /etc/kernel/cmdline (una sola línea, sin saltos)
root=UUID=TU_UUID rootflags=subvol=@ rw
```

```bash
# /etc/mkinitcpio.d/linux-zen.preset
ALL_kver="/boot/vmlinuz-linux-zen"
PRESETS=('default')
default_uki="/boot/EFI/Linux/arch-linux-zen.efi"
```

```bash
sudo pacman -S systemd-ukify
mkinitcpio -P
```

### Con dracut

dracut tiene soporte nativo para UKI con la opción `--uefi`:

```bash
sudo dracut --uefi --force /boot/EFI/Linux/arch-linux-zen.efi
```

Detecta automáticamente el kernel, el initramfs y los parámetros según el kernel que se esté usando.

### Secure Boot con sbctl

Para firmar las UKIs (o los archivos de arranque por separado) con tus propias claves, `sbctl` las crea, las registra en el firmware (que debe estar en **Setup Mode**, el estado sin `PK` instalada que describe [Firmware](./firmware.md)) y firma los archivos de arranque:

```bash
sudo pacman -S sbctl
sudo sbctl status
sudo sbctl create-keys
sudo sbctl enroll-keys -m
sudo sbctl sign -s /boot/EFI/Linux/arch-linux-zen.efi
sudo sbctl sign -s /boot/EFI/systemd/systemd-bootx64.efi
sudo sbctl sign -s /boot/EFI/BOOT/BOOTX64.EFI
sudo sbctl verify
```

La opción `-m` conserva también las claves de Microsoft, necesarias en muchos equipos para que arranque el firmware de la tarjeta gráfica. Hazlo primero en una máquina virtual con UEFI: un error en este paso puede dejar el equipo sin arrancar.
