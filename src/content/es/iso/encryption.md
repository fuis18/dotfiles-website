---
title: "Cifrado de disco"
description: "Cifrado con LUKS2, swap cifrado, TPM2 y alcance real de la protección."
category: iso
tags: ["luks", "dm-crypt", "cryptsetup", "tpm2", "swap"]
---

Un portátil se pierde o se roba mucho más a menudo de lo que se rompe. Sin cifrado, quien lo encuentre solo tiene que arrancar desde un USB para leer todo tu disco, y la contraseña de tu usuario no lo impide: protege el inicio de sesión, no los datos.

## LUKS2 y dm-crypt

Antes del cifrado de disco completo se cifraban carpetas o archivos sueltos (eCryptfs, EncFS). Funcionaba, pero dejaba a la vista los nombres de los archivos, sus tamaños y la estructura de directorios, y cada archivo había que protegerlo por separado. **dm-crypt** resuelve eso trabajando por debajo del sistema de archivos: es un módulo del kernel (de Christophe Saout, 2004) que cifra el dispositivo de bloques entero, de modo que el sistema de archivos, con todo lo que contiene, se guarda ya cifrado.

dm-crypt solo cifra; no sabe dónde guardar la clave ni cómo cambiar la contraseña. **LUKS** (_Linux Unified Key Setup_, de Clemens Fruhwirth) añade esa parte: una cabecera en el disco que guarda varias contraseñas, llamadas _key slots_, cada una capaz de abrir la misma clave maestra. Eso permite cambiar la contraseña o añadir una de recuperación sin volver a cifrar el disco. **LUKS2**, introducida con `cryptsetup` 2.0 (10 de diciembre de 2017), pasó a ser el formato por defecto en 2.1.0 (8 de febrero de 2019) y adoptó **Argon2id** como derivador por defecto en 2.4.0 (18 de agosto de 2021): un algoritmo que obliga a gastar mucha memoria por cada intento, lo que encarece los ataques por fuerza bruta con GPU. La herramienta, `cryptsetup`, está mantenida por Milan Broz y colaboradores.

| Característica                  | LUKS1                | LUKS2                                          |
| ------------------------------- | -------------------- | ---------------------------------------------- |
| Derivador de clave (PBKDF)      | Solo PBKDF2          | PBKDF2, Argon2i y Argon2id                     |
| Cabecera de respaldo            | No                   | Sí, permite recuperar una cabecera dañada      |
| Clave en el keyring del kernel  | No                   | Sí, evita que el espacio de usuario la vea     |
| Tamaño de sector personalizable | No                   | Sí                                             |
| Tokens de desbloqueo automático | No                   | Sí (llaves del kernel, TPM, otros)             |
| Recifrado en caliente           | No (solo sin montar) | Sí, en línea y resistente a fallos             |
| Compatibilidad con GRUB         | Sí                   | Parcial (requiere PBKDF2 para `/boot` cifrado) |

Con un procesador moderno el cifrado (AES-XTS con aceleración por hardware) cuesta muy poco rendimiento. Lo que más conviene recordar sobre su uso:

- **Un solo contenedor, y Btrfs dentro.** El cifrado va debajo del sistema de archivos: Btrfs, los subvolúmenes y los snapshots de [Mounts](./mounts/) funcionan igual, pero sobre `/dev/mapper/cryptroot`.
- **La ESP queda sin cifrar.** El firmware UEFI solo lee la partición FAT, así que el kernel y el initramfs viven en claro (ver [Bootloader y Kernel](./bootloader/)); lo que se cifra es la raíz.
- **TRIM y cifrado se contradicen un poco.** Pasar los comandos TRIM a un SSD cifrado mejora su vida útil, pero revela qué bloques están libres. Es una decisión consciente, y por eso se activa de forma explícita.
- **La cabecera es un punto único de fallo.** Si se daña, pierdes todo el disco aunque recuerdes la contraseña, así que se guarda una copia fuera del disco.

