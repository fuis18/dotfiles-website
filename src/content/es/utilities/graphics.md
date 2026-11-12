---
title: "Gráficos"
description: "Pila gráfica: controladores de Mesa y NVIDIA, OpenGL, Vulkan y aceleración de vídeo."
category: utilities
tags: ["mesa", "nvidia", "opengl", "vulkan"]
---

Casi todo lo que ves en pantalla lo dibuja la GPU: tu [compositora](../window-manager/), la terminal, el navegador y, con la decodificación por hardware, el vídeo que reproduce [mpv](../../apps/video/). Esa ayuda de la GPU es lo que se llama aceleración, y sin ella el sistema vuelve a dibujar todo con la CPU, que es mucho más lento. Para que funcione encadenan tres piezas: un controlador en el kernel que conoce el hardware, bibliotecas en el espacio de usuario que exponen ese hardware como una API estándar, y las APIs propiamente dichas —OpenGL y Vulkan— que usan los programas. Esta página recorre las tres, de abajo hacia arriba.

## Controladores: Mesa y NVIDIA

Cada fabricante de GPU tiene su propio hardware, y cada programa gráfico necesita hablarle en su idioma. Para eso hay dos capas de controlador. La del kernel (`amdgpu`, `i915` o `xe` en Intel, `nouveau` o `nvidia`) gestiona la memoria de la GPU y la pantalla, cargandola al initramfs en el arranque (el hook `kms` de [mkinitcpio](../../iso/bootloader/)); las tarjetas AMD e Intel necesitan además su firmware, que viene en `linux-firmware`. La del espacio de usuario traduce las llamadas de las aplicaciones a órdenes que ese controlador entiende, y ahí hay dos mundos.

El primero es **Mesa**, la implementación libre de OpenGL y Vulkan que usan AMD, Intel y nouveau. Tiene más historia de la que parece: la inició Brian Paul en 1993 como un proyecto personal para implementar OpenGL en software, se liberó como código abierto en 1995 y, tras años como la implementación de referencia en Linux, entró en freedesktop.org en 2008. Hoy es un proyecto único con controladores por fabricante: RadeonSI y RADV para AMD, Iris y ANV para Intel, y NVK para NVIDIA. En Arch la versión actual es la 26.2, que mantiene OpenGL 4.6 y Vulkan 1.4. Se reparte en paquetes separados: `mesa` para OpenGL, y uno de Vulkan por fabricante (`vulkan-radeon`, `vulkan-intel`, `vulkan-nouveau`). Los programas piden «un controlador OpenGL» o «un controlador Vulkan» sin importar de qué marca, y cada paquete cumple con esa petición: [Hyprland](../window-manager/), por ejemplo, exige un `opengl-driver`, que Mesa provee.

El segundo es el **controlador propietario de NVIDIA**, que trae sus propias bibliotecas (`nvidia-utils`) en lugar de usar Mesa. Con él hay tres caminos, según la documentación de Hyprland: el propietario completo, el propietario con módulos de kernel abiertos (`nvidia-open-dkms`) y nouveau. NVIDIA recomienda los módulos abiertos desde la generación Turing en adelante, y son obligatorios en las series RTX 50. Las variantes DKMS recompilan el módulo para cada kernel, así que necesitan los encabezados de los que tengas instalados (por ejemplo, `linux-zen-headers`; ver [Bootloader y Kernel](../../iso/bootloader/)). Para que Wayland funcione bien hace falta el controlador 555 o posterior, que introdujo la sincronización explícita, y `egl-wayland`.

Entre ambas capas queda un tercer elemento: **VA-API**, la interfaz con la que reproductores y navegadores usan los bloques de decodificación de vídeo de la GPU. En AMD la aporta `libva-mesa-driver`; en Intel, `intel-media-driver`; en NVIDIA, `libva-nvidia-driver`, que se activa con una variable de entorno. Es lo que hace que `hwdec=auto-safe` de [mpv](../../apps/video/) o la codificación de `wf-recorder` realmente usen la GPU.

Con NVIDIA conviene tener presente que:

