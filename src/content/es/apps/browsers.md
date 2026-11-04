---
title: "Browsers"
description: "Navegadores: zen-browser, Helium, Epiphany, Brave, Mullvad Browser y Tor Browser."
category: apps
tags: ["tor", "brave", "zen-browser", "helium", "epiphany", "mullvad"]
---

El navegador es la aplicación que más usas y la que más sabe de ti, así que elegirlo es una decisión de privacidad antes que de apariencia. Esta página recorre seis navegadores en orden creciente de exigencia: primero los que mejoran el uso diario, después uno integrado en el escritorio y, al final, los pensados para un modelo de amenaza más serio. Además cubren tres motores distintos (Gecko, Blink y WebKit), algo importante porque cuando casi todos usan el mismo motor, el que lo controla decide cómo evoluciona la web.

## Chrome y Firefox: los dos polos

Netscape Navigator, el navegador dominante de los años noventa, vio cómo su reinado declinaba hasta que Mozilla liberó su código fuente en 1998 tras perder la batalla comercial frente a Internet Explorer. De ese código derivó Mozilla Suite, un conjunto pesado de aplicaciones que llevó a Dave Hyatt y Blake Ross a iniciar en 2002 el proyecto Phoenix dentro de Mozilla: un navegador independiente, enfocado únicamente en la navegación y ligero. Tras varios conflictos de marca que lo llevaron a llamarse temporalmente Firebird, el navegador fue bautizado definitivamente como Firefox y lanzó su versión 1.0 el 9 de noviembre de 2004, bajo el resguardo de la Mozilla Foundation (creada en 2003 con Mitchell Baker al frente) y de la Mozilla Corporation (fundada en 2005 para su desarrollo y comercialización mediante acuerdos de motores de búsqueda).

En ese escenario de dominio por parte de Internet Explorer, Google irrumpió en el mercado en septiembre de 2008 anunciando su propio navegador mediante un cómic ilustrado por Scott McCloud publicado un día antes del lanzamiento. Detrás del proyecto destacaban Lars Bak, el ingeniero danés creador de la máquina virtual de JavaScript V8, y Linus Upson. En sus inicios, Chrome utilizó el motor de renderizado WebKit de Safari, hasta que en 2013 Google decidió bifurcarlo para crear su propio motor, Blink.

Por su parte, el motor de Firefox, Gecko, atravesó dos grandes reescrituras técnicas para mantenerse competitivo frente a Chrome: **Electrolysis** (2015-2016), que introdujo la arquitectura multiproceso al separar las pestañas en procesos independientes, y **Quantum** (Firefox 57, noviembre de 2017), que integró tecnología del proyecto de investigación Servo —desarrollado en el lenguaje Rust— para multiplicar drásticamente su velocidad.

De esta evolución, Firefox dejó abiertos dos frentes: una interfaz heredada de los años dos mil y un enfoque de privacidad que resulta insuficiente ante amenazas avanzadas. Chrome, por su parte, planteó un compromiso aún más profundo: ser un producto nativo del ecosistema de Google, con telemetría, publicidad y servicios integrados que el usuario acepta en favor del rendimiento de su motor.

## Tor browser (~2011)

Hay un tipo de seguimiento más difícil de evitar que los anuncios, el _fingerprinting_: aunque bloquees las cookies, tu navegador revela suficientes datos (fuentes instaladas, tamaño de pantalla, versión, idioma) para identificarte entre millones. La mayoría de las herramientas contra el fingerprinting aleatorizan esos datos, lo que paradójicamente te hace destacar. Tor Browser aplica la estrategia contraria: que todos los usuarios parezcan el mismo.

Lo desarrolla el Tor Project, una organización sin fines de lucro que mantiene la red Tor desde los años noventa, y empezó a empaquetarla con Firefox como Tor Browser Bundle alrededor de 2011. Está basado en Firefox ESR: además de unificar la huella, envía todo el tráfico por la red Tor, que lo pasa por varios nodos para ocultar tu dirección IP. El precio es la velocidad, que baja de forma notable, y que algunos sitios bloquean o limitan las conexiones desde Tor.

No es un navegador de uso diario: es una herramienta para anonimato real cuando la amenaza lo justifica, y funciona mejor cuando se usa sin modificar. Ni siquiera él protege frente a errores propios, como iniciar sesión con tu cuenta personal.

| Dato                | Detalle                                                      |
| ------------------- | ------------------------------------------------------------ |
| Primera publicación | Tor Browser Bundle, alrededor de 2011                        |
| Autores             | Tor Project (organización sin fines de lucro)                |
| Base                | Firefox ESR; NoScript incluido                               |
| Red                 | Red Tor (varios nodos)                                       |
| Velocidad           | Más lenta                                                    |
| Licencia            | MPL-2.0                                                      |
| Documentación       | <https://support.torproject.org>                             |
| Código              | <https://gitlab.torproject.org/tpo/applications/tor-browser> |