| Dato                  | Detalle                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Origen                | dm-crypt: 2004 (Christophe Saout); LUKS: Clemens Fruhwirth                                                     |
| LUKS2                 | `cryptsetup` 2.0 (10 de diciembre de 2017)                                                                     |
| LUKS2 por defecto     | `cryptsetup` 2.1.0 (8 de febrero de 2019)                                                                      |
| Argon2id por defecto  | `cryptsetup` 2.4.0 (18 de agosto de 2021)                                                                      |
| Autores actuales      | Milan Broz y colaboradores (`cryptsetup`)                                                                      |
| Licencia              | GPL-2.0 o posterior                                                                                            |
| Algoritmo por defecto | AES-XTS (`aes-xts-plain64`) y derivación de claves Argon2id                                                    |
| Documentación         | <https://wiki.archlinux.org/title/Dm-crypt> y <https://wiki.archlinux.org/title/Dm-crypt/System_configuration> |
| Código                | <https://gitlab.com/cryptsetup/cryptsetup>                                                                     |

**Instalación.** Se hace en el USB live, después de crear las particiones y antes de formatear Btrfs. El esquema de [Mounts](./mounts/) no cambia salvo que la tercera partición pasa a ser el contenedor cifrado. Crea la ESP y el swap igual que allí, y cifra la tercera:

```bash
cryptsetup luksFormat --type luks2 /dev/sda3
cryptsetup open /dev/sda3 cryptroot
mkfs.btrfs -L root /dev/mapper/cryptroot
```

Todo lo demás es idéntico al procedimiento de [Mounts](./mounts/), sustituyendo `/dev/sda3` por `/dev/mapper/cryptroot` al crear los subvolúmenes y montarlos:

```bash
mount /dev/mapper/cryptroot /mnt
btrfs subvolume create /mnt/@
# ...y el resto de subvolúmenes, igual que en Mounts
umount /mnt

OPTS="noatime,compress=zstd,space_cache=v2,commit=120"
mount -o ${OPTS},subvol=@ /dev/mapper/cryptroot /mnt
# ...y el resto de montajes, igual que en Mounts
```

Guarda una copia de la cabecera fuera de este disco y añade una segunda contraseña de recuperación:

```bash
cryptsetup luksHeaderBackup /dev/sda3 --header-backup-file luks-header.img
cryptsetup luksAddKey /dev/sda3
```

Ya dentro del `arch-chroot`, el initramfs tiene que saber desbloquear la raíz. En `/etc/mkinitcpio.conf` añade el hook `encrypt` entre `block` y `filesystems`, y comprueba que `keymap` va antes, porque es lo que permite escribir la contraseña con tu teclado (`la-latin1`, tomado de `/etc/vconsole.conf`; ver [Install Media](./install-media/)):

```bash
# /etc/mkinitcpio.conf (hooks clásicos, también válidos en Artix y Obarun)
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt filesystems fsck)
```

```bash
mkinitcpio -P
```

La alternativa para sistemas con `systemd` son los hooks `systemd`, `sd-vconsole` y `sd-encrypt`, que no se mezclan con los anteriores:

```bash
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck)
```

Por último, el gestor de arranque debe indicar qué dispositivo desbloquear. Usa siempre el UUID del contenedor LUKS (`blkid -s UUID -o value /dev/sda3`), no el de `/dev/mapper/cryptroot` ni el PARTUUID. Con el hook `encrypt`, en `/boot/loader/entries/arch.conf`:

```conf
options cryptdevice=UUID=UUID_DE_SDA3:cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ rw
```

Y con `sd-encrypt`:

```conf
options rd.luks.name=UUID_DE_SDA3=cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ rw
```

Si decides activar TRIM, añade `:allow-discards` al final de `cryptdevice=...` (o `rd.luks.options=discard` con `sd-encrypt`) y acepta la fuga de información sobre los bloques libres que eso implica.

## Swap cifrado

Cifrar la raíz y dejar el swap en claro anula el esfuerzo: cuando el sistema intercambia páginas de memoria a disco, ahí caen contraseñas, claves y documentos abiertos, que quedarían legibles en la partición de swap. Hay que ocuparse del swap también.

Pero "cifrar el swap" no es una sola cosa. También está **el zram como constante**: vive en RAM comprimida y nunca toca el disco, así que no necesita cifrado y no cambia entre escenarios (ver [Components Optimization](./components-optimization/)). Lo que hay que decidir es **qué poner en disco**, y ahí solo hay tres posibilidades.

