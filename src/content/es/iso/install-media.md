---
title: "Medios y Entornos de Instalación"
description: "Estados de instalación: USB live, chroot y tty."
category: iso
tags: ["usb-live", "chroot", "tty"]
---

Un instalador gráfico de «siguiente, siguiente» es cómodo, pero te entrega un sistema que no sabes de qué está hecho. Instalar a mano, paso a paso, es lo que te enseña qué piezas lo componen y, sobre todo, cómo repararlo cuando falla.

## USB live

Un sistema instalado no puede particionarse ni reemplazarse a sí mismo mientras corre. Antes se arrancaba desde disquetes y CDs, lentos, frágiles y de un solo uso. El USB live resuelve eso: arranca un Linux completo desde un pendrive, lo carga en RAM y deja los discos del equipo libres para particionar, formatear y montar sin que nada los esté usando.

Para Arch y CachyOS (ver [Distro Base](./distro-base.md)) la ISO la genera `archiso` y se publica una nueva cada mes. El procedimiento es el mismo para cualquier distro: descargar, verificar y escribir.

Descarga la ISO desde <https://archlinux.org/download/>, comprueba su firma y escríbela con `dd` al pendrive.

`dd` (que viene de Dataset Destroyer, llamado así cariñosamente porque si te equivocas de letra borras tu propio disco duro) hace una copia bit a bit, bloque a bloque, así que confirma con `lsblk` cuál es antes de ejecutarlo.

```bash
gpg --keyserver-options auto-key-retrieve --verify archlinux-x86_64.iso.sig archlinux-x86_64.iso

lsblk
dd bs=4M if=archlinux-x86_64.iso of=/dev/sdX conv=fsync oflag=direct status=progress
```

Si instalas en una máquina virtual, activa UEFI y la aceleración 3D en su configuración. Ya dentro de la ISO, el orden es: comprobar el modo de arranque, configurar el teclado, conectarse a internet y, si hace falta, refrescar las llaves de firma:

```bash
# Debe imprimir 64 si arrancaste en UEFI
cat /sys/firmware/efi/fw_platform_size

# Teclado
localectl list-keymaps
loadkeys la-latin1

# Red (cable: basta con comprobar la conexión)
ip link
iwctl
```

Para Wi-Fi, dentro de `iwctl` (el mismo `iwd` que quedará instalado en el sistema final, ver [Network](./network.md)):

```bash
device list
station wlan0 scan
station wlan0 get-networks
station wlan0 connect "Tu_wifi"
exit
```

```bash
ping -c 5 archlinux.org
```

Si más adelante `pacstrap` falla con errores de firma, normalmente es un keyring desactualizado:

```bash
pacman-key --init
pacman-key --populate archlinux
pacman -Sy archlinux-keyring
```

A partir de aquí se particiona y monta el disco (ver [Mounts](./mounts.md)), y recién entonces se pasa al siguiente paso.

| Dato          | Detalle                                                             |
| ------------- | ------------------------------------------------------------------- |
| Origen        | ISO generada con `archiso`; Arch publica una versión nueva cada mes |
| Autores       | Equipo de Arch Linux (`archiso`)                                    |
| Documentación | <https://wiki.archlinux.org/title/Installation_guide>               |
| Código        | <https://gitlab.archlinux.org/archlinux/archiso>                    |
| Descarga      | <https://archlinux.org/download/>                                   |

## chroot

Tras `pacstrap`, el sistema nuevo ya está copiado en `/mnt`, pero no está arrancado: sigues dentro del USB live, y comandos como `passwd`, `systemctl enable` o `mkinitcpio` actuarían sobre el live, no sobre el disco. `chroot` (change root) lo resuelve cambiando lo que un proceso ve como `/`: entras en `/mnt` y todo lo que ejecutes actúa sobre el sistema nuevo, como si ya hubieras arrancado en él.

