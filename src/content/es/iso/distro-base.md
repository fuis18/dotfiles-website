---
title: "Distro Base"
description: "Elección de la base del sistema: CachyOS, ArchLinux, Artix y Obarun."
category: iso
tags: ["cachyos", "archlinux", "artix", "obarun"]
---

Considero que ofrecer un sistema que funcione «out of the box» (listo para usar) es un gran paso para que más personas entren a Linux, pero no debería ser nuestro eslogan. Pero como personas distintas tenemos preferencias, pero como humanidad y personas naturales también merecemos que nuestra herramienta de trabajo mejore, para ello debemos de evolucionar nuestro sistema, por ende entender como mejorarlo.

## ArchLinux

En los inicios de Linux, las distribuciones ya venían preconfiguradas: unos pocos decidían qué se instalaba, qué servicios corrían y cuándo se actualizaba, y esas decisiones se acumulaban como capas difíciles de entender. Con un sistema que no sabes qué contiene, depurar y optimizar se vuelve adivinar. Ante ello, **ArchLinux** nació por la necesidad de un sistema simple y transparente, sin decisiones tomadas por ti: instalas lo mínimo y construyes el resto.

**Cómo lo resuelve.**

- Filosofía KISS: instalas solo `base` y construyes lo demás pieza por pieza, así que sabes qué hay en tu sistema.
- Rolling release: un único flujo continuo de actualizaciones, sin saltos de versión mayor.
- Paquetes lo más cercanos posible al código original (_upstream_), con parches mínimos.
- ArchWiki, probablemente la mejor documentación de Linux que existe, útil incluso si usas otra distro.
- AUR para todo lo que no está en los repositorios oficiales.

Rolling release implica que una actualización puede romper algo; por eso la sección de [Mounts](./mounts.md) recomienda Btrfs con snapshots para poder volver atrás.

| Dato                | Detalle                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| Primera publicación | 2002                                                                                 |
| Autores             | Judd Vinet (creador); Aaron Griffin lideró el proyecto desde el 1 de octubre de 2007 |
| Documentación       | <https://wiki.archlinux.org/title/Installation_guide>                                |
| Código              | <https://gitlab.archlinux.org/archlinux>                                             |
| Sitio               | <https://archlinux.org>                                                              |

**Instalación.**

Guiada, desde el ISO live:

```bash
archinstall
```

Manual (instala la base mínima desde el chroot del ISO):

```bash
pacstrap -K /mnt base linux-zen linux-zen-firmware
```

CachyOS, Artix y Obarun heredan de aquí `pacman`, el AUR y la wiki. Entender Arch significa entender las cuatro bases, y sus límites (rendimiento genérico, `systemd` obligatorio) explican por qué existen las otras tres.

## CachyOS

Arch devolvió el control al usuario, pero lo hizo con binarios genéricos: casi toda distro compila sus paquetes para el mínimo común denominador de x86-64, así que las instrucciones modernas de tu CPU (AVX2, AVX-512) quedan sin usar, y el kernel genérico prioriza la compatibilidad sobre la respuesta de escritorio. **CachyOS** llevó muy bien la optimización (binarios para tu CPU, kernel con planificadores propios), pero siendo amigable con el usuario promedio gracias a su instalador gráfico.

**Cómo lo resuelve.**

- Repositorios optimizados por nivel de microarquitectura (`x86-64-v3`, `x86-64-v4` y variantes para Zen 4/5) con instalación que detecta tu CPU.
- Kernel propio con parches de planificador (BORE por defecto, variante EEVDF) y soporte para `sched_ext` (`scx`), más variantes como `linux-cachyos-deckify` para handhelds.
- Compilación con PGO/LTO en paquetes de alto impacto (por ejemplo Python, según su release de junio 2026).
- Instalador gráfico con elección de bootloader (`systemd-boot`, GRUB, rEFInd, Limine) y de escritorio, incluida una opción Hyprland.

Sigue siendo Arch por debajo (mismo `pacman`, mismo AUR), de modo que no pierdes el ecosistema. Pero agregando sus repositorios según tu hardware y su kernel.

| Dato                | Detalle                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| Primera publicación | 2021 (releases estables desde finales de 2022)                          |
| Autores             | Peter Jung (`ptr1337`) y Vladislav Nepogodin (`vnepogodin`), fundadores |
| Licencia            | Software libre (GPL y otras)                                            |
| Documentación       | <https://wiki.cachyos.org>                                              |
| GitHub              | <https://github.com/CachyOS>                                            |
| Sitio               | <https://cachyos.org>                                                   |

**Instalación.**

Desde ISO: descarga la imagen desde <https://cachyos.org/download>, arranca el USB live y ejecuta el instalador gráfico.

Sobre un Arch ya instalado (solo repositorios optimizados):

