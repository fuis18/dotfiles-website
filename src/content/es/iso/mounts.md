---
title: "Mounts"
description: "Sistema de archivos y particionado: ext4, Btrfs con snapshots y esquema de particiones."
category: iso
tags: ["ext4", "btrfs", "snapshots", "particiones"]
---

El sistema de archivos es la decisión más difícil de cambiar una vez instalado el sistema, y la que define si una mala actualización es un susto o un simple contratiempo. En una distribución rolling release como las de [Distro Base](./distro-base.md), donde cada actualización puede romper algo, no basta con que el disco guarde los datos: también debe permitir volver atrás. Esta página recorre cómo se llegó a eso y cómo dejarlo montado.

## ext4

Durante años, ext2 y luego ext3 fueron el estándar de Linux, pero fueron quedando cortos: ext3 mapeaba cada archivo bloque por bloque, lo que penaliza los archivos grandes y fragmenta el disco; sus revisiones con `fsck` eran lentas y limitaba cada directorio a 32.000 subdirectorios. Ante ello, Theodore Ts'o anunció en junio de 2006 el plan de desarrollo de ext4, un sucesor que nació como una serie de extensiones compatibles con ext3, muchas de ellas desarrolladas originalmente para Lustre entre 2003 y 2006.

Sus mejoras principales son:

- _Extents_ en lugar de mapeo por bloques: un solo registro describe un rango contiguo de bloques, lo que acelera los archivos grandes y reduce la fragmentación.
- Asignación retardada y asignador multibloque, que deciden dónde escribir con más información.
- `fsck` mucho más rápido, porque omite los grupos de bloques sin usar.
- Checksums en el journal y, desde el kernel 3.5, en los metadatos, además de volúmenes de hasta 1 EiB.

Sigue siendo la elección más simple y probada: es el valor por defecto de Debian y Ubuntu, y tiene décadas de pruebas a sus espaldas. Pero el propio Ts'o dijo en 2008 que ext4 usaba tecnología vieja y era una solución de transición, y que Btrfs era la mejor dirección por su escalabilidad, fiabilidad y facilidad de administración. Y es que ext4 no crea snapshots ni verifica el contenido de tus archivos con checksums (solo los metadatos): si una actualización deja el sistema roto, la única salida es restaurar una copia de seguridad o reparar a mano. De ahí parte la siguiente sección.

| Dato                | Detalle                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Primera publicación | Versión preliminar en Linux 2.6.19 (octubre de 2006); estable en Linux 2.6.28 (diciembre de 2008)                 |
| Autores             | Equipo liderado por Theodore Ts'o, con Mingming Cao, Andreas Dilger, Alex Zhuravlev, Dave Kleikamp y Eric Sandeen |
| Licencia            | GPL-2.0 (kernel)                                                                                                  |
| Documentación       | <https://docs.kernel.org/filesystems/ext4/index.html> y <https://wiki.archlinux.org/title/Ext4>                   |
| Herramientas        | `e2fsprogs`: <https://git.kernel.org/pub/scm/fs/ext2/e2fsprogs.git>                                               |

**Instalación.** Viene en el kernel y las herramientas ya están en la base de Arch. Para formatear una partición:

```bash
mkfs.ext4 -L root /dev/sda2
```

## Btrfs y snapshots

El problema de fondo es que un sistema de archivos tradicional guarda el estado actual y nada más. Para volver al estado de ayer se necesita una copia aparte que ocupa mucho espacio y tarda en hacerse. Btrfs parte de otra idea: Chris Mason (Oracle) tomó los árboles B copy-on-write propuestos por Ohad Rodeh en 2007 y construyó un sistema de archivos donde nada se sobrescribe, sino que se escribe una copia nueva. De esa decisión de diseño salen casi todas sus ventajas: como los datos viejos siguen ahí, guardar un estado anterior cuesta casi nada.

En la práctica aporta:

- **Subvolúmenes:** raíces de sistema de archivos independientes dentro de una misma partición, que se montan por separado.
- **Snapshots instantáneos:** un snapshot es un subvolumen que comparte datos con otro, así que se crea en una fracción de segundo y casi no ocupa espacio al inicio.
- **Checksums** de datos y metadatos, que permiten detectar bloques corruptos.
- **Compresión transparente** con `zstd` (disponible desde el kernel 4.14), ya cubierta en [Components Optimization](./components-optimization.md).
- `btrfs send/receive` para replicar snapshots a otro disco.

