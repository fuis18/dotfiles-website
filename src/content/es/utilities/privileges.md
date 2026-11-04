---
title: "sudo y doas"
description: "Ejecución con privilegios: sudo y doas, comparación e instalación."
category: utilities
tags: ["sudo", "doas", "privileges", "security"]
---

En un sistema multiusuario, hay acciones que deben reservar a un único actor: crear cuentas, modificar rutas de red, reinstalar paquetes. Permitirlas a cualquiera rompe el modelo de seguridad; negárselas por completo hace el sistema inutilizable. La solución es la **elevación temporal**: ejecutar una operación específica como root mientras el resto del trabajo sigue en el contexto normal del usuario.

En el ecosistema Unix/Linux hay dos herramientas dominantes para esto: **sudo** y **doas**. La primera es la más extendida, con décadas de historia y un ecosistema de módulos enorme. La segunda nació de OpenBSD con una filosofía opuesta: hacer el código mínimo posible y confiar menos en su complejidad. Ambas resuelven el mismo problema, pero con filosofías distintas.

## sudo: el estándar extendido

**sudo** (_superuser do_) apareció a principios de los años 90, creado por Bob Coggeshall y Chuck Allen, y hoy está mantenido por un equipo comunitario que publica versiones nuevas regularmente. Su modelo es permisivo: por defecto pide tu contraseña y registra cada uso en logs detallados.

### Filosofía y características

- **Granularidad fina:** puedes permitir comandos específicos o grupos de comandos, incluso con argumentos limitados.
- **Módulos extensibles:** soporta PAM, LDAP, integración con sistemas de autenticación externos.
- **Logging detallado:** cada invocación se escribe en `/var/log/secure` o `/var/log/auth.log`.
- **Configuración flexible:** el archivo `/etc/sudoers` permite expresiones regulares, aliases, restricciones de host, horarios y más.
- **Consola segura:** usa `pwfeedback` (opcional) y protecciones contra inyección de terminal.

La desventaja es su complejidad: `/etc/sudoers` puede volverse difícil de mantener, y errores de sintaxis pueden dejar el sistema sin acceso root si no se valida con `visudo` antes.

| Dato            | Detalle                                        |
| --------------- | ---------------------------------------------- |
| Origen          | Principios de los años 90 (Coggeshall y Allen) |
| Mantenimiento   | Equipo comunitario (The Sudo Project)          |
| Primera versión | 1985                                           |
| Última estable  | 1.9.15 (enero de 2025)                         |
| Documentación   | <https://www.sudo.ws/docs/>                    |
| Código          | <https://github.com/sudo-project/sudo>         |
| Licencia        | ISC                                            |

### Instalación en Arch

```bash
sudo pacman -S sudo
```

Arch viene con `sudo` instalado por defecto, pero desactivado hasta que asignas privilegios.

### Configuración básica

**1. Habilitar grupo wheel.** Descomenta esta línea en `/etc/sudoers` (edita SIEMPRE con `visudo`):

```conf
# /etc/sudoers
%wheel ALL=(ALL:ALL) ALL
```

**2. Añadir usuario al grupo wheel.**

```bash
sudo usermod -aG wheel tu_usuario
```

**3. Validar.** Cierra sesión y vuelve a entrar, o ejecuta:

```bash
groups tu_usuario
sudo -l  # Lista tus permisos actuales
```

### Sintaxis avanzada de /etc/sudoers

```conf
# Alias para comandos
Cmnd_Alias SOFTWARE = /usr/bin/pacman, /usr/bin/pacman-opt, /usr/bin/pamac

# Usuario específico, sin pedir contraseña (peligroso)
alice ALL=(ALL) NOPASSWD: ALL

# Grupo con restricción de comando
%administrators ALL=(ALL) SOFTWARE

# Restricción por host
bob SERVER1=(ALL) ALL

# Pedir contraseña cada vez
Defaults timestamp_timeout=0

# Feedback visual al escribir la contraseña
Defaults pwfeedback
```

**IMPORTANTE:** Nunca edites `/etc/sudoers` directamente. Usa siempre `visudo`:

```bash
sudo visudo
```

Si hay errores de sintaxis, `visudo` te avisará y rechazará guardar el archivo. Esto previene bloqueos por errores humanos.

## doas: la alternativa minimalista

**doas** (_do as_) nació en OpenBSD 5.7 (mayo de 2015) como reemplazo de `sudo`. La razón fue filosófica: el autor Theo de Raadt quería una herramienta que hiciera una sola cosa y la hiciera correctamente, con menos de 700 líneas de código.

La premisa es simple: **menor superficie de ataque**. Mientras `sudo` tiene miles de líneas y múltiples modos de operación, `doas` hace exactamente lo que dice su nombre: ejecuta un comando como otro usuario. Nada más.

