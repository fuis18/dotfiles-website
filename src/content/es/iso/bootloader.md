---
title: "Bootloader"
description: "Gestor de arranque: GRUB, systemd-boot y Limine."
category: iso
tags: ["grub", "systemd-boot", "limine"]
---

Cuando enciendes el equipo, el firmware (BIOS o UEFI) solo sabe hacer una cosa: cargar un programa pequeño desde el disco. Ese programa, el gestor de arranque, tiene que encontrar el kernel y el initramfs, pasarles unos parámetros y ceder el control. Esta decisión es irreversible después de instalado: cambiar de gestor requiere reinstalar y reconfigurar todo el arranque.

## GRUB: el clásico versátil

Los primeros gestores de arranque de Linux, como **LILO** (1992, de Werner Almesberger), guardaban la posición física en el disco de los bloques del kernel. Cada vez que actualizabas el kernel había que volver a ejecutar `lilo`, y un olvido dejaba el sistema sin arrancar. **GRUB** resolvió eso entendiendo los sistemas de archivos: lee el disco, encuentra el kernel por su ruta y basta con editar un archivo. Lo creó Erich Boleyn en 1995 para el proyecto GNU.

**La evolución:** GRUB 2.00 (2012) fue una reescritura completa que hoy es el gestor de arranque por defecto en casi todas las distribuciones.

**Sus rasgos principales:**

- **Funciona en BIOS y UEFI**, y arranca casi cualquier combinación de discos y sistemas operativos.
- **Lee los sistemas de archivos directamente**, por lo que `/boot` puede estar dentro de la partición raíz y viajar con sus snapshots.
- **Arranque desde snapshots de Btrfs** mediante `grub-btrfs`, que añade al menú una entrada por cada snapshot.

**El costo:** GRUB creció hasta parecerse a un pequeño sistema operativo. Tiene sus propios controladores de sistemas de archivos, un lenguaje de scripts y un archivo `grub.cfg` que se regenera con `grub-mkconfig` cada vez que cambia algo. Eso lo hace lento y con más superficie de ataque. Además, si GRUB tiene que desbloquear tu disco (porque `/boot` está dentro de LUKS), solo entiende LUKS2 con PBKDF2, no con Argon2id (algoritmo por defecto de `cryptsetup`).

| Dato          | Detalle                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------ |
| Origen        | 1995 (Erich Boleyn, proyecto GNU); GRUB 2.00 en 2012                                       |
| Autores       | Erich Boleyn (original), Free Software Foundation                                          |
| Licencia      | GPL-3.0                                                                                    |
| Firmware      | BIOS y UEFI                                                                                |
| Snapshots     | `grub-btrfs` <https://github.com/Antynea/grub-btrfs>                                       |
| Documentación | <https://www.gnu.org/software/grub/manual/grub/> y <https://wiki.archlinux.org/title/GRUB> |
| Código        | <https://git.savannah.gnu.org/git/grub.git>                                                |

**Instalación.** En UEFI, con la ESP montada en `/efi` y `/boot` dentro de la raíz:

```bash
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
grub-mkconfig -o /boot/grub/grub.cfg
```

En BIOS (sin UEFI), con una partición «BIOS boot» de 2 MB en un disco GPT:

```bash
pacman -S grub
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```

Para arrancar desde snapshots de Btrfs, instala `grub-btrfs` y activa su demonio:

```bash
pacman -S grub-btrfs
systemctl enable --now grub-btrfsd
```

## systemd-boot: minimalismo moderno

GRUB resuelve casi todo, pero en un equipo UEFI moderno gran parte de ese trabajo sobra: el propio firmware ya sabe leer una partición FAT y lanzar programas desde ella. **systemd-boot** parte de esa observación. Empezó como _gummiboot_, creado por Kay Sievers en 2012 como un gestor de arranque mínimo para UEFI, y se integró en systemd en la versión 220 (2015) con su nombre actual.

**Sus rasgos principales:**

