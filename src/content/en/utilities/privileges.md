---
title: "sudo and doas"
description: "Privileged execution: sudo and doas, comparison and installation."
category: utilities
tags: ["sudo", "doas", "privileges", "security"]
---

On a multiuser system, some actions must be reserved to a single actor: creating accounts, modifying network routes, reinstalling packages. Allowing anyone to do them breaks the security model; denying them outright makes the system unusable. The solution is **temporary elevation**: running a specific operation as root while the rest of the work continues in the normal user context.

In the Unix/Linux ecosystem there are two dominant tools for this: **sudo** and **doas**. The first is the most widespread, with decades of history and a huge module ecosystem. The second was born at OpenBSD with an opposite philosophy: keep the code as minimal as possible and trust its complexity less. Both solve the same problem, but with different philosophies.

## sudo: the widespread standard

**sudo** (_superuser do_) appeared in the early 1990s, created by Bob Coggeshall and Chuck Allen, and today it is maintained by a community team that releases new versions regularly. Its model is permissive: by default it asks for your password and logs every use in detailed logs.

### Philosophy and features

- **Fine granularity:** you can allow specific commands or groups of commands, even with limited arguments.
- **Extensible modules:** supports PAM, LDAP, integration with external authentication systems.
- **Detailed logging:** every invocation is written to `/var/log/secure` or `/var/log/auth.log`.
- **Flexible configuration:** the `/etc/sudoers` file allows regular expressions, aliases, host restrictions, schedules, and more.
- **Secure console:** uses `pwfeedback` (optional) and protections against terminal injection.

The downside is its complexity: `/etc/sudoers` can become hard to maintain, and syntax errors can leave the system without root access if you do not validate with `visudo` first.

| Fact          | Detail                                 |
| ------------- | -------------------------------------- |
| Origin        | Early 1990s (Coggeshall and Allen)     |
| Maintenance   | Community team (The Sudo Project)      |
| First version | 1985                                   |
| Latest stable | 1.9.15 (January 2025)                  |
| Documentation | <https://www.sudo.ws/docs/>            |
| Code          | <https://github.com/sudo-project/sudo> |
| License       | ISC                                    |

### Installation on Arch

```bash
sudo pacman -S sudo
```

Arch comes with `sudo` installed by default, but disabled until you assign privileges.

### Basic configuration

**1. Enable the wheel group.** Uncomment this line in `/etc/sudoers` (ALWAYS edit with `visudo`):

```conf
# /etc/sudoers
%wheel ALL=(ALL:ALL) ALL
```

**2. Add the user to the wheel group.**

```bash
sudo usermod -aG wheel your_user
```

**3. Verify.** Log out and back in, or run:

```bash
groups your_user
sudo -l  # Lists your current permissions
```

### Advanced /etc/sudoers syntax

```conf
# Alias for commands
Cmnd_Alias SOFTWARE = /usr/bin/pacman, /usr/bin/pacman-opt, /usr/bin/pamac

# Specific user, without asking for a password (dangerous)
alice ALL=(ALL) NOPASSWD: ALL

# Group with a command restriction
%administrators ALL=(ALL) SOFTWARE

# Restriction by host
bob SERVER1=(ALL) ALL

# Ask for the password every time
Defaults timestamp_timeout=0

# Visual feedback when typing the password
Defaults pwfeedback
```

**IMPORTANT:** Never edit `/etc/sudoers` directly. Always use `visudo`:

```bash
sudo visudo
```

If there are syntax errors, `visudo` will warn you and refuse to save the file. This prevents lockouts caused by human errors.

## doas: the minimalist alternative

**doas** (_do as_) was born in OpenBSD 5.7 (May 2015) as a replacement for `sudo`. The reason was philosophical: the author Theo de Raadt wanted a tool that did one thing and did it correctly, in under 700 lines of code.

The premise is simple: **smaller attack surface**. While `sudo` has thousands of lines and multiple modes of operation, `doas` does exactly what its name says: run a command as another user. Nothing more.

