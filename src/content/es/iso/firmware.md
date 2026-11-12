---
title: "Firmware"
description: "Arranque del equipo: BIOS y UEFI, GPT, la partición EFI y Secure Boot."
category: iso
tags: ["uefi", "bios", "gpt", "esp", "secure-boot"]
---

Antes de que exista un gestor de arranque, un kernel o un sistema de archivos, hay un programa grabado en un chip de la placa madre que se ejecuta al pulsar el botón de encendido. Ese programa es el firmware, y es el responsable de comprobar que el hardware responde, encontrar algo arrancable y cederle el control. Durante casi treinta años cumplió esa tarea con el BIOS; desde mediados de los 2000 lo hace con UEFI.

## BIOS: el firmware original

El término BIOS (_Basic Input/Output System_) se remonta al trabajo de Gary Kildall en CP/M a mediados de los años setenta, y llegó al IBM PC en 1981. El BIOS es, en esencia, un conjunto de rutinas almacenadas en un chip de memoria no volátil de la placa, que se ejecutan al encender el equipo.

Lo que hace, en orden:

1. **POST** (_Power-On Self-Test_): comprueba que la memoria, el procesador y los dispositivos básicos responden.
2. **Inicialización**: configura el hardware mínimo necesario para arrancar.
3. **Búsqueda de un sector de arranque**: lee los primeros 512 bytes del disco (el MBR) y ejecuta el código que encuentra ahí.

Sus límites vienen de la época en que se diseñó, y son la razón de que hoy esté en retirada:

- **Modo real de 16 bits:** el procesador arranca en un modo heredado del 8086, con un megabyte de memoria direccionable. Todo el firmware vive ahí.
- **Sin controladores ni red:** no sabe hablar con hardware moderno más allá de lo que el propio firmware implemente.
- **Interfaz de texto, solo teclado:** la pantalla de configuración es una lista de opciones sin ratón ni gráficos.
- **Arranque en serie:** inicializa los dispositivos uno tras otro, lo que alarga el proceso.
- **Sin verificación de firmas:** ejecuta lo que encuentre en el sector de arranque, sea lo que sea.

Y sobre todo, hereda las limitaciones del **MBR** (_Master Boot Record_), el esquema de particiones que le acompaña. El MBR se introdujo con IBM PC DOS 2.0 en 1983 y describe la tabla de particiones en 512 bytes:

| Límite del MBR         | Valor  | Por qué                                       |
| ---------------------- | ------ | --------------------------------------------- |
| Tamaño máximo de disco | ~2 TiB | Direcciona sectores con 32 bits (2³² × 512 B) |
| Particiones primarias  | 4      | Solo caben cuatro entradas de 16 bytes        |
| Copia de seguridad     | No     | Si el MBR se corrompe, se pierde la tabla     |
| Verificación           | No     | Sin sumas de comprobación de la tabla         |

Para superar las cuatro particiones se inventó el esquema de particiones extendidas y lógicas, que añade una capa de indirección y más fragilidad. Y el límite de 2 TiB se volvió un obstáculo real en cuanto los discos lo superaron.

## UEFI: la modernización

El origen de UEFI está en Intel. En 1998 la compañía puso en marcha el programa **Intel Boot Initiative** para reemplazar el BIOS por algo que funcionara en sus procesadores de 64 bits y que pudiera arrancar sistemas grandes sin las limitaciones del MBR. De ahí salió la especificación **EFI** (_Extensible Firmware Interface_), cuya última versión de Intel fue la **1.10**.

En **julio de 2005** Intel dejó de desarrollarla y la cedió al **Unified EFI Forum**, una organización industrial sin ánimo de lucro formada para gestionarla en conjunto. Con ese traspaso nació el nombre actual: **UEFI** (_Unified Extensible Firmware Interface_). Hoy participan en el foro más de 140 empresas de tecnología.

Las versiones que marcan su historia:

| Versión    | Fecha                                            | Qué añadió                                                 |
| ---------- | ------------------------------------------------ | ---------------------------------------------------------- |
| EFI 1.10   | Última de Intel, cedida al foro en julio de 2005 | Punto de partida de UEFI                                   |
| UEFI 2.0   | 31 de enero de 2006                              | Criptografía y seguridad                                   |
| UEFI 2.1   | 7 de enero de 2007                               | Autenticación de red y arquitectura de interfaz de usuario |
| UEFI 2.3.1 | 6 de abril de 2011                               | **Secure Boot** y soporte de ARM                           |

La implementación de referencia, **TianoCore EDK II**, está escrita en C, y la especificación es independiente de plataforma y de lenguaje.

### Qué resuelve

Frente al BIOS, UEFI cambia el modelo entero:

- **Arranca en 64 bits** y puede acceder a toda la memoria, no a un megabyte.
- **Trae controladores y pila de red** en el propio firmware, así que puede leer discos, usar la red y mostrar gráficos antes de que exista un sistema operativo.
- **Inicializa en paralelo**, lo que acorta el arranque.
- **Interfaz gráfica con ratón**, además de la de texto.
- **Verifica firmas** antes de ejecutar código (Secure Boot, ver más abajo).
- **Guarda las entradas de arranque en NVRAM**, la memoria no volátil de la placa, en lugar de depender de un sector de disco. Se administran con `efibootmgr`.
- **Usa GPT**, el esquema de particiones que Intel desarrolló junto a la especificación EFI.

### GPT o DOS: el esquema de particiones

GPT (_GUID Partition Table_) sustituye al MBR y resuelve sus límites:

| Característica         | MBR                   | GPT                                                      |
| ---------------------- | --------------------- | -------------------------------------------------------- |
| Introducido            | 1983 (IBM PC DOS 2.0) | Junto a la especificación EFI, adoptado por el foro UEFI |
| Tamaño máximo de disco | ~2 TiB                | Del orden de zettabytes                                  |
| Particiones            | 4 primarias           | 128                                                      |
| Direcciones de sector  | 32 bits               | 64 bits                                                  |
| Copia de seguridad     | No                    | Cabecera y tabla duplicadas al final del disco           |
| Verificación           | No                    | Sumas de comprobación (CRC)                              |

Dos detalles que conviene conocer. GPT no elimina el MBR: lo conserva al principio del disco como **MBR protector**, una entrada que declara todo el disco ocupado para que las herramientas antiguas no lo malinterpreten. Y como guarda una copia de la cabecera y de la tabla al final del disco, si la primera se corrompe se puede reconstruir desde la segunda.

Llegado el momento de particionar, las herramientas (`fdisk`, `cfdisk`, `parted`) piden crear una tabla, y en ese punto aparecen los dos nombres: `gpt` y `dos` (así llaman ellas al MBR). La elección la dicta el firmware con el que arranca tu equipo:

| Arranque del equipo             | Tabla | Razón                                |
| ------------------------------- | ----- | ------------------------------------ |
| UEFI (cualquier equipo moderno) | `gpt` | Es obligatorio para iniciar con UEFI |
| BIOS traditional / modo Legacy  | `dos` | Es lo que un BIOS sabe leer          |

En la práctica: **`gpt` es el estándar moderno y la opción correcta en casi todos los casos**, pues la gran mayoría de computadoras fabricadas desde ~2012 inician con UEFI. **Reserva `dos` para equipos muy viejos con BIOS tradicional** (o un modo Legacy en el firmware) o para sistemas operativos antiguos que no entienden GPT, aceptando a cambio los límites de 1983: ~2 TiB, cuatro particiones primarias y una tabla sin respaldo. Existen combinaciones mixtas —GPT con arranque BIOS exige trucos como la partición «BIOS boot» donde GRUB graba su código— pero solo añaden fricción: la regla simple es **UEFI → `gpt`, BIOS → `dos`**, sin mezclas.

### La partición EFI (ESP)

UEFI no ejecuta código desde un sector de arranque, sino desde **archivos** dentro de una partición. Esa partición es la **ESP** (_EFI System Partition_), y sus reglas son las que condicionan el esquema de particiones de toda la guía:

- **Formato FAT.** La especificación admite FAT12, FAT16 y FAT32, pero en la práctica se usa **FAT32**. La razón es que el firmware solo sabe leer FAT de forma nativa: no entiende ext4 ni Btrfs, así que el gestor de arranque, el kernel y el initramfs deben estar en un sistema de archivos que el firmware pueda leer.
- **Tamaño.** 512 MiB a 1 GiB es lo habitual. El tamaño importa porque en la ESP viven el gestor de arranque, el kernel, el initramfs y el microcódigo; si además arrancas snapshots, cada uno copia su kernel y su initramfs (ver [Bootloader](../bootloader/)).
- **Punto de montaje.** Se monta en `/boot` o en `/efi`, según dónde quieras que vivan el kernel y el initramfs. Esta decisión afecta a si el kernel entra o no en los snapshots de Btrfs, como se explica en [Mounts](../mounts/).
- **Tipo de partición.** En GPT se marca con el tipo «EFI System»; es la única partición que el firmware reconoce por su tipo.

En un disco con BIOS y MBR no existe ESP: el equivalente es una partición «BIOS boot» de 2 MB, que solo reserva el espacio donde GRUB graba su segunda etapa.

## Secure Boot

Secure Boot es la característica que la versión 2.3.1 de la especificación añadió en 2011, y consiste en que el firmware **valide cada binario antes de ejecutarlo**. La validación comprueba que el archivo lleve una firma que corresponda a un certificado de confianza, o que su hash SHA-256 figure en una lista de valores permitidos.