- **Lee solo la ESP:** el kernel y el initramfs viven en la partición FAT, y el gestor no necesita controladores de sistemas de archivos.
- **Entradas como archivos de texto sueltos**, según la _Boot Loader Specification_: cada kernel es un `.conf` en `/boot/loader/entries/`, sin ningún script que regenerar.
- **Una herramienta de administración, `bootctl`**, que instala, actualiza y lista las entradas.
- **Compatible con imágenes de kernel unificadas (UKI)**, que detecta solas en `EFI/Linux/`.

Es la opción recomendada para UEFI porque es la más simple de entender y de reparar, y porque con cifrado no tiene el problema de Argon2id: lo que desbloquea el disco es el initramfs, no el gestor de arranque.

**Su costo:** Solo funciona en UEFI. Como el kernel vive en la ESP y no dentro de Btrfs, no puede arrancar un snapshot directamente: tras revertir `@` el kernel de la ESP podría no coincidir con los módulos de `/usr/lib/modules` restaurados. Un hook de `pacman` mitiga esto copiando `/boot` a una carpeta de la raíz en cada transacción.

| Data           | Detalle                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Origen         | _gummiboot_ (Kay Sievers, 2012); integrado en systemd 220 (2015)                                                              |
| Autores        | Kay Sievers, equipo de systemd (Red Hat, Freedesktop.org)                                                                     |
| Licencia       | LGPL-2.1 o posterior                                                                                                          |
| Firmware       | Solo UEFI                                                                                                                     |
| Documentación  | <https://www.freedesktop.org/software/systemd/man/latest/systemd-boot.html> y <https://wiki.archlinux.org/title/Systemd-boot> |
| Código         | <https://github.com/systemd/systemd>                                                                                          |
| Especificación | <https://uapi-group.org/specifications/specs/boot_loader_specification/>                                                      |

**Instalación.** Dentro del `arch-chroot`, con la ESP montada en `/boot`:

```bash
bootctl install
systemctl enable systemd-boot-update.service
```

Configura el menú en `/boot/loader/loader.conf`:

```conf
default  arch.conf
timeout  3
console-mode max
editor   no
```

Crea la entrada principal, `/boot/loader/entries/arch.conf`:

```conf
title   Arch Linux (zen)
linux   /vmlinuz-linux-zen
initrd  /intel-ucode.img
initrd  /initramfs-linux-zen.img
options root=UUID=TU_UUID rootflags=subvol=@ rw
```

Y una entrada de respaldo con el kernel LTS en `/boot/loader/entries/arch-lts.conf`:

```conf
title   Arch Linux (LTS)
linux   /vmlinuz-linux-lts
initrd  /intel-ucode.img
initrd  /initramfs-linux-lts.img
options root=UUID=TU_UUID rootflags=subvol=@ rw
```

Comprueba el resultado:

```bash
bootctl status
bootctl list
```

Si `bootctl` avisa de que `/boot` es legible por todos, ajusta en `/etc/fstab` las opciones de la ESP a `fmask=0077,dmask=0077`.

Para el problema de los snapshots, este hook de `pacman` copia `/boot` a una carpeta de la raíz cada vez que se actualiza un kernel:

```ini
# /etc/pacman.d/hooks/50-bootbackup.hook
[Trigger]
Operation = Upgrade
Operation = Install
Operation = Remove
Type = Path
Target = usr/lib/modules/*/vmlinuz

[Action]
Depends = rsync
Description = Copiando /boot a /.bootbackup...
When = PostTransaction
Exec = /usr/bin/rsync -a --delete /boot/ /.bootbackup/
```

```bash
sudo pacman -S rsync
sudo mkdir -p /.bootbackup
```

## Limine: snapshots en UEFI y BIOS

**Limine** es un gestor de arranque moderno que cubre el hueco entre GRUB y systemd-boot: funciona con BIOS y UEFI, se configura con un solo archivo de texto y tiene una herramienta que permite arrancar snapshots en UEFI, algo que systemd-boot no hace nativamente. Desarrollado por Mintsuki, CachyOS lo ofrece como una de las opciones de su instalador (ver [Distro Base](../distro-base/)).

**Sus rasgos principales:**