|                    | **A. Nada en disco**   | **B. Swap cifrado con clave aleatoria** | **C. Swapfile dentro de la raíz cifrada**     |
| ------------------ | ---------------------- | --------------------------------------- | --------------------------------------------- |
| Dónde vive el swap | Solo zram (RAM)        | zram + partición cifrada                | zram + archivo en el Btrfs cifrado            |
| Clave del swap     | No aplica              | Aleatoria, nueva en cada arranque       | La misma de la raíz                           |
| ¿Hibernar?         | No                     | No                                      | **Sí**                                        |
| Complejidad        | Ninguna                | Baja (`crypttab` + `fstab`)             | Alta (`resume=`, `resume_offset=`)            |
| Espacio en disco   | 0                      | Fijo                                    | Del tamaño de la RAM                          |
| Riesgo principal   | OOM killer si se agota | Ninguno grave                           | Un `btrfs balance` invalida el desplazamiento |

### A. Solo zram, nada en disco

Es la opción más simple y la más privada: como el zram vive en RAM, **ningún dato de memoria llega jamás al disco**, ni siquiera cifrado. No hay `/etc/crypttab` que escribir, ni línea de swap en `/etc/fstab`, ni clave que gestionar. Con `zram-generator` configurado, no queda nada más por hacer.

Sus dos límites son claros. El primero es que **no permite hibernar**: la ArchWiki lo dice sin ambigüedad — no se puede hibernar hacia un swap sobre zram, ni siquiera configurando un dispositivo de respaldo, y `logind` bloquea el intento. El segundo es que **no hay red de seguridad**: si la RAM y el zram se llenan a la vez, al kernel no le queda a dónde mover páginas y el OOM killer empieza a matar procesos. Con 16 GiB o más eso casi nunca ocurre; con 4 u 8 GiB es una posibilidad real.

### B. zram + swap en disco con clave aleatoria

El zram sigue siendo el swap principal (prioridad 150), y la partición de 4 GiB de [Mounts](./mounts/) actúa como respaldo: solo se usa si el zram se llena, y evita llegar al OOM killer. Su contenido se cifra con una clave aleatoria que se genera en cada arranque y se descarta al apagar, así que lo que haya caído ahí es ilegible después.

El precio de esa clave efímera es que **tampoco permite hibernar**: al apagar el equipo la clave desaparece, y al volver no habría forma de leer la imagen guardada.

| Dato          | Detalle                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| Documentación | <https://wiki.archlinux.org/title/Dm-crypt/Swap_encryption>                            |
| Herramientas  | `/etc/crypttab` (`systemd-cryptsetup`, o su equivalente en otros inits) y `cryptsetup` |

**Instalación.** Dale a la partición de swap un nombre de partición estable (en `cfdisk`, el nombre `swap`), porque `/dev/sda2` puede cambiar de un arranque a otro. La configuración se escribe en `/etc/crypttab` y `/etc/fstab` del sistema instalado, no en el USB live:

```conf
# /etc/crypttab
swap  /dev/disk/by-partlabel/swap  /dev/urandom  swap,cipher=aes-xts-plain64,size=512
```

```conf
# /etc/fstab (sustituye la línea de swap que generó genfstab)
/dev/mapper/swap  none  swap  defaults  0 0
```

Esto borra el contenido de la partición en cada arranque; verifica que `by-partlabel/swap` apunte a la partición correcta antes de reiniciar:

```bash
ls -l /dev/disk/by-partlabel/
```

### C. Swapfile dentro de la raíz cifrada (la única que permite hibernar)

Si necesitas hibernar, el swap tiene que sobrevivir a los apagados, y eso significa que su clave no puede ser efímera. La forma más limpia de conseguirlo es **no cifrar el swap por separado**: se crea un archivo de swap dentro del Btrfs que ya está cifrado, de modo que hereda la clave de la raíz y se abre junto con ella, sin una segunda contraseña ni un segundo contenedor.

