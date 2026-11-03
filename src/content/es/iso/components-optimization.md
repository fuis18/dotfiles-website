---
title: "Components Optimization"
description: "Optimización de componentes: zram, swap y compresión con zstd."
category: iso
tags: ["zram", "swap", "earlyoom", "zstd"]
---

Optimizar no es retocar valores por costumbre, sino quitar desperdicio donde el hardware ya lo permite. Hay dos desperdicios habituales en un equipo de uso diario: la memoria que se agota y obliga a escribir en disco, y los datos que ocupan más espacio del necesario en ese mismo disco. Ambos tienen la misma respuesta, que es comprimir, y ambos se resuelven con piezas que ya forman parte del kernel y de la base de Arch. A eso se suma una red de seguridad para el peor caso de la memoria, que es quedarse sin ella por completo.

## swap, zram y earlyoom

### swap

Para entender el zram primero hay que entender el _swap_. Los programas no usan la RAM directamente, sino memoria virtual: el kernel les reparte páginas (bloques de 4 KiB) y decide cuáles viven en la RAM física. El swap es un espacio en disco, una partición o un archivo, que el kernel usa como extensión de esa memoria: cuando la RAM escasea, mueve allí las páginas que hace rato nadie toca para liberar sitio, y las trae de vuelta si el programa las necesita otra vez.

Hay cuatro cosas que conviene tener claras:

- **Solo se mueven páginas «anónimas»**, es decir, la memoria propia de los programas (montones y pilas). Las páginas que provienen de archivos (el código de los binarios, la caché de disco) no necesitan swap, porque el kernel puede descartarlas y volver a leerlas del archivo original.
- **Tener swap no significa estar usándolo.** Con RAM suficiente permanece casi vacío. Aun así es útil, porque permite sacar páginas inactivas y dar ese espacio a la caché de disco, que acelera el sistema.
- **`vm.swappiness` regula la preferencia:** un valor bajo hace que el kernel evite el swap y descarte antes la caché de archivos; uno alto lo hace intercambiar páginas de programas con más facilidad.
- **Es donde se guarda la memoria al hibernar**, por lo que para hibernar hace falta un swap en disco, al menos del tamaño de la RAM.

Existen dos formas de tenerlo. Una partición dedicada, como la que se crea en [Mounts](./mounts.md), es lo más simple y no depende del sistema de archivos. Un archivo (`/swapfile`) permite cambiar el tamaño sin repartir el disco, pero en Btrfs exige crearlo con un comando especial (`btrfs filesystem mkswapfile`) y dentro de un subvolumen propio, para que el copy-on-write y los snapshots no interfieran.

El problema es que el disco, incluso un SSD, es órdenes de magnitud más lento que la memoria: cuando el sistema se queda sin RAM y empieza a intercambiar, todo se congela mientras las páginas viajan, y en un SSD cada intercambio gasta ciclos de escritura. Quitar el swap tampoco es la solución, porque entonces, al agotarse la RAM, el kernel mata procesos para liberar memoria.

### zram

zram propone otra idea: en lugar de mandar esas páginas al disco, comprimirlas y dejarlas en la propia RAM, dentro de un dispositivo de bloques. Como la memoria comprimida ocupa bastante menos que la original, entran más páginas en la misma RAM y el intercambio ocurre a velocidad de memoria, sin tocar el disco. Nació como _compcache_, un proyecto de Nitin Gupta que publicó sus primeras versiones en 2008, pasó por el área de _staging_ del kernel y entró a la rama principal en la versión 3.14 (marzo de 2014). Distribuciones como Fedora lo adoptaron por defecto a partir de su versión 33, configurado con `zram-generator`, la herramienta que se usa aquí.

La configuración que recomienda esta guía tiene tres piezas que se complementan:

- **Un dispositivo zram como swap principal**, con `zstd` como algoritmo y prioridad 150, para que el kernel lo use antes que cualquier otro.
- **La partición de swap de 4 GiB** creada en [Mounts](./mounts.md) como respaldo, con prioridad menor: solo se usa si el zram se llena.
- **Ajustes del kernel (`sysctl`)** que lo aprovechan: `vm.swappiness=100` indica que intercambiar es barato y no hay que esperar a quedarse sin RAM, y `vm.vfs_cache_pressure=150` hace que el kernel recupere antes la caché de nombres de archivo para dejar memoria a las aplicaciones.

El tamaño del zram se expresa como un factor de la RAM. Esta tabla resume los valores recomendados (la columna _Total_ es la RAM más el zram, es decir, la memoria efectiva con la que cuentas):

| RAM   | Factor (`zram-size`) | Total |
| ----- | -------------------- | ----- |
| 4 GB  | `ram * 0.5`          | 6 GB  |
| 6 GB  | `ram * 0.5`          | 9 GB  |
| 8 GB  | `ram * 0.5`          | 12 GB |
| 16 GB | `ram * 1`            | 32 GB |
| 32 GB | `ram * 1`            | 64 GB |
| 64 GB | `ram * 0.5`          | 96 GB |

Ese tamaño es la capacidad sin comprimir: lo que realmente consume de RAM es mucho menor, porque `zstd` suele comprimir las páginas de memoria entre dos y tres veces. Por eso un factor de 1 es seguro cuando hay RAM de sobra, y con poca RAM conviene uno más conservador.

Conviene tener presente que el zram gasta algo de CPU en comprimir, y que no sirve para hibernar: como se explicó antes, la hibernación necesita un swap en disco al menos del tamaño de la RAM, que los 4 GiB de respaldo no cubren.

Con `zram-generator`, la configuración (aquí con el factor de 8 GB de RAM; sustitúyelo según la tabla) queda así:

```conf
# /etc/systemd/zram-generator.conf
[zram0]
zram-size = ram * 0.5
compression-algorithm = zstd
swap-priority = 150
```

```conf
# /etc/sysctl.d/99-swappiness.conf
vm.swappiness=100
# 150 libera antes la caché de directorios, dejando más memoria libre
vm.vfs_cache_pressure=150
```

| Dato                | Detalle                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Primera publicación | _compcache_ 0.1 en febrero de 2008; incluido en el kernel mainline en la versión 3.14 (30 de marzo de 2014)                                 |
| Autores             | Nitin Gupta (_compcache_) y la comunidad del kernel, con mantenimiento de desarrolladores como Minchan Kim y Sergey Senozhatsky             |
| Licencia            | GPL-2.0 (zram); `zram-generator`: MIT                                                                                                       |
| Documentación       | <https://docs.kernel.org/admin-guide/blockdev/zram.html>, <https://wiki.archlinux.org/title/Zram> y <https://wiki.archlinux.org/title/Swap> |
| Código              | <https://github.com/systemd/zram-generator>                                                                                                 |

**Instalación.** Antes de configurar zram, estos son los comandos básicos de swap. Si la partición de swap ya estaba activa al ejecutar `genfstab` durante la instalación (ver [Install Media](./install-media.md)), su entrada en `/etc/fstab` ya existe; un archivo de swap necesita su línea `/swapfile none swap defaults 0 0`:

```bash
# Ver el swap activo y la memoria
swapon --show
free -h

# Partición de swap: crear, activar y desactivar
mkswap /dev/sda2
swapon /dev/sda2
swapoff /dev/sda2

# Archivo de swap en ext4
mkswap -U clear --size 4G --file /swapfile
swapon /swapfile

# Archivo de swap en Btrfs (en un subvolumen propio, por ejemplo @swap montado en /swap)
btrfs filesystem mkswapfile --size 4g /swap/swapfile
swapon /swap/swapfile
```

Después instala el generador, crea los dos archivos de arriba y actívalo sin reiniciar:

```bash
free -h
pacman -S zram-generator

nvim /etc/systemd/zram-generator.conf
nvim /etc/sysctl.d/99-swappiness.conf

systemctl daemon-reload
systemctl start systemd-zram-setup@zram0.service
sysctl --system
```

