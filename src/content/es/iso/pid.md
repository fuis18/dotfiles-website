---
title: "PID"
description: "Gestión de procesos e init: Systemd, S6 y 66."
category: iso
tags: ["systemd", "s6", "66", "init"]
---

El PID 1 es el primer proceso que arranca el kernel y el padre de todos los demás: levanta los servicios, los reinicia si caen y apaga el sistema en orden. Es la pieza que más condiciona el resto de la guía, porque de él dependen el arranque, los servicios de usuario, los registros y hasta la sesión de escritorio.

## Systemd

En los inicios de Linux el init era `SysV`: una colección de scripts de shell ejecutados uno tras otro. Arrancar era lento porque todo era secuencial, no sabía si un servicio seguía vivo una vez lanzado, dependía de archivos PID frágiles para rastrearlo y las dependencias entre servicios se resolvían con números de orden. Ante ello, Lennart Poettering y Kay Sievers (entonces en Red Hat) propusieron en 2010, con la entrada «Rethinking PID 1», un init que arrancara en paralelo, rastreara cada servicio con cgroups y describiera todo en archivos declarativos.

- Arranque en paralelo guiado por un grafo de dependencias, con activación por socket y bajo demanda.
- Unit files declarativos (`.service`, `.mount`, `.timer`, `.socket`) en lugar de scripts imperativos.
- Rastreo de procesos con cgroups: al detener un servicio se detienen también todos sus hijos.
- Un solo conjunto de herramientas y registros (`systemctl`, `journalctl`) para servicios, sesiones, montajes y temporizadores.

Es el init por defecto en Arch y CachyOS (ver [Distro Base](../distro-base/)) y el que asumen la mayoría de paquetes, incluidos muchos del AUR y entornos de escritorio completos. Eso lo convierte en la opción de menor fricción.

| Dato                | Detalle                                                                         |
| ------------------- | ------------------------------------------------------------------------------- |
| Primera publicación | Abril de 2010 (anuncio), versión 1 en mayo de 2010                              |
| Autores             | Lennart Poettering y Kay Sievers (Red Hat), con colaboración de la comunidad    |
| Hitos de adopción   | Fedora 15 lo activó por defecto en mayo de 2011; Arch Linux, en octubre de 2012 |
| Licencia            | LGPL-2.1+                                                                       |
| Documentación       | <https://systemd.io> y <https://wiki.archlinux.org/title/Systemd>               |
| Código              | <https://github.com/systemd/systemd>                                            |
| Texto fundacional   | <https://0pointer.net/blog/projects/systemd.html>                               |

**Instalación.** Ya viene incluido en Arch y CachyOS. Si necesitas instalarlo o actualizarlo:

```bash
sudo pacman -S systemd
```

Ejemplo de un servicio declarativo (`/etc/systemd/system/mi-app.service`) y su activación:

```ini
[Unit]
Description=Mi aplicación
After=network-online.target

[Service]
ExecStart=/usr/bin/mi-app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now mi-app.service
```

Resolvió los problemas de `SysV`, pero a cambio creció mucho. Además de ser PID 1 absorbió componentes como `logind`, `udev`, `journald`, `resolved` y `networkd`, lo que se critica como acoplamiento y mayor superficie de ataque, y limita su uso fuera de Linux. De ahí nacieron Artix y Obarun, y de ahí parte la siguiente sección.

## S6

`systemd` resolvió los problemas de `SysV`, pero lo hizo creciendo: hoy un solo proyecto es el init, el gestor de sesiones, el de logs, el de red y el de nombres. Un PID 1 grande es difícil de auditar, y todo lo que lo rodea se vuelve dependiente de él. Ante ello, Laurent Bercot (skarnet.org) desarrolló `s6`: una suite de supervisión pequeña y segura que hace una sola cosa bien, vigilar procesos, y que se compone con otras herramientas siguiendo la filosofía Unix.

- Cada servicio es un directorio con un script `run`; `s6-supervise` lo vigila y lo reinicia si muere, sin archivos PID.
- Herramientas pequeñas y separadas: `s6-svc` (controlar), `s6-svstat` (consultar), `s6-log` (registros con rotación).
- `s6-rc` agrega la gestión de dependencias y de servicios de un solo disparo (_oneshot_), y `s6-linux-init` permite usar `s6` como init completo.
- Escrito en C con dependencias mínimas (`skalibs`, `execline`), con licencia ISC.

Es la base técnica de Artix (como una de sus opciones de init) y de Obarun. En Artix, los servicios se instalan como paquetes `<servicio>-s6`, y `elogind` reemplaza lo que antes aportaba `logind`.