La idea no es nueva: `chroot` apareció en Unix V7 en 1979 y Bill Joy lo añadió a BSD en 1982 precisamente para probar instalaciones y compilaciones. `arch-chroot` es una envoltura de las `arch-install-scripts` que monta antes `/proc`, `/sys` y `/dev`, que el `chroot` simple no monta, y por eso se usa en lugar de `chroot` a secas.

El flujo, con los discos ya montados, es este. Primero se instala la base (`-K` inicializa un keyring de pacman nuevo en el sistema destino):

```bash
lsblk -f
mount | grep mnt

pacstrap -K /mnt base linux-zen linux-zen-headers linux-firmware
pacstrap /mnt sudo nvim git iwd openresolv knot-resolver less
```

Según tu procesador, instala también el microcódigo (`lscpu` te dice cuál tienes):

| Intel                       | AMD                       |
| --------------------------- | ------------------------- |
| `pacstrap /mnt intel-ucode` | `pacstrap /mnt amd-ucode` |

Si usas Btrfs, añade también `btrfs-progs` (ver [Mounts](./mounts.md)). Luego, el teclado de la consola y el `fstab`:

```bash
cat > /mnt/etc/vconsole.conf <<EOF
KEYMAP=la-latin1
XKBLAYOUT=latam
EOF

genfstab -U /mnt > /mnt/etc/fstab
arch-chroot /mnt
```

Ya dentro del chroot se configura lo que hace único al sistema. Primero idioma, zona horaria y nombre del equipo (ajusta `es_PE` y `America/Lima` a tu caso):

```bash
sed -i 's/^#es_PE.UTF-8/es_PE.UTF-8/;s/^#en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen
locale-gen
echo "LANG=es_PE.UTF-8" > /etc/locale.conf

ln -sf /usr/share/zoneinfo/America/Lima /etc/localtime
hwclock --systohc

echo mi-pc > /etc/hostname
cat > /etc/hosts <<EOF
127.0.0.1  localhost
::1        localhost
127.0.0.1  mi-pc.localhost mi-pc
EOF
```

Después, contraseña de root, tu usuario y `sudo` para el grupo `wheel`:

```bash
passwd
useradd -m usuario
passwd usuario
usermod -aG wheel usuario
groups usuario

EDITOR=nvim visudo
# Descomenta: %wheel ALL=(ALL:ALL) ALL
```

Habilita los servicios (`timedatectl set-ntp true` no funciona aquí porque necesita `systemd` corriendo, así que se habilita `systemd-timesyncd` para que sincronice la hora desde el primer arranque; los demás se explican en [Network](./network.md)):

```bash
systemctl enable iwd knot-resolver systemd-timesyncd
```

El último paso es el gestor de arranque. En UEFI se usa `systemd-boot`, que ya viene con `systemd`:

```bash
bootctl install

cat > /boot/loader/loader.conf <<EOF
default  arch.conf
timeout  3
console-mode max
editor   no
EOF

# UUID de la partición raíz (en el esquema Btrfs de Mounts es /dev/sda3)
blkid -s UUID -o value /dev/sda3
```

Crea `/boot/loader/entries/arch.conf` con ese UUID (ajusta `intel-ucode` o `amd-ucode` y quita esa línea si no usas microcódigo). En ext4 las `options` son estas; en Btrfs hay que añadir `rootflags=subvol=@`, como se explica en [Mounts](./mounts.md):

```conf
title   Arch Linux
linux   /vmlinuz-linux-zen
initrd  /intel-ucode.img
initrd  /initramfs-linux-zen.img
options root=UUID=TU_UUID rw
```

`bootctl` avisará si `/boot` es legible por todos los usuarios (por la semilla aleatoria que guarda). En `/etc/fstab` ajusta las opciones de la ESP a `fmask=0077,dmask=0077`. Luego regenera el initramfs y comprueba:

```bash
mkinitcpio -P
bootctl list
```

En BIOS (sin UEFI) se usa GRUB en lugar de `systemd-boot`, con una tabla de particiones distinta (una partición «BIOS boot» de 2 MB):

```bash
pacman -S grub
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```