**Instalación.** Hay un instalador oficial en los repositorios que lo descarga y verifica su firma por ti:

```bash
sudo pacman -S torbrowser-launcher
torbrowser-launcher
```

## Brave (2016–2019)

El problema opuesto al de Tor: no el anonimato extremo, sino la telemetría cotidiana de Chromium. Quien necesitaba Blink estaba atado a un producto de Google que rastrea, sincroniza con una cuenta y puebla la página de nueva pestaña con publicidad. Lo fundó en 2015 **Brendan Eich**, coautor de JavaScript en Netscape y cofundador y breve CEO de Mozilla —abandonó la corporación tras controversias internas—, junto a Brian Bondy, también ex de Mozilla. Su primera beta pública salió el 20 de enero de 2016, y la versión 1.0 el 13 de noviembre de 2019, ya con el bloqueo por defecto y ventanas privadas con Tor.

Su propuesta es bloquear anuncios y rastreadores por defecto, sin extensión ni configuración, y financiar la web con un sistema de recompensas (Basic Attention Token, BAT) repartido entre usuarios y sitios. Es un modelo controvertido: unos lo ven como monetizar la navegación sin vender datos, otros critican meter criptomonedas y afiliaciones en un navegador. En lo técnico es un Chromium endurecido, sin la telemetría de Google pero con la compatibilidad de extensiones de la Chrome Web Store. Es la opción práctica cuando hace falta Blink a diario con privacidad por defecto, sin pasar por uBlock Origin y ajustes manuales.

| Dato                | Detalle                                                    |
| ------------------- | ---------------------------------------------------------- |
| Primera publicación | 20 de enero de 2016 (beta); 1.0 el 13 de noviembre de 2019 |
| Autores             | Brendan Eich y Brian Bondy                                 |
| Motor y licencia    | Blink (basado en Chromium); MPL-2.0                        |
| Documentación       | <https://support.brave.com>                                |
| Código              | <https://github.com/brave/brave-core>                      |

**Instalación.** Desde el AUR:

```bash
paru -S brave-bin
```

## Epiphany (2002)

Epiphany, llamado hoy _GNOME Web_, es el navegador del proyecto GNOME. Nació en 2002 como una bifurcación de Galeon, un navegador GNOME anterior, y desde entonces se mantiene como el navegador sencillo y bien integrado del escritorio. Usa el motor WebKit (a través de WebKitGTK), el mismo que Safari, y una interfaz GTK4 con libadwaita (ver [Ecosistema](./ecosystem.md)), de modo que se ve y se comporta como las demás aplicaciones de esta guía.

Sus rasgos principales:

- **Ligero y bien integrado:** comparte las bibliotecas GTK ya instaladas, y se abre sin arrastrar un motor adicional.
- **Privacidad básica incluida:** bloqueo de anuncios y prevención de rastreo inteligente.
- **Aplicaciones web:** permite instalar un sitio como una aplicación independiente que se abre en su propia ventana.
- **Sincronización con Firefox** para marcadores, historial y contraseñas.

Su limitación es el ecosistema: las extensiones son muchas menos que en Firefox o Chromium, y WebKitGTK tiene menos compatibilidad con algunos sitios complejos. Es una buena opción para un uso ligero o para aplicaciones web, y una mala para trabajar a diario con extensiones.

| Dato            | Detalle                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| Origen          | 2002, bifurcación de Galeon; navegador del proyecto GNOME                        |
| Motor y toolkit | WebKit (WebKitGTK); GTK4 + libadwaita                                            |
| Licencia        | GPL-3.0 o posterior                                                              |
| Documentación   | <https://wiki.gnome.org/Apps/Web> y <https://wiki.archlinux.org/title/GNOME/Web> |
| Código          | <https://gitlab.gnome.org/GNOME/epiphany>                                        |

**Instalación.** Está en los repositorios oficiales. Añade los códecs de GStreamer para que reproduzca vídeo:

```bash
sudo pacman -S epiphany gst-plugins-good gst-libav
```

## Mullvad Browser (3 de abril de 2023)

Tor Browser resolvía el fingerprinting, pero con el costo de la red Tor: demasiado lento para algo más que sesiones puntuales. La pregunta que ataca el siguiente fork es si se puede tener la misma huella estandarizada sin sacrificar la velocidad. La respuesta llegó el 3 de abril de 2023 de la colaboración entre Mullvad VPN, conocida por su política de cero logs, y los ingenieros del Tor Project, y se describe sin rodeos como Tor Browser sin Tor.

Tiene la misma protección contra el fingerprinting, pero sin la red Tor: está pensado para usarse con una VPN de confianza. Se basa en Firefox ESR, trae uBlock Origin y NoScript instalados, abre por defecto en modo privado y borra la sesión al cerrar. La ventaja es que es más rápido que Tor; la desventaja es que tu anonimato depende de la VPN y de que mucha gente comparta la misma huella. Como Tor, no es un navegador de uso diario, sino para cuando necesitas evitar el fingerprinting sin perder velocidad.

