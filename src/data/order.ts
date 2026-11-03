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
    "greeter",
    "window-manager",
    "portals",
    "shell",
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