### Filosofía y características

- **Código mínimo:** menos de 700 líneas de código C.
- **Configuración sencilla:** un único archivo plano, `/etc/doas.conf`, sin sintaxis compleja.
- **Menos dependencias:** no requiere PAM por defecto (aunque lo soporta).
- **Rendimiento ligero:** arranque casi instantáneo.
- **Transparencia:** fácil de auditar y verificar.

Las limitaciones son las mismas: menos flexibilidad que `sudo`, sin módulos extensibles, sin integración LDAP, sin logging avanzado nativo.

| Dato             | Detalle                                                    |
| ---------------- | ---------------------------------------------------------- |
| Origen           | OpenBSD 5.7, mayo de 2015                                  |
| Autor            | Theo de Raadt                                              |
| Líneas de código | ≈700                                                       |
| Documentación    | <https://man.openbsd.org/doas>                             |
| Código           | <https://cvsweb.openbsd.org/cgi-bin/cvsweb/src/sbin/doas/> |
| Licencia         | ISC                                                        |

### Instalación en Arch

```bash
sudo pacman -S doas
```

### Configuración básica

**1. Crear `/etc/doas.conf`.** Sintaxis extremadamente simple:

```conf
# /etc/doas.conf

# Permitir al grupo wheel ejecutar TODO sin contraseña
permit persist :wheel

# Permitir a alice ejecutar TODO CON contraseña
permit alice

# Permitir a bob ejecutar SOLO pacman sin contraseña
permit nopass bob as root cmd /usr/bin/pacman

# Denegar explícitamente a carol (las reglas se evalúan en orden)
deny carol
```

**2. Verificar.**

```bash
doas -l  # Lista tus permisos
doas ls /root  # Prueba de ejecución
```

### Diferencias de sintaxis entre sudo y doas

| Característica         | sudo                   | doas                                     |
| ---------------------- | ---------------------- | ---------------------------------------- |
| Archivo de config      | `/etc/sudoers`         | `/etc/doas.conf`                         |
| Editor seguro          | `visudo`               | Cualquier editor (sin validación nativa) |
| Pedir contraseña       | `NOPASSWD:`            | `nopass`                                 |
| Persistir credenciales | `timestamp_timeout`    | `persist`                                |
| Especificar usuario    | `as username`          | `as username`                            |
| Restringir comando     | `cmd /path/to/command` | `cmd /path/to/command`                   |
| Grupos                 | `%groupname`           | `:groupname`                             |

**Nota:** `doas.conf` no tiene validación automática. Si cometes un error de sintaxis, el archivo simplemente no funcionará. Haz copias de seguridad antes de editar.

## Seguridad y mejores prácticas

Ambas herramientas requieren configuración consciente. Errores comunes:

1. **`NOPASSWD` excesivo:** dar permisos sin contraseña a todos los usuarios es inseguro.
2. **Acceso total sin restricciones:** permitir `ALL` a un usuario no técnico aumenta riesgos.
3. **Ignorar logs:** revisar `/var/log/auth.log` periódicamente ayuda a detectar intrusiones.

### Reglas recomendadas

- **Principio de mínimo privilegio:** da solo los comandos necesarios, no todo.
- **Usa grupos:** administra permisos por grupo, no por usuario individual.
- **Activa logging:** asegúrate de que se graban los intentos.
- **Limita por horario o IP:** si tu herramienta lo permite, añade restricciones adicionales.
- **Revisa periódicamente:** haz auditorías semestrales de quién tiene qué privilegios.

## Comparativa directa

| Aspecto        | sudo                          | doas                            |
| -------------- | ----------------------------- | ------------------------------- |
| Madurez        | 30+ años, ampliamente usado   | ~10 años, nicho                 |
| Complejidad    | Alta (sintaxis compleja)      | Baja (archivo plano simple)     |
| Flexibilidad   | Muy alta (LDAP, PAM, módulos) | Baja (funciona para lo básico)  |
| Auditoría      | Difícil (código grande)       | Fácil (<700 líneas)             |
| Rendimiento    | Ligeramente más lento         | Muy rápido                      |
| Logging        | Detallado integrado           | Básico, requiere syslog externo |
| Disponibilidad | Todas las distribuciones      | OpenBSD, Arch, algunas Linux    |

## Instalación en Artix y Obarun

En sistemas sin `systemd`, el proceso es idéntico, pero el servicio de logging puede variar.

```bash
# sudo
sudo pacman -S sudo
sudo visudo

# doas
sudo pacman -S doas
sudo nano /etc/doas.conf
```

Ambas funcionan con cualquier init (OpenRC, runit, s6, dinit) porque no dependen de `systemd`.
