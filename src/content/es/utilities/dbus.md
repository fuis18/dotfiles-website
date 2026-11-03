---
title: "dbus"
description: "Bus de mensajes del sistema: dbus-daemon vs dbus-broker, y Varlink."
category: utilities
tags: ["dbus", "varlink", "dbus-broker"]
---

Casi todo lo que ocurre en un escritorio Linux moderno es una conversación entre programas: el gestor de red avisa al panel de que cambió el Wi-Fi, un portal le pide a la compositora una captura de pantalla, el greeter consulta qué sesiones existen. Esas conversaciones necesitan un canal común, y ese canal es el bus de mensajes. Es una pieza invisible, pero casi todo lo que sigue en esta sección ([Network](./network.md), [Greeter](./greeter.md), [XDG Desktop Portals](./portals.md)) depende de ella, por eso se explica primero.

Ese canal ha sido D-Bus durante casi dos décadas, y en el escritorio lo sigue siendo. Pero desde 2017 existe un segundo protocolo, Varlink, que `systemd` usa cada vez más para sus propias APIs. La sección va entonces en dos partes: primero D-Bus y sus dos implementaciones, que es lo que el escritorio habla de verdad; después Varlink, que es la apuesta de `systemd` para lo que viene.

## D-Bus: dbus-daemon vs dbus-broker

D-Bus tiene dos implementaciones. `dbus-daemon` es la de referencia: se inició en 2002 dentro de freedesktop.org (con Havoc Pennington, de Red Hat, como autor principal), alcanzó la versión 1.0 en 2006 y es la que traían por defecto casi todas las distribuciones. Pero es la implementación de un diseño antiguo, y en un sistema moderno sus límites se notan: puede descartar mensajes sin avisar bajo ciertas condiciones, y varias de sus búsquedas internas crecen linealmente con la cantidad de clientes.

`dbus-broker` es una reimplementación compatible con la especificación D-Bus, escrita por David Rheinsberg (antes Herrmann) y Tom Gundersen, desarrolladores de `systemd`, con sus primeras versiones a finales de 2017. Se escribió exclusivamente para Linux y aprovecha sus características modernas, con tres objetivos: fiabilidad, escalabilidad y seguridad. Concretamente:

- **No pierde mensajes en silencio:** su arquitectura permite garantizar que ningún mensaje se descarta de forma inesperada.
- **Escala mejor:** las búsquedas que en `dbus-daemon` crecen linealmente, en `dbus-broker` crecen de forma logarítmica.
- **Mejor aislamiento:** al estar hecho para Linux, puede mitigar varios ataques de denegación de servicio.

Fedora 30 (abril de 2019) lo adoptó por defecto, y Arch tomó el mismo camino: su RFC 0025 hizo de `dbus-broker` la implementación por defecto, con `dbus-broker-units` como proveedor recomendado del paquete virtual `dbus-units` (del que ahora depende `systemd`). Pero tiene una condición decisiva para esta guía: la parte que lanza los servicios, `dbus-broker-launch`, funciona activando servicios como unidades de `systemd` y no tiene sustituto para otros inits. Los propios autores lo describen como un lanzador pensado para sistemas basados en `systemd`, y la comunidad de Artix confirma que no es un reemplazo completo allí, aunque existen scripts experimentales de terceros.

La conclusión práctica es simple. Con `systemd` (Arch, CachyOS), usa `dbus-broker`. Sin `systemd` (Artix con OpenRC, runit, s6 o dinit, y Obarun; ver [PID](./pid.md)), usa `dbus-daemon`, que funciona con cualquier init.

| Dato                | dbus-daemon                                               | dbus-broker                                               |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Primera publicación | 2002 (inicio), versión 1.0 en 2006                        | Finales de 2017; por defecto en Fedora 30 (abril de 2019) |
| Autores             | Havoc Pennington (Red Hat) y comunidad de freedesktop.org | David Rheinsberg y Tom Gundersen                          |
| Mensajes            | Puede descartarlos en ciertas condiciones                 | Garantiza que no se pierdan en silencio                   |
| Escalabilidad       | Algunas búsquedas internas lineales                       | Búsquedas logarítmicas                                    |
| Init necesario      | Cualquiera                                                | `systemd` (por su lanzador `dbus-broker-launch`)          |
| Licencia            | AFL-2.1 o GPL-2.0+                                        | Apache-2.0                                                |
| Documentación       | <https://www.freedesktop.org/wiki/Software/dbus/>         | <https://github.com/bus1/dbus-broker/wiki>                |
| Código              | <https://gitlab.freedesktop.org/dbus/dbus>                | <https://github.com/bus1/dbus-broker>                     |

