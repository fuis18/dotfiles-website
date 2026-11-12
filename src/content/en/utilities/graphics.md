---
title: "Graphics"
description: "Graphics stack: Mesa and NVIDIA drivers, OpenGL, Vulkan and video acceleration."
category: utilities
tags: ["mesa", "nvidia", "opengl", "vulkan"]
---

Almost everything you see on screen is drawn by the GPU: your [compositor](./window-manager/), the terminal, the browser and, with hardware decoding, the video that [mpv](./video/) plays. That GPU help is what is called acceleration, and without it the system goes back to drawing everything with the CPU, which is much slower. For it to work, three pieces must chain together: a driver in the kernel that knows the hardware, libraries in user space that expose that hardware as a standard API, and the APIs themselves — OpenGL and Vulkan— that programs use. This page walks through the three, from bottom to top.

## Drivers: Mesa and NVIDIA

Each GPU vendor has its own hardware, and every graphics program needs to speak its language. For that there are two driver layers. The kernel one (`amdgpu`, `i915` or `xe` on Intel, `nouveau` or `nvidia`) manages GPU memory and the display, loading it into the initramfs at boot (the `kms` hook of [mkinitcpio](./bootloader/)); AMD and Intel cards also need their firmware, which comes in `linux-firmware`. The user-space one translates application calls into commands that driver understands, and there are two worlds there.

The first is **Mesa**, the free implementation of OpenGL and Vulkan used by AMD, Intel and nouveau. It has more history than it seems: Brian Paul started it in 1993 as a personal project to implement OpenGL in software, it was released as open source in 1995 and, after years as the reference implementation on Linux, it joined freedesktop.org in 2008. Today it is a single project with drivers per vendor: RadeonSI and RADV for AMD, Iris and ANV for Intel, and NVK for NVIDIA. On Arch the current version is 26.2, which keeps OpenGL 4.6 and Vulkan 1.4. It ships in separate packages: `mesa` for OpenGL, and one Vulkan package per vendor (`vulkan-radeon`, `vulkan-intel`, `vulkan-nouveau`). Programs ask for "an OpenGL driver" or "a Vulkan driver" regardless of the brand, and each package fulfills that request: [Hyprland](./window-manager/), for instance, requires an `opengl-driver`, which Mesa provides.

The second is NVIDIA's **proprietary driver**, which ships its own libraries (`nvidia-utils`) instead of using Mesa. With it there are three paths, according to the Hyprland documentation: the fully proprietary one, the proprietary one with open kernel modules (`nvidia-open-dkms`), and nouveau. NVIDIA recommends the open modules from the Turing generation onward, and they are mandatory on the RTX 50 series. The DKMS variants recompile the module for each kernel, so they need the headers of whichever you have installed (for example, `linux-zen-headers`; see [Bootloader and Kernel](./bootloader/)). For Wayland to work well you need driver 555 or later, which introduced explicit synchronization, and `egl-wayland`.

Between both layers sits a third element: **VA-API**, the interface through which players and browsers use the GPU's video decoding blocks. On AMD it comes from `libva-mesa-driver`; on Intel, `intel-media-driver`; on NVIDIA, `libva-nvidia-driver`, which is enabled with an environment variable. This is what makes [mpv](./video/)'s `hwdec=auto-safe` or `wf-recorder`'s encoding actually use the GPU.

With NVIDIA it is worth keeping in mind that:

- Loading the NVIDIA modules very early in the initramfs (_early KMS_) can prevent resuming from hibernation; on Arch, `nvidia_drm modeset=1` is already enabled by default.
- Laptops with hybrid graphics (Intel plus NVIDIA) are the most problematic setup; the primary GPU is chosen with the `AQ_DRM_DEVICES` variable.
- Electron and CEF applications may flicker if they run on XWayland; `ELECTRON_OZONE_PLATFORM_HINT=auto` moves them to native Wayland.

| Data             | Mesa                                                                  | NVIDIA proprietary                                                             |
| ---------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Hardware         | AMD, Intel and NVIDIA (with nouveau and NVK)                          | NVIDIA                                                                         |
| Checked version  | 26.2.6 (Arch, October 2026)                                           | 555 or later for Wayland (explicit synchronization)                            |
| License          | MIT (and BSD-3-Clause, SGI-B-2.0)                                     | Proprietary (open kernel modules optional)                                     |
| Packages on Arch | `mesa`, `vulkan-radeon`, `vulkan-intel`, `vulkan-nouveau`             | `nvidia-open-dkms` or `nvidia-dkms`, `nvidia-utils`, `egl-wayland`             |
| Documentation    | <https://docs.mesa3d.org> and <https://wiki.archlinux.org/title/Mesa> | <https://wiki.hypr.land/Nvidia/> and <https://wiki.archlinux.org/title/NVIDIA> |
| Code             | <https://gitlab.freedesktop.org/mesa/mesa>                            | <https://github.com/NVIDIA/open-gpu-kernel-modules>                            |

**Installation.** Pick according to your GPU. For AMD:

```bash
sudo pacman -S mesa vulkan-radeon libva-mesa-driver
```

For Intel:

```bash
sudo pacman -S mesa vulkan-intel intel-media-driver
```

For NVIDIA with open modules and the kernel from [Bootloader and Kernel](./bootloader/):

