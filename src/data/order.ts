import type { CategoryId } from "./categories";

export const entryOrder: Record<CategoryId, readonly string[]> = {
  iso: [
    "distro-base",
    "firmware",
    "mounts",
    "encryption",
    "install-media",
    "bootloader",
    "kernel-initramfs",
    "pid",
    "components-optimization",
  ],
  utilities: [
    "dbus",
    "privileges",
    "network",
    "package-management",
    "graphics",
    "window-manager",
    "greeter",
    "portals",
    "shell",
    "terminal",
  ],
  apps: [
    "ecosystem",
    "control-panel",
    "file-explorer",
    "audio",
    "video",
    "browsers",
    "dev-environment",
  ],
};