Con snapshots, una actualización fallida se revierte en minutos: `snap-pac` crea un snapshot antes y otro después de cada transacción de `pacman`, y para volver atrás se restaura el subvolumen `@` desde uno de ellos (la ArchWiki documenta el procedimiento manual para este esquema). Es la respuesta directa a la rolling release que mencionaba [Distro Base](./distro-base.md), y la razón por la que CachyOS lo adoptó como sistema de archivos por defecto en su release de junio de 2024.

Conviene tener presente que:

- Un snapshot no es una copia de seguridad: vive en el mismo disco. Si el disco falla, se pierde todo. Úsalo junto con `btrfs send` a otro disco o con otra herramienta de respaldo.
- La naturaleza copy-on-write fragmenta archivos que se reescriben constantemente, como discos de máquinas virtuales o bases de datos. Para ellos se desactiva con `chattr +C`, a costa de perder checksums y compresión en esos archivos.
- RAID 5/6 sigue con advertencias en la documentación oficial; no lo uses para datos importantes.
- El espacio libre se calcula distinto a otros sistemas: usa `btrfs filesystem usage /` en lugar de fiarte solo de `df`.

| Dato                | Detalle                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Primera publicación | Anunciado en la lista del kernel en julio de 2007; incluido en Linux 2.6.29 (marzo de 2009); formato estable en 2013 |
| Autor               | Chris Mason (Oracle) y colaboradores de SUSE, Meta, Fujitsu, Red Hat y otros                                         |
| Licencia            | GPL-2.0 (kernel)                                                                                                     |
| Documentación       | <https://btrfs.readthedocs.io> y <https://wiki.archlinux.org/title/Btrfs>                                            |
| Código              | <https://github.com/kdave/btrfs-progs>                                                                               |
| Snapper             | <http://snapper.io> y <https://github.com/openSUSE/snapper>                                                          |
| snap-pac            | <https://github.com/wesbarnett/snap-pac>                                                                             |

**Instalación.** `btrfs-progs` se instala con la base (`pacstrap`) y Snapper ya dentro del `arch-chroot` (ver la sección siguiente):

```bash
pacman -S snapper snap-pac
```

Snapper crea su propio subvolumen `.snapshots` al configurarse, lo que choca con el `@snapshots` que definimos más abajo. Esta es la forma de resolverlo (sigue la receta de la ArchWiki):

```bash
umount /.snapshots
rm -r /.snapshots
snapper -c root create-config /
btrfs subvolume delete /.snapshots
mkdir /.snapshots
mount -a
chmod 750 /.snapshots
```

Con `systemd`, activa la creación y limpieza automáticas; en sistemas sin él (ver [PID](./pid.md)) hay que sustituir los temporizadores por `cron`:

```bash
systemctl enable --now snapper-timeline.timer snapper-cleanup.timer
```

## Particiones

Con Btrfs el esquema de particiones es corto a propósito: casi todo el orden está dentro del sistema de archivos, en forma de subvolúmenes, no en particiones separadas. Separar los subvolúmenes tiene un motivo concreto: al revertir la raíz (`@`) no quieres que tus archivos personales, los registros ni la caché vuelvan atrás con ella.

El esquema es una tabla GPT con tres particiones (en un disco NVMe los nombres serán `/dev/nvme0n1p1`, `p2` y `p3`):

| Dispositivo | Tamaño | Tipo             | Etiqueta |
| ----------- | ------ | ---------------- | -------- |
| /dev/sda1   | 1G     | EFI System       | boot     |
| /dev/sda2   | 4G     | Linux swap       | swap     |
| /dev/sda3   | Resto  | Linux filesystem | root     |

Dentro de la partición Btrfs se crean estos subvolúmenes:

| Subvolumen   | Montaje       | Por qué separarlo                                            |
| ------------ | ------------- | ------------------------------------------------------------ |
| `@`          | `/`           | El sistema; es lo que se revierte                            |
| `@home`      | `/home`       | Tus archivos no retroceden con el sistema                    |
| `@snapshots` | `/.snapshots` | Donde Snapper guarda los snapshots                           |
| `@log`       | `/var/log`    | Conservas los registros para diagnosticar por qué falló algo |
| `@cache`     | `/var/cache`  | Evita inflar los snapshots con paquetes descargados          |