### Philosophy and features

- **Minimal code:** under 700 lines of C code.
- **Simple configuration:** a single flat file, `/etc/doas.conf`, with no complex syntax.
- **Fewer dependencies:** does not require PAM by default (though it supports it).
- **Lightweight performance:** almost instant startup.
- **Transparency:** easy to audit and verify.

The limitations are the same: less flexibility than `sudo`, no extensible modules, no LDAP integration, no native advanced logging.

| Fact          | Detail                                                     |
| ------------- | ---------------------------------------------------------- |
| Origin        | OpenBSD 5.7, May 2015                                      |
| Author        | Theo de Raadt                                              |
| Lines of code | ≈700                                                       |
| Documentation | <https://man.openbsd.org/doas>                             |
| Code          | <https://cvsweb.openbsd.org/cgi-bin/cvsweb/src/sbin/doas/> |
| License       | ISC                                                        |

### Installation on Arch

```bash
sudo pacman -S doas
```

### Basic configuration

**1. Create `/etc/doas.conf`.** Extremely simple syntax:

```conf
# /etc/doas.conf

# Let the wheel group run everything without a password
permit persist :wheel

# Let alice run everything WITH a password
permit alice

# Let bob run ONLY pacman without a password
permit nopass bob as root cmd /usr/bin/pacman

# Explicitly deny carol (rules are evaluated in order)
deny carol
```

**2. Verify.**

```bash
doas -l  # Lists your permissions
doas ls /root  # Execution test
```

### Syntax differences between sudo and doas

| Feature             | sudo                   | doas                              |
| ------------------- | ---------------------- | --------------------------------- |
| Config file         | `/etc/sudoers`         | `/etc/doas.conf`                  |
| Safe editor         | `visudo`               | Any editor (no native validation) |
| Ask for password    | `NOPASSWD:`            | `nopass`                          |
| Persist credentials | `timestamp_timeout`    | `persist`                         |
| Specify user        | `as username`          | `as username`                     |
| Restrict command    | `cmd /path/to/command` | `cmd /path/to/command`            |
| Groups              | `%groupname`           | `:groupname`                      |

**Note:** `doas.conf` has no automatic validation. If you make a syntax error, the file simply will not work. Make backups before editing.

## Security and best practices

Both tools require conscious configuration. Common mistakes:

1. **Excessive `NOPASSWD`:** giving passwordless permissions to all users is insecure.
2. **Unrestricted full access:** allowing `ALL` to a non-technical user increases risks.
3. **Ignoring logs:** periodically reviewing `/var/log/auth.log` helps detect intrusions.

### Recommended rules

- **Principle of least privilege:** grant only the commands you need, not everything.
- **Use groups:** manage permissions by group, not by individual user.
- **Enable logging:** make sure attempts are recorded.
- **Restrict by schedule or IP:** if your tool allows it, add further restrictions.
- **Review periodically:** run semiannual audits of who has which privileges.

## Head-to-head comparison

| Aspect       | sudo                           | doas                            |
| ------------ | ------------------------------ | ------------------------------- |
| Maturity     | 30+ years, widely used         | ~10 years, niche                |
| Complexity   | High (complex syntax)          | Low (simple flat file)          |
| Flexibility  | Very high (LDAP, PAM, modules) | Low (works for the basics)      |
| Auditing     | Hard (large codebase)          | Easy (<700 lines)               |
| Performance  | Slightly slower                | Very fast                       |
| Logging      | Detailed, integrated           | Basic, requires external syslog |
| Availability | All distributions              | OpenBSD, Arch, some Linux       |

## Installation on Artix and Obarun

On systems without `systemd`, the process is identical, but the logging service may vary.

```bash
# sudo
sudo pacman -S sudo
sudo visudo

# doas
sudo pacman -S doas
sudo nano /etc/doas.conf
```

Both work with any init (OpenRC, runit, s6, dinit) because they do not depend on `systemd`.