Las claves viven en la NVRAM del equipo y son cuatro:

| Variable | Nombre             | Función                                                              |
| -------- | ------------------ | -------------------------------------------------------------------- |
| `PK`     | Platform Key       | Clave raíz de la plataforma; controla quién puede modificar el resto |
| `KEK`    | Key Exchange Key   | Claves autorizadas a actualizar las listas de firmas                 |
| `db`     | Signature Database | Certificados y hashes permitidos                                     |
| `dbx`    | Forbidden Database | Firmas revocadas y prohibidas                                        |

El firmware tiene dos estados. En **Setup Mode** no hay `PK` instalada y cualquiera puede registrar sus propias claves; en **User Mode** hay `PK` y las modificaciones requieren firmarla. De fábrica, la mayoría de equipos vienen en User Mode con las claves de Microsoft preinstaladas, lo que permite arrancar Windows y las distribuciones de Linux que pagan por una firma de _shim_.

La alternativa es generar tus propias claves, registrarlas y firmar tú mismo el gestor de arranque, el kernel y el initramfs. En Arch eso se hace con `sbctl`, y es la razón por la que existe la imagen de kernel unificada (UKI): Secure Boot firma archivos EFI, y un kernel con su initramfs aparte no lo es. El procedimiento completo está en [Kernel e Initramfs](../kernel-initramfs/).

Conviene saber que Secure Boot no protege contra todo. Verifica que el código que se ejecuta esté firmado, pero no comprueba que los parámetros del kernel sean los que tú pusiste, ni que el initramfs sea el tuyo, a menos que uses una UKI firmada. Y en muchos equipos hay que conservar las claves de Microsoft (`sbctl enroll-keys -m`), porque el firmware de la tarjeta gráfica también está firmado con ellas.

## CSM: el modo de compatibilidad

Muchos equipos UEFI incluyen el **CSM** (_Compatibility Support Module_), un componente opcional que emula el BIOS antiguo para poder arrancar sistemas operativos que solo entienden el arranque heredado. En la configuración del firmware aparece como «Legacy boot» o «Legacy BIOS».

El CSM tiene un costo: obliga a usar MBR, mantiene los límites del BIOS y hace que el arranque sea más difícil de diagnosticar, porque no siempre queda claro en qué modo arrancó el equipo. Si no necesitas arrancar un sistema antiguo, **conviene desactivarlo** y usar solo UEFI. Eso simplifica el camino de arranque y evita el problema clásico de instalar un sistema en modo UEFI y descubrir que el firmware estaba arrancando el USB en modo heredado.

## Cómo saber en qué modo arrancaste

Dentro del sistema instalado, tres comprobaciones bastan:

```bash
# 1. ¿Existe el directorio del firmware EFI? Si no existe, arrancaste en BIOS
ls /sys/firmware/efi

# 2. Tamaño de la plataforma: 64 en un sistema UEFI de 64 bits
cat /sys/firmware/efi/fw_platform_size

# 3. Entradas de arranque registradas en la NVRAM
efibootmgr
```

Y para ver el esquema de particiones y la ESP:

```bash
lsblk -f
findmnt /boot
```

Si `efibootmgr` responde «EFI variables are not supported», estás en modo BIOS o en modo heredado del CSM.

| Dato                | Detalle                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| BIOS                | Rutinas de firmware presentes en el ecosistema desde 1975; llegó al IBM PC en 1981                                                 |
| MBR                 | 1983 (IBM PC DOS 2.0); 512 bytes, 4 particiones primarias, límite de ~2 TiB                                                        |
| UEFI                | Programa Intel Boot Initiative (1998); EFI 1.10 cedida al Unified EFI Forum en julio de 2005                                       |
| Versiones clave     | UEFI 2.0 (31 de enero de 2006), 2.1 (7 de enero de 2007), 2.3.1 (6 de abril de 2011)                                               |
| Implementación ref. | TianoCore EDK II (en C)                                                                                                            |
| Especificación      | <https://uefi.org/specifications>                                                                                                  |
| Documentación       | <https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface> y <https://wiki.archlinux.org/title/EFI_system_partition> |
| Herramientas        | `efibootmgr`, `efivarfs` (montado en `/sys/firmware/efi/efivars`)                                                                  |
| Secure Boot         | `sbctl` <https://github.com/Foxboron/sbctl>                                                                                        |

**Comprobación rápida.** Desde el USB live (ver [Install Media](../install-media/)), antes de particionar nada:

```bash
# Debe imprimir 64 si arrancaste en UEFI; si da error, estás en BIOS
cat /sys/firmware/efi/fw_platform_size

# Lista los discos y sus particiones
lsblk -f

# Si arrancaste en UEFI, muestra y permite editar las entradas de arranque
efibootmgr -v
```