Además, `~/.cache` se crea como un subvolumen independiente dentro de `@home`, para que la caché de las aplicaciones tampoco entre en los snapshots de tus archivos. La partición de swap de 4 GiB queda como respaldo: el zram se configura con prioridad mayor (150) y se usa primero, como se detalla en [Components Optimization](./components-optimization.md).

La ESP se monta en `/boot` y se usa `systemd-boot`, lo que implica que el kernel y el initramfs viven en la ESP (FAT32) y no dentro de los snapshots de `@`. Tras revertir `@` es posible que el kernel de `/boot` no coincida con los módulos de `/usr/lib/modules` restaurados; la ArchWiki describe un hook de `pacman` que copia `/boot` dentro del snapshot en cada transacción para evitarlo.

| Dato          | Detalle                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Documentación | <https://wiki.archlinux.org/title/Partitioning> y <https://wiki.archlinux.org/title/EFI_system_partition> |
| Snapper       | <https://wiki.archlinux.org/title/Snapper>                                                                |
| Herramientas  | `cfdisk` (`util-linux`), `mkfs.fat` (`dosfstools`), `mkfs.btrfs` (`btrfs-progs`)                          |

**Instalación.** Desde el USB live (ver [Install Media](./install-media.md)). Estos comandos borran el disco; sustituye `/dev/sda` por el tuyo. Primero crea la tabla con `cfdisk` y formatea:

```bash
cfdisk /dev/sda
lsblk

# EFI
mkfs.fat -F 32 /dev/sda1
# Swap
mkswap /dev/sda2
# Root (Btrfs)
mkfs.btrfs -L root /dev/sda3
```

Crea los subvolúmenes:

```bash
mount /dev/sda3 /mnt

btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@snapshots
btrfs subvolume create /mnt/@log
btrfs subvolume create /mnt/@cache

umount /mnt
```

Móntalos con las mismas opciones en todos (`noatime` evita escribir la hora de acceso, `compress=zstd` activa la compresión y `commit=120` agrupa las escrituras cada 120 segundos en lugar de los 30 por defecto, a costa de poder perder hasta ese intervalo de datos recientes ante un corte de energía):

```bash
OPTS="noatime,compress=zstd,space_cache=v2,commit=120"

mount -o ${OPTS},subvol=@ /dev/sda3 /mnt

mkdir -p /mnt/home
mkdir -p /mnt/.snapshots
mkdir -p /mnt/var/log
mkdir -p /mnt/var/cache
mkdir -p /mnt/boot

mount -o ${OPTS},subvol=@home /dev/sda3 /mnt/home
mount -o ${OPTS},subvol=@snapshots /dev/sda3 /mnt/.snapshots
mount -o ${OPTS},subvol=@log /dev/sda3 /mnt/var/log
mount -o ${OPTS},subvol=@cache /dev/sda3 /mnt/var/cache

# EFI y swap
mount /dev/sda1 /mnt/boot
swapon /dev/sda2
```

Verifica el montaje:

```bash
mount | grep /mnt
findmnt -t btrfs
lsblk -f
```

Instala la base incluyendo `btrfs-progs` y genera el `fstab`:

```bash
pacstrap -K /mnt base linux-zen linux-zen-headers linux-firmware
pacstrap /mnt btrfs-progs

genfstab -U /mnt >> /mnt/etc/fstab
arch-chroot /mnt
```

Ya dentro del `chroot`, instala Snapper (ver arriba) y crea `~/.cache` como subvolumen (sustituye `usuario` por tu nombre de usuario una vez creado):

```bash
btrfs subvolume create /home/usuario/.cache
chown -R usuario:usuario /home/usuario/.cache
```

Por último, el kernel necesita saber qué subvolumen es la raíz. En la entrada de `systemd-boot` (`/boot/loader/entries/arch.conf`) agrega `rootflags=subvol=@` a `options` (sustituye `TU_UUID` por el resultado de `blkid -s UUID -o value /dev/sda3`, y ajusta `linux` e `initrd` si no usas `linux-zen`):

```conf
title   Arch Linux
linux   /vmlinuz-linux-zen
initrd  /initramfs-linux-zen.img
options root=UUID=TU_UUID rootflags=subvol=@ rw
```
