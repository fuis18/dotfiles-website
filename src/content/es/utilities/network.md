---
title: "Network"
description: "Red: capas de gestión, iwd, NetworkManager, dhcpcd y resolución DNS."
category: utilities
tags: ["iwd", "dhcpcd", "impala", "knot-resolver", "nextdns"]
---

Conectar un equipo a Internet parece una acción única, pero en realidad son cuatro eslabones distintos: unirte a la red física (Wi‑Fi o cable), conseguir una dirección IP, traducir nombres a direcciones y decidir quién ve tus consultas DNS. Cada pieza de esta página resuelve uno de esos eslabones, y la elección correcta depende de qué tan simple quieras el sistema.

| Capa                            | Tecnología                      |
| ------------------------------- | ------------------------------- |
| Herramientas de usuario         | iwctl / impala / nmtui / nmcli  |
| Gestor de conexiones (política) | NetworkManager / ConnMan        |
| Demonio de enlace físico        | iwd (Wi‑Fi) / kernel (ethernet) |
| Cliente DHCP                    | dhcpcd / cliente integrado      |
| Kernel                          | nl80211, drivers                |

## iwd: el daemon de Wi‑Fi

Durante años el protocolo Wi‑Fi en Linux lo manejó `wpa_supplicant`, un demonio que intenta abstraer todos los sistemas operativos y todas las extensiones inalámbricas, incluidas muchas que nadie usa. El resultado es grande, difícil de configurar y poco comunicativo: no recuerda nada entre conexiones, expone muy poca información y se ofrece al espacio de usuario de varias formas distintas. Ante ello, un equipo de Intel liderado por Marcel Holtmann (mantenedor de BlueZ) y Denis Kenzior desarrolló **iwd** (_iNet Wireless Daemon_) para reemplazarlo. Declaró estables sus interfaces D-Bus con la versión 1.0, en el Open Source Summit Europe de 2018.

Su diseño busca el mínimo de recursos:

- **Sin dependencias externas:** solo necesita el kernel y la biblioteca C, y aprovecha lo que el kernel ya ofrece (nl80211, criptografía).
- **Recuerda las redes:** guarda perfiles de redes conocidas y los reutiliza, algo que `wpa_supplicant` no hace por sí solo.
- **Cliente de red incluido:** puede obtener su dirección IP y configurar DNS por sí mismo, sin otro programa, si se activa la opción correspondiente.
- **Herramienta de línea de comandos propia:** `iwctl`, la misma que usaste en la instalación (ver [Install Media](./install-media.md)).

iwd resuelve el Wi‑Fi, pero solo el Wi‑Fi. Si mañana necesitas VPN, conexiones móviles o puentes entre interfaces, necesitarás algo más arriba.

| Dato          | Detalle                                                                |
| ------------- | ---------------------------------------------------------------------- |
| Origen        | Intel (desarrollo desde 2013; versión 1.0 en 2018)                     |
| Autores       | Marcel Holtmann, Denis Kenzior, Andrew Zaborowski y otros              |
| Cobertura     | Wi‑Fi (y 802.1X en cable con su demonio auxiliar)                      |
| Dependencias  | Solo kernel y libc                                                     |
| Documentación | <https://iwd.wiki.kernel.org> y <https://wiki.archlinux.org/title/Iwd> |
| Código        | <https://git.kernel.org/pub/scm/network/wireless/iwd.git>              |

**Instalación mínima (Wi‑Fi standalone).** Esta es la pila más ligera: solo iwd haciendo todo, sin gestores encima. Se usa en servidores, máquinas mínimas o cuando sabes que tu red no va a cambiar.

```bash
sudo pacman -S iwd
sudo systemctl enable --now iwd
```

Para que iwd también gestione IP y DNS, crea `/etc/iwd/main.conf`:

```ini
[General]
EnableNetworkConfiguration=true

[Network]
NameResolvingService=resolvconf
```

Uso diario con `iwctl`:

```bash
iwctl station wlan0 scan
iwctl station wlan0 get-networks
iwctl station wlan0 connect "Tu_wifi"
iwctl known-networks list
```

**Impala: TUI moderna para iwd.** Si `iwctl` te resulta árido, **Impala** es una terminal UI escrita en Rust que habla directamente con iwd:

- Interfaz visual amigable para escanear, conectar y gestionar redes conocidas.
- No es un daemon: requiere que iwd esté corriendo.
- **Conflicta con NetworkManager:** no uses ambos a la vez para la misma interfaz.

```bash
# En Arch
sudo pacman -S impala

# Uso
impala
```

Ver la [documentación oficial](https://github.com/pythops/impala) para detalles y compatibilidad.

## NetworkManager: la capa superior

Una laptop real salta entre Wi‑Fi, cable, VPN y a veces módem móvil. Para eso existe **NetworkManager**, desarrollado por Red Hat desde 2004: un gestor que unifica todos esos tipos de conexión con herramientas de terminal (`nmcli`, `nmtui`) y applets gráficos. NetworkManager puede usar iwd como motor de Wi‑Fi en lugar de `wpa_supplicant`, con lo que se obtiene lo mejor de ambos: la simplicidad de iwd abajo y la versatilidad de NM arriba.

NetworkManager agrega cuatro cosas que iwd por sí solo no tiene:

1. **Abstracción total**: unifica Wi‑Fi, Ethernet, VPN, módems móviles, puentes y VLANs en una misma API (D-Bus).
2. **Perfiles portátiles**: memoriza múltiples redes con políticas distintas (autoconexión, prioridad, reglas de DNS).
3. **Activación automática de servicios**: integra con `polkit` para permisos y lanza servicios relacionados al conectar (por ejemplo, montar SMB).
4. **Interfaz gráfica consistente**: el mismo applet funciona en GNOME, KDE, XFCE, etc., sin adaptaciones.

La regla de oro: **usa iwd como backend de NetworkManager, no como servicio independiente**. Si activas ambos gestionando la misma interfaz, se pisarán.

| Dato          | NetworkManager                                                   |
| ------------- | ---------------------------------------------------------------- |
| Origen        | Red Hat (desde 2004)                                             |
| Autores       | Equipo de Red Hat y comunidad (Dan Williams como autor original) |
| Cobertura     | Wi‑Fi, Ethernet, VPN, módem móvil, puentes, VLANs                |
| Dependencias  | Muchísimas (D-Bus, polkit, bibliotecas de red)                   |
| Documentación | <https://networkmanager.dev>                                     |
| Código        | <https://gitlab.freedesktop.org/NetworkManager/NetworkManager>   |

**Instalación con iwd como motor.** En este caso **no** actives `EnableNetworkConfiguration` en iwd: NetworkManager tomará el control de IP y DNS. Configura el backend:

```ini
# /etc/NetworkManager/conf.d/wifi_backend.conf
[device]
wifi.backend=iwd
```

```bash
sudo pacman -S networkmanager iwd
sudo systemctl enable --now NetworkManager
# No actives iwd manualmente: NetworkManager lo levantará si lo necesita
nmtui
```

En Artix y Obarun los servicios se instalan con el paquete de servicio de tu init (`iwd-<init>`, `networkmanager-<init>`; ver [PID](./pid.md)).

## dhcpcd: cliente DHCP independiente

Con el enlace Wi‑Fi establecido todavía falta una dirección IP, que se obtiene con DHCP. iwd trae su propio cliente, pero está pensado solo para Wi‑Fi. Para un cable Ethernet, o para quien prefiere que otro programa se ocupe, hace falta un cliente DHCP independiente. El histórico era `dhclient` de ISC, flexible pero pesado, y hoy descontinuado por sus autores.

**dhcpcd** nació en Phystech, escrito por Yoichi Hariguchi y Sergei Viznyuk. Roy Marples asumió su mantenimiento en 2004, en Gentoo, y lo rehízo con una base de código mucho más pequeña, que en Linux usa netlink; la versión 4 (2008) llegó a incorporarse a la base del sistema de NetBSD. Hoy es un cliente DHCP completo que además implementa DHCPv6, BOOTP, solicitudes de router IPv6 y extensiones de privacidad, y se integra con `openresolv` (del mismo autor) para actualizar `/etc/resolv.conf`.

Como regla, **hay que elegir un solo responsable de la dirección IP por interfaz**: el cliente de iwd, dhcpcd o NetworkManager. Si usas dhcpcd con iwd, deja `EnableNetworkConfiguration` desactivado en iwd.

| Dato          | Detalle                                                                                |
| ------------- | -------------------------------------------------------------------------------------- |
| Origen        | Phystech (Yoichi Hariguchi y Sergei Viznyuk); mantenido por Roy Marples desde 2004     |
| Hitos         | dhcpcd 4 (2008) en la base de NetBSD; DHCPv6 en 2012                                   |
| Licencia      | BSD-2-Clause                                                                           |
| Documentación | <https://roy.marples.name/projects/dhcpcd> y <https://wiki.archlinux.org/title/Dhcpcd> |
| Código        | <https://github.com/NetworkConfiguration/dhcpcd>                                       |

**Instalación.**

```bash
sudo pacman -S dhcpcd

# Para todas las interfaces
sudo systemctl enable --now dhcpcd

# O solo para una interfaz concreta (cable)
sudo systemctl enable --now dhcpcd@enp3s0.service
```

**Combinación iwd + dhcpcd.** Si no quieres NetworkManager pero sí separar enlace de DHCP:

```ini
# /etc/iwd/main.conf — iwd solo maneja el enlace Wi‑Fi
[General]
EnableNetworkConfiguration=false
```

```bash
sudo systemctl enable --now iwd dhcpcd
```

## Knot Resolver

Con una dirección IP ya se puede navegar, pero solo por números. Traducir nombres a direcciones lo hace DNS, y por defecto ese trabajo lo delegas en el servidor DNS de tu proveedor o de tu router: sin caché que controles, sin validar que las respuestas sean auténticas, y sabiendo ellos todo lo que consultas. La solución es un resolutor propio en tu equipo: un servicio que pregunta él mismo a los servidores autoritativos, guarda las respuestas en caché y las valida con DNSSEC.

Knot Resolver, desarrollado por CZ.NIC (el registro de dominios `.cz`), es un resolutor completo con caché. Desde la versión 6 incluye un _manager_ escrito en Python que simplifica su uso con configuración declarativa en YAML y una API HTTP para cambios en caliente. Sus puntos fuertes:

- **Caché persistente** compartida entre procesos de trabajo, que no se pierde al reiniciar, con caché agresiva de datos validados con DNSSEC (RFC 8198).
- **Privacidad y validación incluidas:** soporte de DNS cifrado (TLS y HTTPS) y validación DNSSEC.
- **Funciona sin configurar:** arranca como servidor local sin cambios, y su documentación describe incluso el uso sin `systemd` y sin el _manager_, lo que lo hace viable en Artix y Obarun.

Para que el sistema lo use hace falta apuntar `/etc/resolv.conf` a él, y eso lo hace `openresolv`: un administrador de `resolv.conf` que, si le indicas servidores fijos, los pone en lugar de los que entrega el DHCP.

| Dato          | Detalle                                                                                 |
| ------------- | --------------------------------------------------------------------------------------- |
| Origen        | CZ.NIC Labs; versión 6 con _manager_ y configuración en YAML (6.2.0 en febrero de 2026) |
| Licencia      | GPL-3.0-or-later                                                                        |
| Documentación | <https://www.knot-resolver.cz/documentation/latest/>                                    |
| Código        | <https://gitlab.nic.cz/knot/knot-resolver> y <https://github.com/CZ-NIC/knot-resolver>  |
| openresolv    | <https://wiki.archlinux.org/title/Openresolv>                                           |

**Instalación.** Si ya hiciste el `pacstrap` de la instalación, solo falta habilitar el servicio y apuntar `resolv.conf` al resolutor local con `openresolv`:

```bash
sudo pacman -S knot-resolver openresolv
sudo systemctl enable --now knot-resolver
```

```conf
# /etc/resolvconf.conf
name_servers=127.0.0.1
```

```bash
sudo resolvconf -u
cat /etc/resolv.conf
kdig @127.0.0.1 archlinux.org +dnssec
```

Un ajuste habitual es el tamaño de la caché en `/etc/knot-resolver/config.yaml`:

```yaml
cache:
  size-max: 256M
```

## NextDNS

Un resolutor propio tiene un límite: para responder, tu Knot Resolver consulta a los servidores raíz y autoritativos en texto plano, así que tu proveedor de internet y cualquier red por la que pases siguen viendo cada nombre que consultas. Y nada bloquea anuncios, rastreadores ni dominios maliciosos.

NextDNS resuelve ambas cosas. Fue fundado en mayo de 2019 en Delaware por Romain Cointepas y Olivier Poitrey, que trabajaron juntos en Dailymotion, y ofrece DNS cifrado (DNS sobre TLS y sobre HTTPS) con filtrado configurable por perfil: listas de bloqueo de anuncios y rastreadores, protección contra malware y control parental, con registros y analíticas que tú decides si conservar. Cada perfil tiene un identificador de configuración, y el endpoint de DNS sobre TLS lleva ese identificador en el nombre (`ID.dns.nextdns.io`).

La forma de unirlo con la pieza anterior es dejar que Knot Resolver reenvíe sus consultas a NextDNS por TLS. Así conservas la caché local y la validación DNSSEC, y añades cifrado y filtrado. Conviene saber que esto traslada la confianza: tu proveedor de internet deja de ver tus consultas, pero NextDNS pasa a verlas. Si prefieres que nadie las vea, el resolutor recursivo de la sección anterior sin reenvío es la alternativa, a costa de no tener cifrado ni filtrado.

| Dato               | Detalle                                                          |
| ------------------ | ---------------------------------------------------------------- |
| Fundación          | Mayo de 2019, Delaware (NextDNS Inc.)                            |
| Fundadores         | Romain Cointepas y Olivier Poitrey (exejecutivos de Dailymotion) |
| Protocolos         | DNS sobre TLS (DoT) y sobre HTTPS (DoH)                          |
| Documentación      | <https://help.nextdns.io>                                        |
| Sitio y panel      | <https://nextdns.io> y <https://my.nextdns.io>                   |
| Cliente (opcional) | <https://github.com/nextdns/nextdns> (licencia MIT)              |

**Instalación.** Crea un perfil en <https://my.nextdns.io>, copia tu identificador (`abc123` en el ejemplo) y añade el reenvío cifrado a `/etc/knot-resolver/config.yaml`. Las direcciones y el nombre exacto están en la pestaña _Setup_ de tu panel; confírmalos allí antes de aplicarlos:

```yaml
forward:
  - subtree: .
    servers:
      - address: [45.90.28.0, "2a07:a8c0::"]
        transport: tls
        hostname: abc123.dns1.nextdns.io
      - address: 45.90.30.0
        transport: tls
        hostname: abc123.dns2.nextdns.io
```

```bash
sudo systemctl restart knot-resolver
kdig @127.0.0.1 archlinux.org
```

Para comprobar que tus consultas ya pasan por NextDNS, abre <https://test.nextdns.io> en el navegador.

## Resumen de combinaciones posibles

| Caso de uso              | Pila recomendada                                     | Notas                                                        |
| ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| Servidor / máquina fija  | `iwd` + `dhcpcd`                                     | iwd solo maneja el enlace; dhcpcd la IP                      |
| Minimalismo extremo      | `iwd` standalone (`EnableNetworkConfiguration=true`) | iwd hace todo: enlace + DHCP + DNS                           |
| Laptop doméstica         | `iwd` + `NetworkManager`                             | NM toma el control; iwd es solo backend Wi‑Fi                |
| Terminal UI amigable     | `impala` + `iwd`                                     | No usar NetworkManager; Impala es frontend sobre iwd         |
| Embedded / IoT           | `ConnMan` o `systemd-networkd`                       | Menos dependencias que NM, ideales para sistemas incrustados |
| Entorno gráfico completo | `NetworkManager` + applet DE                         | Lo estándar en escritorios: KDE Plasma, GNOME, XFCE          |

Reglas finales:

- **Nunca actives dos gestores de conexión** (iwd, NetworkManager, dhcpcd, ConnMan) sobre la misma interfaz.
- **Impala necesita iwd**: no es una alternativa, es un frontend.
- **NetworkManager + iwd**: configura el backend en NM, no actives iwd como servicio independiente.
- **dhcpcd y el cliente de iwd**: uno u otro por interfaz, no ambos.