```bash
curl https://mirror.cachyos.org/cachyos-repo.tar.xz -o cachyos-repo.tar.xz
tar xvf cachyos-repo.tar.xz && cd cachyos-repo
sudo ./cachyos-repo.sh
```

## Artix

CachyOS optimizó el sistema, pero heredó de Arch una decisión que no se puede cambiar: `systemd` es el único init posible, y otros componentes (por ejemplo, entornos de escritorio completos) dependen de él cada vez más. Con el nacimiento y la adopción de `systemd` (ver [PID](./pid.md)), Arch dejó de ofrecer alternativas de init, y si prefieres uno más pequeño o con otro modelo de servicios, no puedes tenerlo sin pelear contra el sistema. Artix nació en 2017 para devolver esa libertad.

**Cómo lo resuelve.** Artix mantiene la base de Arch (`pacman`, rolling release, filosofía KISS) pero sin `systemd` y te deja elegir entre **OpenRC**, **runit**, **s6** y **dinit**. Tiene sus propios repositorios, con paquetes adaptados a cada init, y puede usar los repositorios de Arch mediante el paquete de compatibilidad (`artix-archlinux-support`). Para lo que antes aportaba `systemd` (sesiones, seat management) se usa `elogind`.

Es la opción pragmática: conservas casi todo el ecosistema Arch y recuperas la libertad de init. El inconveniente es que algunos paquetes asumen `systemd` y requieren alternativas, algo que se trata en [PID](./pid.md).

| Dato              | Detalle                                                                        |
| ----------------- | ------------------------------------------------------------------------------ |
| Creación          | 2017, fusión de los proyectos Arch OpenRC y Manjaro OpenRC (iniciados en 2012) |
| Autores           | Equipo de Artix (core team y desarrolladores)                                  |
| Inits disponibles | OpenRC, runit, s6, dinit                                                       |
| Documentación     | <https://wiki.artixlinux.org>                                                  |
| Código            | <https://gitea.artixlinux.org/artix>                                           |
| Sitio             | <https://artixlinux.org>                                                       |

**Instalación.** Arranca el ISO de tu init elegido y, en lugar de `pacstrap`, usa `basestrap`:

```bash
# Ejemplo con s6
basestrap /mnt base base-devel openrc elogind-openrc linux-zen linux-zen-firmware
fstabgen -U /mnt >> /mnt/etc/fstab
artix-chroot /mnt
```

## Obarun

Artix devolvió la libertad de elegir init, pero sustituir `systemd` por otro no basta si el nuevo sigue siendo un conjunto de scripts difíciles de supervisar o componer: los init tradicionales (SysV, y en parte OpenRC) arrancan servicios pero no los vigilan de forma fiable, y gestionar dependencias entre ellos suele ser frágil. Por eso **Obarun** se centró en `s6`, que ofrece una supervisión de procesos pequeña y fiable, y creó `66` porque `s6` y `s6-rc` son herramientas de bajo nivel que necesitaban una capa de servicios declarativos encima.

Obarun está basada en Arch y reemplaza `systemd` por `s6` (la suite de supervisión de Skarnet) más `66`, un gestor de servicios propio construido sobre `s6`/`s6-rc`. Los servicios se describen en archivos declarativos, el árbol de dependencias lo resuelve la herramienta y cada proceso queda supervisado. `66` es obra de Obarun y funciona también fuera de ella, en otros sistemas Unix.

Es la base más cercana al ideal de transparencia que persigue la documentación, pero la menos convencional: su propio equipo la describe como no pensada para principiantes y su comunidad es más pequeña. Cierra el hilo hacia [PID](./pid.md), donde `s6` y `66` se explican en detalle.

| Dato          | Detalle                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| Origen        | Proyecto basado en Arch, activo al menos desde 2015; `s6`/`66` como base desde ~2017   |
| Autor         | Eric Vidal                                                                             |
| Nombre        | De _OpenBox Arch RUNit_, aunque hoy usa `s6` en lugar de `runit`                       |
| Documentación | <https://wiki.obarun.org>                                                              |
| Código        | <https://git.obarun.org/Obarun> (herramienta `66`: <https://git.obarun.org/Obarun/66>) |
| Sitio         | <https://web.obarun.org>                                                               |

**Instalación.** Descarga el ISO desde <https://web.obarun.org>, arranca el USB live y sigue el instalador incluido. Tras el primer arranque actualiza el sistema:

```bash
pacman -Syu
```

## La mejor distribución

Pero ninguno unió todas las piezas. CachyOS optimiza, aunque mantiene `systemd`. Artix y Obarun liberan el init, pero sin ese trabajo de optimización, y solo Obarun apuesta por servicios declarativos con `s6` y `66`. Ninguna reúne en un solo sistema rendimiento, libertad de init y transparencia, y de ahí parte esta documentación.