La ArchWiki señala que, con un initramfs basado en systemd y una raíz cifrada, esta es la vía más simple y flexible: el archivo se crea, se activa y se añade a `/etc/fstab`, y funciona para hibernar sin configuración adicional más allá de los parámetros de arranque.

Hay tres detalles que hay que respetar, y son la razón de que este escenario sea el más laborioso:

- **`resume=` apunta al dispositivo mapeado, no a la partición cruda.** Debe ser `/dev/mapper/cryptroot` (o su UUID), nunca `/dev/sda3`. Es el error más habitual al configurar hibernación sobre cifrado.
- **Un swapfile necesita además `resume_offset=`**, que indica en qué punto del sistema de archivos está el archivo. En Btrfs se obtiene con `btrfs inspect-internal map-swapfile -r`, no con `filefrag` como en ext4.
- **En Btrfs el archivo necesita su propio subvolumen, sin compresión y sin copy-on-write.** Se crea con `btrfs filesystem mkswapfile`, que ya se encarga de eso.

> Un `btrfs balance` completo puede reubicar el swapfile y dejar el `resume_offset=` obsoleto, con lo que la hibernación deja de funcionar hasta recalcularlo. Si usas herramientas de mantenimiento de Btrfs que hacen balance automático, tenlo presente.

El costo de este escenario es doble. La imagen de hibernación ocupa en disco aproximadamente lo que la RAM en uso, así que el archivo debe ser al menos del tamaño de la RAM y queda reservado permanentemente. Y reanudar es más lento que despertar de una suspensión en RAM, porque hay que leer varios gigabytes desde el disco.

**Instalación.** Con la familia de hooks de systemd (`sd-encrypt`) es el camino más directo. Primero el subvolumen y el archivo:

```bash
# Subvolumen propio para el swap, sin compresión
mount -o subvol=/ /dev/mapper/cryptroot /mnt
btrfs subvolume create /mnt/@swap
umount /mnt

mkdir -p /swap
mount -o subvol=@swap,compress=no /dev/mapper/cryptroot /swap

btrfs filesystem mkswapfile --size 16g /swap/swapfile
swapon /swap/swapfile
```

El `--size` debe cubrir tu RAM (ajústalo). Después, la línea de montaje en `/etc/fstab` y el desplazamiento:

```conf
# /etc/fstab
/dev/mapper/cryptroot  /swap  btrfs  subvol=@swap,compress=no  0 0
/swap/swapfile         none   swap   defaults,noatime          0 0
```

```bash
btrfs inspect-internal map-swapfile -r /swap/swapfile
```

Ese número es el `resume_offset=`. Con los hooks de systemd, los parámetros de arranque quedan así (sustituye el UUID por el del contenedor LUKS, `blkid -s UUID -o value /dev/sda3`):

```conf
options rd.luks.name=UUID_DE_SDA3=cryptroot root=/dev/mapper/cryptroot rootflags=subvol=@ \
        resume=/dev/mapper/cryptroot resume_offset=NUMERO rw
```

Con los hooks clásicos (`encrypt`) hay que añadir además el hook `resume` al initramfs, después de `encrypt`:

```bash
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block encrypt resume filesystems fsck)
```

```bash
mkinitcpio -P
```

Y comprobar que la hibernación funciona antes de confiar en ella:

```bash
systemctl hibernate
cat /proc/cmdline | tr ' ' '\n' | grep -E 'resume'
```

### Cómo elegir

| Situación                                                                | Escenario                                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 16 GiB o más de RAM y no hibernas                                        | **A** — solo zram, sin nada en disco                                             |
| Menos de 16 GiB, o quieres una red de seguridad ante picos               | **B** — zram + swap cifrado aleatorio                                            |
| Necesitas hibernar (portátil que pasa días apagado, o ahorro de batería) | **C** — swapfile dentro de la raíz cifrada                                       |
| Servidor o estación de trabajo crítica                                   | **C**, o una partición de swap en su propio contenedor LUKS con archivo de clave |

Las tres son acumulables en el sentido de que zram siempre puede estar presente: los escenarios B y C no lo sustituyen, lo complementan con un destino en disco de distinta naturaleza.

## TPM2 y lo que el cifrado no protege