Verifica que el zram aparece primero y con mayor prioridad que la partición de swap:

```bash
swapon --show
zramctl
```

En sistemas sin `systemd` (ver [PID](./pid.md)) `zram-generator` no se puede usar, pero el mismo resultado se consigue a mano con `zramctl`, creando un servicio propio que ejecute esto al arrancar:

```bash
modprobe zram
zramctl --find --size 8G --algorithm zstd
mkswap /dev/zram0
swapon --priority 150 /dev/zram0
```

### earlyoom

Con zram y swap configurados, el sistema aguanta mucha más presión de memoria. Pero hay un caso que ninguna de las dos resuelve: cuando la demanda crece más rápido que la capacidad de comprimir e intercambiar. Ahí entra el _OOM killer_ del kernel, y su reputación es mala por una razón concreta: actúa tarde. Para cuando dispara, el sistema lleva minutos respondiendo a trompicones, el cursor no se mueve y el disco trabaja sin parar; la salida habitual es pulsar el botón de reinicio y perder lo que estabas haciendo.

earlyoom invierte el criterio. En lugar de esperar a que la asignación de memoria falle, vigila cuánta memoria y cuánto swap quedan libres y, cuando cruzan un umbral, mata él mismo al proceso que más memoria consume. El sistema nunca llega al estado de congelación, y lo que se pierde es una aplicación en lugar de la sesión entera.

Sus rasgos principales:

- **Espacio de usuario y sin dependencias:** un binario pequeño escrito en C, que no necesita nada más allá de `glibc`. Se puede leer y auditar entero.
- **Vigilancia continua:** consulta la memoria disponible hasta diez veces por segundo (menos a menudo si sobra memoria), con un coste de CPU despreciable.
- **Dos umbrales, dos señales:** por defecto actúa cuando queda menos del 10 % de memoria **y** menos del 10 % de swap (ambas condiciones a la vez), envía `SIGTERM` para permitir un cierre ordenado y, si el consumo sigue subiendo hasta la mitad de ese umbral, pasa a `SIGKILL`.
- **Control de a quién matar:** `--prefer` y `--avoid` aceptan expresiones regulares sobre el nombre del proceso, y `-P` permite ejecutar un script antes de matar nada.
- **Funciona sin `systemd`:** al ser un demonio independiente, se integra igual en OpenRC, runit, s6 o dinit (ver [PID](./pid.md)).

El detalle de que exija que **memoria y swap estén bajos a la vez** importa en esta configuración: con `vm.swappiness=100` el kernel intercambia con gusto, así que el swap se llena antes que la memoria. Si solo mirara la memoria libre, earlyoom no reaccionaría a tiempo.

| Dato                | Detalle                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| Primera publicación | Diciembre de 2013 (publicado en GitHub)                                               |
| Autor               | Jakob Unterwurzacher                                                                  |
| Versión actual      | 1.9.0 (septiembre de 2025)                                                            |
| Licencia            | MIT                                                                                   |
| Documentación       | <https://github.com/rfjakob/earlyoom> y <https://man.archlinux.org/man/earlyoom.1.en> |
| Código              | <https://github.com/rfjakob/earlyoom>                                                 |

**Instalación.**

```bash
sudo pacman -S earlyoom
sudo systemctl enable --now earlyoom
```

Comprueba que está vivo y observa sus decisiones en directo:

```bash
systemctl status earlyoom
journalctl -u earlyoom -f
```

**Configuración.** Los argumentos se pasan en `/etc/default/earlyoom`, mediante la variable `EARLYOOM_ARGS`. El ejemplo siguiente sube el umbral de memoria al 15 %, evita matar procesos críticos y prefiere sacrificar navegadores antes que otras aplicaciones:

```conf
# /etc/default/earlyoom
EARLYOOM_ARGS="-m 15 -s 10 --avoid '(^|/)(systemd|sshd|Xorg|pipewire|knot-resolver)$' --prefer '(^|/)(firefox|chrome|chromium)$'"
```

Tras editar el archivo, reinicia el servicio:

```bash
sudo systemctl restart earlyoom
```