- **Funciona en BIOS y UEFI** (ventaja sobre systemd-boot).
- **`limine-snapper-sync`** copia el kernel y el initramfs de cada snapshot retenido a la ESP y añade una entrada al menú por cada uno.
- **Configuración en archivo de texto simple**, sin scripts complejos como GRUB.

**La contrapartida:** Es el más joven de los tres (menos de 5 años de madurez). `limine-snapper-sync` es una herramienta de terceros que se instala desde el AUR o desde los repositorios de CachyOS. Además, la ESP debe ser mucho mayor: cada snapshot retenido copia su kernel y su initramfs (~150 MB cada uno), así que con snapshots activados se recomienda una ESP de 4 GiB, frente a 1 GiB con systemd-boot.

La instalación y la sintaxis del archivo de configuración han cambiado entre versiones, así que sigue la documentación del proyecto y la de la ArchWiki en lugar de copiar comandos de aquí.

| Dato          | Detalle                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| Origen        | ~2022-2023                                                                  |
| Autor         | Mintsuki y comunidad                                                        |
| Licencia      | BSD-2-Clause                                                                |
| Firmware      | BIOS y UEFI                                                                 |
| Snapshots     | `limine-snapper-sync` (herramienta de terceros)                             |
| Documentación | <https://limine-bootloader.org> y <https://wiki.archlinux.org/title/Limine> |
| Código        | <https://github.com/limine-bootloader/limine>                               |

**Instalación.** El paquete del gestor está en los repositorios oficiales; el resto sigue la documentación:

```bash
sudo pacman -S limine
```

Sigue la ArchWiki para configurar `limine-snapper-sync` si usas snapshots.

## Comparativa y recomendación

| Criterio            | GRUB                          | systemd-boot                 | Limine                         |
| ------------------- | ----------------------------- | ---------------------------- | ------------------------------ |
| **Origen**          | 1995 (maduro, 25+ años)       | 2012 (moderno, 10+ años)     | ~2022 (joven, 3+ años)         |
| **BIOS**            | ✅                            | ❌ (solo UEFI)               | ✅                             |
| **UEFI**            | ✅                            | ✅                           | ✅                             |
| **Snapshots Btrfs** | ✅ (con `grub-btrfs`)         | ❌ (requiere hook de backup) | ✅ (con `limine-snapper-sync`) |
| **Complejidad**     | Alta (scripts, controladores) | Baja (archivos de texto)     | Media (config + herramienta)   |
| **Secure Boot**     | Parcial                       | Sí (con UKI)                 | Sí                             |
| **Reparación**      | Difícil (regenerar config)    | Fácil (editar .conf)         | Media                          |

### Recomendación por caso de uso

| Situación                                    | Elección                      | Razón                                                            |
| -------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| **UEFI moderno sin cifrado**                 | systemd-boot                  | Simplicidad máxima, fácil de entender y reparar                  |
| **UEFI con snapshots Btrfs**                 | systemd-boot + hook de backup | systemd-boot es más simple; el hook de pacman mitiga el problema |
| **UEFI con snapshots Btrfs (prefiere menú)** | Limine                        | Menú nativo con snapshots, pero más complejo y ESP mayor         |
| **BIOS antiguo**                             | GRUB                          | Única opción madura con soporte BIOS completo                    |
| **Múltiples sistemas operativos**            | GRUB                          | Mejor soporte de chainloading y detección automática             |
| **Secure Boot**                              | systemd-boot + UKI            | Soporte más sencillo con Unified Kernel Images                   |

### Flujo de instalación recomendado

```bash
# 1. Particionas el disco (ver [Mounts](../mounts/))
# 2. Instalas la base con pacstrap (ver [Install Media](../install-media/))
# 3. Entras al chroot: arch-chroot /mnt
# 4. Instalas tu bootloader elegido:

# Opción A (recomendada para UEFI):
bootctl install

# Opción B (para BIOS):
pacman -S grub
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg

# Opción C (para UEFI con snapshots):
pacman -S limine
# Configura limine-snapper-sync según ArchWiki

# 5. Configuras el kernel e initramfs (ver [Kernel e Initramfs](../kernel-initramfs/))
# 6. Reinicias
```