- Cargar los módulos NVIDIA muy pronto en el initramfs (_early KMS_) puede impedir la reanudación desde hibernación; en Arch, `nvidia_drm modeset=1` ya viene activado por defecto.
- Los portátiles con gráficos híbridos (Intel más NVIDIA) son la configuración con más problemas; se elige la GPU principal con la variable `AQ_DRM_DEVICES`.
- Las aplicaciones Electron y CEF pueden parpadear si corren en XWayland; `ELECTRON_OZONE_PLATFORM_HINT=auto` las pasa a Wayland nativo.

| Data               | Mesa                                                                | NVIDIA propietario                                                           |
| ------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Hardware           | AMD, Intel y NVIDIA (con nouveau y NVK)                             | NVIDIA                                                                       |
| Versión consultada | 26.2.6 (Arch, octubre de 2026)                                      | 555 o posterior para Wayland (sincronización explícita)                      |
| Licencia           | MIT (y BSD-3-Clause, SGI-B-2.0)                                     | Propietaria (módulos del kernel abiertos opcionales)                         |
| Paquetes en Arch   | `mesa`, `vulkan-radeon`, `vulkan-intel`, `vulkan-nouveau`           | `nvidia-open-dkms` o `nvidia-dkms`, `nvidia-utils`, `egl-wayland`            |
| Documentación      | <https://docs.mesa3d.org> y <https://wiki.archlinux.org/title/Mesa> | <https://wiki.hypr.land/Nvidia/> y <https://wiki.archlinux.org/title/NVIDIA> |
| Código             | <https://gitlab.freedesktop.org/mesa/mesa>                          | <https://github.com/NVIDIA/open-gpu-kernel-modules>                          |

**Instalación.** Elige según tu GPU. Para AMD:

```bash
sudo pacman -S mesa vulkan-radeon libva-mesa-driver
```

Para Intel:

```bash
sudo pacman -S mesa vulkan-intel intel-media-driver
```

Para NVIDIA con módulos abiertos y el kernel de [Bootloader y Kernel](../../iso/bootloader/):

```bash
sudo pacman -S nvidia-open-dkms nvidia-utils egl-wayland libva-nvidia-driver linux-zen-headers
```

Con NVIDIA, añade a tu configuración de Hyprland las variables de VA-API y GLX (la wiki de Hyprland usa esta sintaxis con Lua):

```lua
hl.env("LIBVA_DRIVER_NAME", "nvidia")
hl.env("__GLX_VENDOR_LIBRARY_NAME", "nvidia")
```

Para jugar o ejecutar programas de 32 bits ([Compatibilidad con Windows](./compatibility/)) hace falta además el repositorio `multilib`: descomenta `[multilib]` y su línea `Include` en `/etc/pacman.conf`, ejecuta `sudo pacman -Syu` e instala la versión de 32 bits de tu controlador (`lib32-mesa` y `lib32-vulkan-radeon`, `lib32-vulkan-intel` o `lib32-nvidia-utils`). En Artix el repositorio se llama `lib32`.

Para comprobar que todo funciona:

```bash
sudo pacman -S mesa-utils vulkan-tools libva-utils
eglinfo -B
vulkaninfo --summary
vainfo
```

Si `eglinfo` muestra `llvmpipe`, no estás usando la GPU, sino el renderizado por software de Mesa.

## OpenGL

Antes de OpenGL, cada fabricante de gráficos ofrecía su propia API, y un programa escrito para una estación de trabajo de Silicon Graphics no funcionaba en otra marca. OpenGL resolvió eso en 1992: SGI publicó su API interna (IRIS GL) como especificación abierta, de modo que cualquier fabricante podía implementarla y cualquier programa funcionaba en todos. Su gestión pasó más tarde al consorcio Khronos, que la mantiene hasta hoy. La última versión es la 4.6 (2017), y Mesa 26.2 sigue implementándola.

OpenGL es una máquina de estados: el programa configura un estado global (shaders, texturas, búferes) y pide dibujar. Eso lo hizo sencillo de aprender y explica su enorme difusión, pero también su límite: el controlador tiene que adivinar y vigilar mucho trabajo por su cuenta, lo que consume CPU y se comporta de forma distinta entre fabricantes. Khronos no ha publicado versiones posteriores a la 4.6 y concentra la evolución en Vulkan.