Escribir la contraseña de cifrado en cada arranque es incómodo, y muchos acaban eligiendo contraseñas cortas. Una alternativa es dejar que el **TPM**, un chip del equipo que guarda claves de forma segura, desbloquee el disco automáticamente, pero solo si el arranque no ha sido alterado. El TPM puede sellar la clave cifrándola con una medición del estado del firmware y de Secure Boot (registro PCR 7), de modo que si alguien cambia lo que arranca, el TPM se niega a entregarla.

### `clevis` + `tpm2-tools`

`clevis` permite enlazar la clave del contenedor LUKS con una política del TPM, y `tpm2-tools` para la comunicación con el chip.

| Dato          | Detalle                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| Herramientas  | `clevis`, `clevis-luks`, `tpm2-tools`                                            |
| Requisitos    | Chip TPM 2.0, initramfs con soporte para clevis, y Secure Boot configurado       |
| Documentación | <https://wiki.archlinux.org/title/Clevis> y <https://github.com/latchset/clevis> |

**Instalación.** Instala las herramientas, bind la clave al TPM, y regenera el initramfs para que incluya los componentes necesarios:

```bash
sudo pacman -S clevis clevis-luks clevis-systemd tpm2-tools tpm2-tss
sudo clevis luks bind -d /dev/sda3 tpm2 '{"pcr_bank":"sha256","pcr_ids":"7"}'
```

El comando te pedirá la contraseña actual del contenedor LUKS. Después, añade al `/etc/crypttab` (del sistema instalado, no del live) la opción `tpm2-device=auto` para que el initramfs sepa que debe intentar el desbloqueo automático:

```conf
# /etc/crypttab
cryptroot  UUID=TU_UUID_LUKS  none  tpm2-device=auto
```

Y regenera el initramfs. Con los hooks de systemd, `clevis` se incluye automáticamente. Con los hooks clásicos, añade `clevis` y `clevis-luks` a la configuración de `mkinitcpio` o regénéralo manualmente para que copie las bibliotecas necesarias.

```bash
mkinitcpio -P
```

**Nota sobre PCRs:** Los valores de los PCRs que monitorea el TPM pueden variar según tu configuración. PCR 7 es el estándar para Secure Boot, pero puedes añadir otros (como PCR 0, 3, 4, 5) para proteger contra cambios en el firmware o en el initramfs. Consulta `tpm2_pcrread` para ver los valores actuales de tu sistema.

### Alcance real del cifrado de disco

Independientemente del método de desbloqueo, conviene entender qué protege el cifrado y qué no:

| Protege contra                                         | No protege contra                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Robo o pérdida del equipo apagado                      | Acceso al disco mientras el sistema está en marcha                             |
| Dispositivos vendidos o entregados al servicio técnico | Ataques al arranque (_evil maid_) si la ESP no está firmada                    |
| Acceso físico casual (alguien que encienda el equipo)  | Desbloqueo por TPM sin PIN (abre el disco a quien encienda el equipo)          |
| Lectura directa de la partición desde otro sistema     | Pérdida de la cabecera o contraseña (sin respaldo, los datos son inaccesibles) |

Un detalle práctico: el desbloqueo por TPM sin PIN abre el disco a cualquiera que encienda el equipo. Solo protege frente a que extraigan el disco; añade un PIN (`--tpm2-with-pin=yes`) si quieres protección también ante un portátil robado y encendido. Y recuerda: no es una copia de seguridad. Si pierdes la contraseña o se corrompe la cabecera, pierdes todo; por eso se guarda una copia de la cabecera y una contraseña de recuperación.

## Alternativas rápidas

Existen otras capas de cifrado según el caso:

- **fscrypt**: Cifra a nivel de sistema de archivos (ext4, F2FS, UBIFS), permitiendo políticas por directorio. Ideal para aislar carpetas entre usuarios en un mismo equipo. No cifra metadatos del sistema de archivos salvo nombres.
- **OPAL**: Cifrado por hardware en el propio disco. Requiere kernel 6.4+ y discos compatibles. No consume CPU pero no permite redimensionar.

No compiten con LUKS: pueden combinarse. Es habitual usar LUKS para el disco completo y fscrypt para aislar carpetas personales.