Para terminar, sal del chroot, desmonta y reinicia (retira el USB cuando la máquina se apague):

```bash
exit
umount -R /mnt
reboot
```

Si algo falla y necesitas volver a entrar, arranca otra vez el USB live, monta los discos como antes y repite `arch-chroot /mnt`: el sistema no se rompe por entrar y salir.

| Dato              | Detalle                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Origen            | `chroot`: Unix V7 (1979), añadido a BSD por Bill Joy el 18 de marzo de 1982                                         |
| Herramienta       | `arch-chroot` y `pacstrap` forman parte de `arch-install-scripts`                                                   |
| Documentación     | <https://wiki.archlinux.org/title/Chroot> y <https://wiki.archlinux.org/title/Installation_guide>                   |
| Código            | <https://gitlab.archlinux.org/archlinux/arch-install-scripts>                                                       |
| Equivalente Artix | `basestrap` en lugar de `pacstrap` y `artix-chroot` en lugar de `arch-chroot` (ver [Distro Base](./distro-base.md)) |

**Instalación.** Las herramientas ya vienen en la ISO. En un Arch ya instalado se obtienen con:

```bash
sudo pacman -S arch-install-scripts
```

## tty

Los instaladores gráficos necesitan que ya funcione una pila gráfica completa (controlador de vídeo, servidor de pantalla, escritorio) y esconden detrás de botones lo que de verdad ocurre. Si algo de esa pila falla, no tienes con qué arreglarlo. La tty (de _teletypewriter_, heredera de las viejas teleimpresoras) es la interfaz mínima que el kernel ofrece siempre: texto y teclado, sin depender de nada más. Por eso es donde se instala, y también donde se repara.

Linux ofrece varias consolas virtuales a las que cambias con `Ctrl+Alt+F1` a `F6` (o con `chvt`), y cada una tiene su propia sesión. La del USB live es la primera; en el sistema instalado, las consolas son el sitio al que vuelves cuando una sesión gráfica se cuelga. Desde ellas puedes revisar los registros, ejecutar `snapper` o corregir una configuración sin necesidad de entorno gráfico.

Lo que conviene saber para trabajar cómodo:

- **Teclado:** `loadkeys la-latin1` lo cambia en la sesión; para que sea permanente se escribe `KEYMAP=la-latin1` en `/etc/vconsole.conf`.
- **Fuente:** en pantallas de alta resolución el texto sale diminuto; `setfont ter-132b` (Terminus, incluida en la ISO) lo agranda. Para dejarlo fijo, se añade `FONT=ter-132b` a `/etc/vconsole.conf`.
- **Escribir menos y pegar más:** en el USB live puedes ejecutar `passwd` para ponerle contraseña a root y conectarte desde otro equipo con `ssh root@IP` (si el servicio no está activo, `systemctl start sshd`), lo que permite copiar y pegar los comandos de esta guía en lugar de teclearlos.
- **Desde la tty se arranca todo lo demás:** el greeter (ver [Greeter](./greeter.md)) y el gestor de ventanas (ver [Window Manager](./window-manager.md)) se lanzan desde aquí.

```bash
# Cambiar de consola virtual
chvt 2

# Fuente grande y teclado latinoamericano
setfont ter-132b
loadkeys la-latin1

# Persistir ambos en el sistema instalado
cat > /etc/vconsole.conf <<EOF
KEYMAP=la-latin1
FONT=ter-132b
EOF
```

| Dato          | Detalle                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Origen        | Consolas virtuales del kernel Linux, herederas de las teleimpresoras (_teletypewriter_)                                    |
| Herramientas  | `loadkeys`, `setfont`, `chvt` (paquete `kbd`) y `agetty` (`util-linux`)                                                    |
| Documentación | <https://wiki.archlinux.org/title/Linux_console> y <https://wiki.archlinux.org/title/Linux_console/Keyboard_configuration> |

**Instalación.** `kbd` y las fuentes Terminus ya vienen en la ISO. En el sistema instalado, la fuente se añade con:

```bash
pacman -S terminus-font
```