**Instalación.** Con `systemd`, instala el paquete de unidades de `dbus-broker` (provee `dbus-units` y entra en conflicto con `dbus-daemon-units`; pacman te preguntará cuál de los dos quieres), actívalo para el sistema y para las sesiones de usuario, y reinicia:

```bash
sudo pacman -S dbus-broker-units
sudo systemctl enable dbus-broker.service
sudo systemctl --global enable dbus-broker.service
```

Verifica con `busctl`, que es parte de `systemd` y sirve para ambas implementaciones:

```bash
busctl list
busctl --user list
```

**Ojo con `libdbus`.** Elegir `dbus-broker` no elimina el paquete `dbus`. Lo único que cambia es quién implementa el demonio y qué unidades de `systemd` lo arrancan; el paquete `dbus` sigue instalado porque es el que provee `libdbus` (`libdbus-1.so`), la biblioteca cliente contra la que enlazan cientos de paquetes del repositorio —PipeWire, CUPS, BlueZ, Avahi, `colord`, buena parte del stack de audio e impresión, por nombrar algunos— y porque trae herramientas que sirven igual con cualquiera de las dos implementaciones: `dbus-monitor`, `dbus-send`, `dbus-run-session` y `dbus-launch`. De hecho, en Arch `dbus-broker-units` depende de `dbus`. En resumen: se instalan los dos, pero solo uno corre como demonio; el binario `dbus-daemon` queda en disco sin que nadie lo arranque.

En Artix y Obarun, el bus se instala como cualquier servicio del init (ver [PID](./pid.md)): paquete `dbus` más su paquete de servicio, con el patrón `dbus-<init>` en Artix y `dbus-66serv` en Obarun.

```bash
# Ejemplo en Artix con s6
sudo pacman -S dbus dbus-s6
```

## Varlink

D-Bus funciona bien para el escritorio, pero a `systemd` le estorbaba en tres puntos. No está disponible hasta bien avanzado el arranque, cuando `systemd` ya necesita comunicarse. No puede usarse para funciones de las que el propio bus depende (por ejemplo, el registro de `journald` o la resolución de usuarios), lo que crea dependencias circulares. Y como multiplexa muchas llamadas en una sola conexión, obliga a convertir herramientas pequeñas, de las que se ejecutan y terminan, en demonios completos.

Ante ello, Harald Hoyer anunció Varlink en diciembre de 2017, con Kay Sievers y Lars Karlitski como autores de gran parte del trabajo. Nació después de dos intentos fallidos de llevar D-Bus al kernel (kdbus y Bus1), cuando el equipo decidió simplificar el problema desde el protocolo.

Sus rasgos principales son:

- **Punto a punto:** no hay demonio intermedio; el cliente se conecta directamente al servicio, normalmente por un socket Unix.
- **JSON sobre texto:** los mensajes son JSON, lo que permite probar un servicio desde el shell sin librerías especiales.
- **Interfaces que se describen solas:** cada servicio expone su propia definición (`org.varlink.service`), y se puede consultar en tiempo de ejecución.
- **Un proceso por conexión:** escribir un servicio es más simple porque no necesita un bucle de eventos compartido.

El resultado es un protocolo que `systemd` ya usa de forma creciente: en la versión 257 (diciembre de 2024) tenía 19 interfaces o servicios Varlink frente a 11 servicios con API D-Bus, y sus desarrolladores han dicho que las nuevas APIs tenderán a ser Varlink.

Aun así, Varlink no reemplaza a D-Bus en el escritorio, y nada indica que vaya a hacerlo pronto: su diseño original no contempla enviar descriptores de archivo, la serialización es más lenta que D-Bus con objetos grandes, y casi ninguna aplicación de escritorio lo habla. Por eso D-Bus sigue siendo el bus del escritorio y Varlink convive con él en lugar de sustituirlo: en un sistema con `systemd` vas a tener los dos protocolos funcionando a la vez, y ninguno de los dos requiere que hagas algo especial.

| Dato                | Detalle                                                             |
| ------------------- | ------------------------------------------------------------------- |
| Primera publicación | 18 de diciembre de 2017 (anuncio)                                   |
| Autores             | Harald Hoyer, con Kay Sievers y Lars Karlitski (Red Hat)            |
| Adopción            | `systemd` v257 (diciembre de 2024): 19 interfaces/servicios Varlink |
| Documentación       | <https://varlink.org>                                               |
| Código              | <https://github.com/varlink>                                        |

**Instalación.** Varlink es un protocolo, no un programa; en Arch el cliente `varlinkctl` viene con `systemd`. Con él puedes inspeccionar los servicios que ya usa tu sistema:

```bash
varlinkctl info /run/systemd/userdb/io.systemd.Multiplexer
varlinkctl list-methods /run/systemd/userdb/io.systemd.Multiplexer
```

Para escribir tus propios servicios hay implementaciones en varios lenguajes en <https://github.com/varlink>.