Aun así, sigue siendo imprescindible: muchos programas de esta guía, desde [Hyprland](../window-manager/) hasta mpv y los navegadores, lo usan. Mesa lo implementa de dos formas: de forma nativa, con RadeonSI para AMD e Iris para Intel, o sobre Vulkan, con **Zink**, la capa que implementa OpenGL encima de un controlador Vulkan. Zink se fusionó en octubre de 2019 y, desde Mesa 25.1, quien usa nouveau recibe de forma predeterminada Zink con NVK en lugar del controlador OpenGL antiguo. Así, un solo controlador Vulkan sirve también para OpenGL.

| Dato                 | Detalle                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| Primera publicación  | 1992 (SGI, a partir de IRIS GL); hoy, Khronos Group                           |
| Última versión       | 4.6 (2017)                                                                    |
| Documentación        | <https://www.khronos.org/opengl/> y <https://wiki.archlinux.org/title/OpenGL> |
| Implementación libre | <https://docs.mesa3d.org> (RadeonSI, Iris, Zink, LLVMpipe)                    |

**Instalación.** Viene con `mesa` (ver la sección anterior). Para ver qué versión de OpenGL y qué controlador estás usando:

```bash
eglinfo -B
```

## Vulkan

OpenGL escondía tanto trabajo detrás del controlador que, en juegos exigentes, un solo hilo de CPU acababa siendo el cuello de botella, y los resultados variaban mucho entre fabricantes. Vulkan nace con la idea contraria: en lugar de adivinar, el programa controla de forma explícita la memoria, la sincronización y el envío de órdenes, y puede repartir ese trabajo entre varios núcleos. El controlador pasa a ser una capa fina.

Su origen es Mantle, una API de bajo nivel que AMD diseñó con DICE (los creadores de Battlefield) y donó a Khronos como punto de partida. Khronos la refundó como Vulkan, la presentó en la GDC de 2015 y publicó la versión 1.0 el 16 de febrero de 2016. La 1.4 es de diciembre de 2024, y varios controladores de Mesa (RADV, ANV, NVK, Turnip y Honeykrisp) alcanzaron la conformidad el mismo día. Los shaders se envían en SPIR-V, un formato intermedio que cada controlador compila para su GPU.

Hay tres razones para que Vulkan importe en esta guía:

- **Es la base de la compatibilidad con Windows.** Las capas DXVK y VKD3D-Proton traducen Direct3D a Vulkan, y por eso Proton funciona (ver [Compatibilidad con Windows](./compatibility/)). NVK cumple todo lo necesario para DXVK, lo que hace posible jugar con el controlador libre de NVIDIA.
- **Ya no es solo para juegos.** Hay renderizadores de toolkits, aplicaciones y motores de vídeo que lo usan.
- **Tiene un respaldo por software:** `lavapipe`, de Mesa, ofrece Vulkan sobre la CPU cuando no hay GPU, lo cual es útil para depurar.

Su costo es la complejidad: es tan explícito que un programa Vulkan exige muchas más líneas que uno en OpenGL, por lo que es una API para motores y bibliotecas, no para dibujar un triángulo rápido. Y no es retrocompatible con OpenGL, que es justo lo que resuelven capas como Zink.

| Dato                 | Detalle                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Primera publicación  | 16 de febrero de 2016 (1.0); versión 1.4 el 3 de diciembre de 2024                           |
| Autores              | Khronos Group, a partir de Mantle (AMD y DICE)                                               |
| Controladores libres | RADV (AMD), ANV (Intel), NVK (NVIDIA), lavapipe (CPU), todos en Mesa                         |
| Documentación        | <https://www.vulkan.org> y <https://wiki.archlinux.org/title/Vulkan>                         |
| Código               | <https://github.com/KhronosGroup/Vulkan-Loader> y <https://gitlab.freedesktop.org/mesa/mesa> |

**Instalación.** El cargador de Vulkan (`vulkan-icd-loader`) llega como dependencia del controlador de tu GPU. Las herramientas de diagnóstico:

```bash
sudo pacman -S vulkan-tools
vulkaninfo --summary
```

Para comprobar que Vulkan funciona de forma visible, `vkcube` (del paquete `vulkan-tools`) dibuja un cubo giratorio.