| Dato                | Detalle                                         |
| ------------------- | ----------------------------------------------- |
| Primera publicación | 3 de abril de 2023                              |
| Autores             | Ingenieros del Tor Project, con Mullvad VPN     |
| Base                | Firefox ESR; uBlock Origin y NoScript incluidos |
| Red                 | Tu conexión o VPN                               |
| Velocidad           | Normal                                          |
| Licencia            | MPL-2.0                                         |
| Documentación       | <https://mullvad.net/en/browser>                |
| Código              | <https://github.com/mullvad/mullvad-browser>    |

**Instalación.** Desde el AUR o como Flatpak:

```bash
paru -S mullvad-browser-bin
```

## Zen Browser (12 de julio de 2024)

Firefox tiene el motor, la privacidad y las extensiones, pero su interfaz, pensada para los años dos mil, se siente rígida frente a la de navegadores más nuevos como Arc: una fila de pestañas horizontales, sin forma de separar proyectos y sin ver dos páginas a la vez. Zen intenta resolver eso sin abandonar Firefox. Es una bifurcación de Firefox con el motor Gecko, publicada por primera vez en julio de 2024 (la versión alfa 1.0.0-a.1, el 12 de julio) y creada por Mauro (maubg) y una comunidad de colaboradores, que se mantiene sincronizada con las versiones de Firefox.

Sus rasgos principales:

- **Pestañas verticales y espacios de trabajo:** separan tus pestañas por proyecto o tema, y cada espacio puede tener sus propias pestañas fijadas.
- **Vista dividida (_split view_):** varias páginas en mosaico dentro de una misma ventana.
- **Modo compacto** que oculta todo salvo la página, y _Mods_, temas que personalizan su apariencia.
- **Compatibilidad con Firefox:** las extensiones de addons.mozilla.org (uBlock Origin, Bitwarden…) funcionan igual, y los perfiles se importan sin problemas.

Es la opción de uso diario recomendada en esta guía. El costo es el mismo de cualquier bifurcación: depende de que su equipo, pequeño, siga el ritmo de Firefox, y su primera versión estable llegó tras una larga etapa alfa.

| Dato                | Detalle                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| Primera publicación | 12 de julio de 2024 (1.0.0-a.1, alfa); versión 1.19b en febrero de 2026 |
| Autores             | Mauro (maubg) y el equipo de Zen Browser                                |
| Motor y licencia    | Gecko (bifurcación de Firefox); MPL-2.0                                 |
| Documentación       | <https://docs.zen-browser.app>                                          |
| Código              | <https://github.com/zen-browser/desktop>                                |
| Sitio               | <https://zen-browser.app>                                               |

**Instalación.** Zen se distribuye como Flatpak (el perfil queda dentro del sandbox) o desde el AUR:

```bash
sudo pacman -S flatpak
flatpak install flathub app.zen_browser.zen

# O bien, desde el AUR
paru -S zen-browser-bin
```

## Helium (2025)

Cuando una web funciona solo en Chrome, o una extensión solo existe para Chromium, un navegador basado en Firefox no basta. Pero Chrome es un producto de Google, con telemetría, publicidad y servicios incrustados, y la mayoría de sus bifurcaciones comparten ese motor con otra personalidad. Helium resuelve eso con una apuesta clara: privacidad por defecto, no por configuración. Es un navegador de escritorio basado en Chromium (con el trabajo de _ungoogled-chromium_ como base), publicado por el equipo de imputnet, con numeración en versiones 0.x y desarrollo activo.

Lo que trae de serie:

- **Bloqueo de anuncios y rastreadores incluido**, con uBlock Origin y filtros de la comunidad, y protección contra fingerprinting activada.
- **Cero peticiones a la web en el primer arranque**, sin anuncios, rastreadores ni analíticas.
- **Compatibilidad con extensiones de Chromium**, incluidas las MV2 (que Chrome dejó de admitir), y vista dividida.
- **_Bangs_ nativos** (`!w` para Wikipedia, `!gh` para GitHub) con más de 13.000 atajos.

Es el complemento de Zen para lo que exige un motor Blink. Hay que tener presente que sigue en versiones 0.x, y que su dependencia de Chromium implica seguir los parches de seguridad de ese proyecto.

| Dato             | Detalle                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| Origen           | Proyecto de imputnet; primeras versiones en 2025; serie 0.x (0.12.4.1 en el AUR a 2026) |
| Motor y licencia | Chromium (base _ungoogled-chromium_); GPL-3.0 y BSD-3-Clause                            |
| Código           | <https://github.com/imputnet/helium-linux>                                              |
| Documentación    | Sitio y notas de versión en el repositorio                                              |

**Instalación.** Desde el AUR (el paquete `-bin` sigue la rama estable; la versión de prueba es `helium-browser-beta-bin`):

```bash
paru -S helium-browser-bin
```