| Dato                | Detalle                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Primera publicación | Alrededor de 2011; `s6-rc` se anunció en septiembre de 2015                                  |
| Autor               | Laurent Bercot (skarnet.org)                                                                 |
| Licencia            | ISC                                                                                          |
| Documentación       | <https://skarnet.org/software/s6/> y <https://skarnet.org/software/s6-rc/>                   |
| Código              | <https://github.com/skarnet/s6> (espejo; repositorio original en `git://git.skarnet.org/s6`) |
| Comunidad           | Lista de correo `supervision` en <https://skarnet.org/lists/supervision/>                    |

En Artix, instala la base de `s6` al crear el sistema (ver [Distro Base](../distro-base/)):

```bash
basestrap /mnt base base-devel s6-base elogind-s6 linux-zen linux-zen-firmware
```

En otras distribuciones se compila desde fuente (requiere `skalibs` y `execline`; revisa el archivo `INSTALL` de cada paquete antes de empezar):

```bash
git clone https://github.com/skarnet/s6
cd s6 && ./configure && make && sudo make install
```

Ejemplo de un servicio (`/etc/s6/sv/sshd/run`, ejecutable):

```sh
#!/bin/sh
exec /usr/bin/sshd -D -e
```

```bash
s6-svstat /run/service/sshd   # consultar
s6-svc -r /run/service/sshd   # reiniciar
```

`s6` es una caja de herramientas de bajo nivel, no un producto terminado: los servicios se escriben a mano, la documentación es técnica y densa, y los paquetes del AUR que traen solo unidades de `systemd` no funcionan sin adaptación.

## 66

`s6` es potente, pero escribir y mantener directorios de servicio a mano no es una experiencia cómoda para una distribución de uso diario. Ante ello, Eric Vidal creó `66` en el proyecto Obarun: un gestor de servicios construido alrededor de `s6` que aporta archivos de servicio declarativos (llamados _frontends_), árboles de arranque, servicios por usuario y comandos de alto nivel como `66 enable`.

- Archivos declarativos de servicio con secciones `[main]`, `[start]` y `[stop]`, mucho más legibles que scripts sueltos.
- Gestión de dependencias y de árboles de servicios; desde la serie 0.8 una dependencia puede apuntar a cualquier servicio, sin importar el árbol.
- Servicios de sistema y de usuario con la misma herramienta.
- Funciona sobre `s6` y no está atado a Obarun: puede usarse en otros sistemas Unix.

Es el punto donde se unen la supervisión robusta de `s6` y la comodidad de un frontend declarativo, y por eso cierra el hilo que empezó con `SysV`. En Obarun, los servicios vienen como paquetes `<servicio>-66serv`.

- Comunidad pequeña y un único mantenedor principal, lo que implica riesgo a largo plazo.
- La serie 0.8 (2024) exigió una migración manual del sistema (eliminar `/etc/66`, `/var/lib/66` y `~/.66`), así que conviene leer las notas de cada versión antes de actualizar.
- Alternativa oficial en camino: skarnet publicó `s6-frontend` 0.1.0.0 en julio de 2026, un frontend propio para `s6-rc`. Vale la pena seguirlo de cerca, porque puede competir con `66` como capa de comodidad sobre `s6`.

| Dato                | Detalle                                                                               |
| ------------------- | ------------------------------------------------------------------------------------- |
| Primera publicación | Presentado en la lista `supervision` de skarnet en abril de 2019; versión 0.8 en 2024 |
| Autor               | Eric Vidal (proyecto Obarun)                                                          |
| Licencia            | ISC                                                                                   |
| Documentación       | <https://wiki.obarun.org> y <https://web.obarun.org/software>                         |
| Código              | <https://git.obarun.org/Obarun/66>                                                    |
| Noticias            | <https://news.obarun.org>                                                             |

Lo más directo es Obarun, que ya lo incluye: descarga el ISO desde <https://web.obarun.org> (ver [Distro Base](../distro-base/)). En un sistema Obarun existente, las herramientas se instalan con `pacman`:

```bash
sudo pacman -S 66 66-tools oblibs
```

Ejemplo de un servicio declarativo, tomado de las convenciones de Obarun (`/etc/66/service/bluetoothd`):

```ini
[main]
@type = classic
@description = "bluetoothd daemon"
@version = 0.0.1
@user = ( root )

[start]
@execute = ( /usr/lib/bluetooth/bluetoothd )
```

```bash
sudo 66 enable bluetoothd
sudo 66 start bluetoothd
```