```bash
sudo pacman -S nvidia-open-dkms nvidia-utils egl-wayland libva-nvidia-driver linux-zen-headers
```

With NVIDIA, add the VA-API and GLX variables to your Hyprland configuration (the Hyprland wiki uses this syntax with Lua):

```lua
hl.env("LIBVA_DRIVER_NAME", "nvidia")
hl.env("__GLX_VENDOR_LIBRARY_NAME", "nvidia")
```

To play games or run 32-bit programs ([Windows Compatibility](./compatibility/)) you also need the `multilib` repository: uncomment `[multilib]` and its `Include` line in `/etc/pacman.conf`, run `sudo pacman -Syu` and install the 32-bit version of your driver (`lib32-mesa` and `lib32-vulkan-radeon`, `lib32-vulkan-intel` or `lib32-nvidia-utils`). On Artix the repository is called `lib32`.

To check that everything works:

```bash
sudo pacman -S mesa-utils vulkan-tools libva-utils
eglinfo -B
vulkaninfo --summary
vainfo
```

If `eglinfo` shows `llvmpipe`, you are not using the GPU but Mesa's software rendering.

## OpenGL

Before OpenGL, each graphics vendor offered its own API, and a program written for a Silicon Graphics workstation would not run on another brand. OpenGL solved that in 1992: SGI published its internal API (IRIS GL) as an open specification, so any vendor could implement it and any program worked on all of them. Its management later passed to the Khronos consortium, which maintains it to this day. The latest version is 4.6 (2017), and Mesa 26.2 still implements it.

OpenGL is a state machine: the program configures a global state (shaders, textures, buffers) and asks to draw. That made it easy to learn and explains its huge reach, but also its limit: the driver has to guess and track a lot of work on its own, which costs CPU and behaves differently across vendors. Khronos has not published versions after 4.6 and focuses evolution on Vulkan.

Even so, it remains essential: many programs in this guide, from [Hyprland](./window-manager/) to mpv and browsers, use it. Mesa implements it in two ways: natively, with RadeonSI for AMD and Iris for Intel, or on top of Vulkan, with **Zink**, the layer that implements OpenGL on top of a Vulkan driver. Zink was merged in October 2019 and, since Mesa 25.1, nouveau users get Zink with NVK by default instead of the old OpenGL driver. That way, a single Vulkan driver also serves OpenGL.

| Data                | Detail                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| First release       | 1992 (SGI, from IRIS GL); today, Khronos Group                                  |
| Latest version      | 4.6 (2017)                                                                      |
| Documentation       | <https://www.khronos.org/opengl/> and <https://wiki.archlinux.org/title/OpenGL> |
| Free implementation | <https://docs.mesa3d.org> (RadeonSI, Iris, Zink, LLVMpipe)                      |

**Installation.** Comes with `mesa` (see the previous section). To see which OpenGL version and which driver you are using:

```bash
eglinfo -B
```

## Vulkan

OpenGL hid so much work behind the driver that, in demanding games, a single CPU thread ended up being the bottleneck, and results varied widely across vendors. Vulkan was born with the opposite idea: instead of guessing, the program explicitly controls memory, synchronization and the submission of commands, and can spread that work across multiple cores. The driver becomes a thin layer.

Its origin is Mantle, a low-level API that AMD designed with DICE (the creators of Battlefield) and donated to Khronos as a starting point. Khronos rebuilt it as Vulkan, presented it at GDC 2015 and released version 1.0 on February 16, 2016. Version 1.4 is from December 2024, and several Mesa drivers (RADV, ANV, NVK, Turnip and Honeykrisp) reached conformance the same day. Shaders are submitted in SPIR-V, an intermediate format that each driver compiles for its GPU.

There are three reasons Vulkan matters in this guide:

- **It is the base of Windows compatibility.** The DXVK and VKD3D-Proton layers translate Direct3D to Vulkan, and that is why Proton works (see [Windows Compatibility](./compatibility/)). NVK meets everything DXVK needs, which makes gaming possible with NVIDIA's free driver.
- **It is no longer just for games.** There are renderers for toolkits, applications and video engines that use it.
- **It has a software fallback:** Mesa's `lavapipe` offers Vulkan on the CPU when there is no GPU, which is useful for debugging.

Its cost is complexity: it is so explicit that a Vulkan program requires many more lines than an OpenGL one, so it is an API for engines and libraries, not for drawing a quick triangle. And it is not backward compatible with OpenGL, which is exactly what layers like Zink solve.

| Data          | Detail                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| First release | February 16, 2016 (1.0); version 1.4 on December 3, 2024                                       |
| Authors       | Khronos Group, from Mantle (AMD and DICE)                                                      |
| Free drivers  | RADV (AMD), ANV (Intel), NVK (NVIDIA), lavapipe (CPU), all in Mesa                             |
| Documentation | <https://www.vulkan.org> and <https://wiki.archlinux.org/title/Vulkan>                         |
| Code          | <https://github.com/KhronosGroup/Vulkan-Loader> and <https://gitlab.freedesktop.org/mesa/mesa> |

**Installation.** The Vulkan loader (`vulkan-icd-loader`) comes as a dependency of your GPU driver. The diagnostic tools:

```bash
sudo pacman -S vulkan-tools
vulkaninfo --summary
```

To check that Vulkan works visibly, `vkcube` (from the `vulkan-tools` package) draws a spinning cube.