**Cómo probarlo.** La forma más directa de verificar que reacciona es consumir memoria a propósito en una terminal y observar el registro desde otra:

```bash
# En una terminal: consume memoria sin límite
tail /dev/zero

# En otra: sigue las decisiones de earlyoom
journalctl -u earlyoom -f
```

Deberías ver cómo detecta la situación y termina el proceso antes de que el escritorio se congele.

```bash
systemctl status systemd-oomd
sudo systemctl disable --now systemd-oomd
```

## Zstd

Comprimir datos siempre tuvo un dilema: los algoritmos rápidos, como `gzip`, comprimen poco, y los que comprimen mucho, como `xz`, son lentos. Eso los dejaba relegados a los archivos que se comprimen una vez y se guardan, y era impensable usarlos en lo que se lee y escribe constantemente, como un sistema de archivos o la memoria. Yann Collet, ya conocido por LZ4, desarrolló Zstandard (`zstd`) en Facebook para cerrar esa brecha: la primera versión es de enero de 2015 y la 1.0, de agosto de 2016. Comprime mejor que `gzip` a velocidades comparables y descomprime muy rápido, con 22 niveles para elegir entre velocidad y tasa de compresión.

Por esa combinación terminó en todas las capas de un sistema como el de esta guía:

- **Btrfs:** el kernel incluye soporte de `zstd` desde la versión 4.14 (noviembre de 2017), y se activa con la opción `compress=zstd` al montar (ver [Mounts](./mounts.md)).
- **zram:** como algoritmo de compresión de la memoria (ver sección anterior).
- **Paquetes de Arch:** pacman 5.2 lo soportó en octubre de 2019, y desde enero de 2020 los paquetes de los repositorios oficiales se comprimen con `zstd` en lugar de `xz`, por eso hoy ves archivos `.pkg.tar.zst`.
- **Initramfs:** `mkinitcpio` puede comprimirlo con `zstd` mediante `COMPRESSION="zstd"` en `/etc/mkinitcpio.conf`.

En la práctica, el nivel se elige según el uso. Para algo que se comprime en caliente, como el sistema de archivos, los niveles bajos son los adecuados porque la CPU no debe volverse el cuello de botella; los altos se reservan para archivos que se comprimen una vez:

| Uso                  | Nivel recomendado                                                       |
| -------------------- | ----------------------------------------------------------------------- |
| Btrfs (montaje)      | `compress=zstd` (nivel 3 por defecto) o `zstd:1` si priorizas velocidad |
| zram                 | `zstd` (nivel por defecto)                                              |
| Archivos que guardas | `-19` (con `-T0` para usar todos los núcleos)                           |

Hay que tener presente que los datos que ya están comprimidos (vídeo, fotos JPG, archivos `.zst`) no ganan nada y solo gastan CPU. Con la opción `compress` de Btrfs (no `compress-force`), el sistema lo detecta y deja de comprimir esos archivos, así que no hace falta excluirlos a mano.

| Dato                | Detalle                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Primera publicación | 23 de enero de 2015; versión 1.0 y publicación como código abierto el 31 de agosto de 2016 |
| Autores             | Yann Collet (autor original, Facebook), con Nick Terrell y Przemysław Skibiński            |
| Licencia            | BSD / GPL-2.0 (doble licencia)                                                             |
| Estándar            | RFC 8878 (sustituyó a la RFC 8478 de 2018)                                                 |
| Documentación       | <https://facebook.github.io/zstd/> y <https://wiki.archlinux.org/title/Btrfs#Compression>  |
| Código              | <https://github.com/facebook/zstd>                                                         |

**Instalación.** Viene en la base de Arch como dependencia de `pacman`; si necesitas la herramienta de línea de comandos:

```bash
pacman -S zstd
```

Uso básico:

```bash
# Comprimir y descomprimir
zstd -T0 -19 archivo
zstd -d archivo.zst

# Con tar
tar --zstd -cf copia.tar.zst carpeta/
tar --zstd -xf copia.tar.zst
```
