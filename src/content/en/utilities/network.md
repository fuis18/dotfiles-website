---
title: "Network"
description: "Networking: management layers, iwd, NetworkManager, dhcpcd and DNS resolution."
category: utilities
tags: ["iwd", "dhcpcd", "impala", "knot-resolver", "nextdns"]
---

Connecting a machine to the Internet seems like a single action, but it is actually four distinct links: joining the physical network (Wi-Fi or cable), obtaining an IP address, translating names to addresses, and deciding who sees your DNS queries. Each piece on this page solves one of those links, and the right choice depends on how simple you want the system to be.

| Layer                       | Technology                      |
| --------------------------- | ------------------------------- |
| User tools                  | iwctl / impala / nmtui / nmcli  |
| Connection manager (policy) | NetworkManager / ConnMan        |
| Link-layer daemon           | iwd (Wi-Fi) / kernel (ethernet) |
| DHCP client                 | dhcpcd / built-in client        |
| Kernel                      | nl80211, drivers                |

## iwd: the Wi-Fi daemon

For years the Wi-Fi protocol on Linux was handled by `wpa_supplicant`, a daemon that tries to abstract over every operating system and every wireless extension, including many that nobody uses. The result is large, hard to configure, and uncommunicative: it remembers nothing between connections, exposes very little information, and presents itself to user space in several different ways. In response, an Intel team led by Marcel Holtmann (BlueZ maintainer) and Denis Kenzior developed **iwd** (_iNet Wireless Daemon_) to replace it. It declared its D-Bus interfaces stable with version 1.0, at the Open Source Summit Europe 2018.

Its design aims for the minimum of resources:

- **No external dependencies:** it only needs the kernel and the C library, and takes advantage of what the kernel already offers (nl80211, cryptography).
- **Remembers networks:** it stores profiles of known networks and reuses them, something `wpa_supplicant` does not do on its own.
- **Built-in network client:** it can obtain its IP address and configure DNS on its own, without another program, if the corresponding option is enabled.
- **Its own command-line tool:** `iwctl`, the same one you used during installation (see [Install Media](../../iso/install-media/)).

iwd solves Wi-Fi, but only Wi-Fi. If tomorrow you need a VPN, mobile connections, or bridges between interfaces, you will need something higher up.

| Fact          | Detail                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| Origin        | Intel (development since 2013; version 1.0 in 2018)                      |
| Authors       | Marcel Holtmann, Denis Kenzior, Andrew Zaborowski, and others            |
| Coverage      | Wi-Fi (and 802.1X on wired with its helper daemon)                       |
| Dependencies  | Only kernel and libc                                                     |
| Documentation | <https://iwd.wiki.kernel.org> and <https://wiki.archlinux.org/title/Iwd> |
| Code          | <https://git.kernel.org/pub/scm/network/wireless/iwd.git>                |

**Minimal installation (standalone Wi-Fi).** This is the lightest stack: just iwd doing everything, with no managers on top. It is used on servers, minimal machines, or when you know your network is not going to change.

```bash
sudo pacman -S iwd
sudo systemctl enable --now iwd
```

For iwd to also manage IP and DNS, create `/etc/iwd/main.conf`:

```ini
[General]
EnableNetworkConfiguration=true

[Network]
NameResolvingService=resolvconf
```

Daily use with `iwctl`:

```bash
iwctl station wlan0 scan
iwctl station wlan0 get-networks
iwctl station wlan0 connect "Your_wifi"
iwctl known-networks list
```

**Impala: a modern TUI for iwd.** If `iwctl` feels dry to you, **Impala** is a terminal UI written in Rust that talks directly to iwd:

- A friendly visual interface for scanning, connecting, and managing known networks.
- It is not a daemon: it requires iwd to be running.
- **Conflicts with NetworkManager:** do not use both at the same time for the same interface.

```bash
# On Arch
sudo pacman -S impala

# Usage
impala
```

See the [official documentation](https://github.com/pythops/impala) for details and compatibility.

## NetworkManager: the upper layer

A real laptop hops between Wi-Fi, cable, VPN, and sometimes a mobile modem. That is what **NetworkManager** is for, developed by Red Hat since 2004: a manager that unifies all those connection types with terminal tools (`nmcli`, `nmtui`) and graphical applets. NetworkManager can use iwd as its Wi-Fi engine instead of `wpa_supplicant`, getting the best of both: the simplicity of iwd below and the versatility of NM on top.

NetworkManager adds four things that iwd alone does not have:

1. **Total abstraction**: it unifies Wi-Fi, Ethernet, VPN, mobile modems, bridges, and VLANs into a single API (D-Bus).
2. **Portable profiles**: it remembers multiple networks with different policies (autoconnect, priority, DNS rules).
3. **Automatic service activation**: it integrates with `polkit` for permissions and launches related services on connect (for example, mounting SMB).
4. **Consistent graphical interface**: the same applet works on GNOME, KDE, XFCE, etc., without adaptations.

The golden rule: **use iwd as NetworkManager's backend, not as a standalone service**. If you enable both managing the same interface, they will step on each other.

| Fact          | NetworkManager                                                   |
| ------------- | ---------------------------------------------------------------- |
| Origin        | Red Hat (since 2004)                                             |
| Authors       | The Red Hat team and community (Dan Williams as original author) |
| Coverage      | Wi-Fi, Ethernet, VPN, mobile modem, bridges, VLANs               |
| Dependencies  | Very many (D-Bus, polkit, network libraries)                     |
| Documentation | <https://networkmanager.dev>                                     |
| Code          | <https://gitlab.freedesktop.org/NetworkManager/NetworkManager>   |

**Installation with iwd as the engine.** In this case do **not** enable `EnableNetworkConfiguration` in iwd: NetworkManager will take control of IP and DNS. Configure the backend:

```ini
# /etc/NetworkManager/conf.d/wifi_backend.conf
[device]
wifi.backend=iwd
```

```bash
sudo pacman -S networkmanager iwd
sudo systemctl enable --now NetworkManager
# Do not enable iwd manually: NetworkManager will bring it up if it needs it
nmtui
```

On Artix and Obarun the services are installed with your init's service package (`iwd-<init>`, `networkmanager-<init>`; see [PID](../../iso/pid/)).

## dhcpcd: standalone DHCP client

With the Wi-Fi link established, an IP address is still missing, which is obtained via DHCP. iwd ships its own client, but it is designed only for Wi-Fi. For a wired Ethernet cable, or for whoever prefers another program to handle it, a standalone DHCP client is needed. The historical one was ISC's `dhclient`, flexible but heavy, and today discontinued by its authors.

**dhcpcd** was born at Phystech, written by Yoichi Hariguchi and Sergei Viznyuk. Roy Marples took over its maintenance in 2004, at Gentoo, and rebuilt it with a much smaller code base, which uses netlink on Linux; version 4 (2008) made it into NetBSD's base system. Today it is a full DHCP client that also implements DHCPv6, BOOTP, IPv6 router solicitations, and privacy extensions, and it integrates with `openresolv` (by the same author) to update `/etc/resolv.conf`.

As a rule, **you must choose a single owner of the IP address per interface**: iwd's client, dhcpcd, or NetworkManager. If you use dhcpcd with iwd, leave `EnableNetworkConfiguration` disabled in iwd.

| Fact          | Detail                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| Origin        | Phystech (Yoichi Hariguchi and Sergei Viznyuk); maintained by Roy Marples since 2004     |
| Milestones    | dhcpcd 4 (2008) in NetBSD's base; DHCPv6 in 2012                                         |
| License       | BSD-2-Clause                                                                             |
| Documentation | <https://roy.marples.name/projects/dhcpcd> and <https://wiki.archlinux.org/title/Dhcpcd> |
| Code          | <https://github.com/NetworkConfiguration/dhcpcd>                                         |

**Installation.**

```bash
sudo pacman -S dhcpcd

# For all interfaces
sudo systemctl enable --now dhcpcd

# Or only for a specific interface (wired)
sudo systemctl enable --now dhcpcd@enp3s0.service
```

**iwd + dhcpcd combination.** If you do not want NetworkManager but do want to separate link from DHCP:

```ini
# /etc/iwd/main.conf — iwd only handles the Wi-Fi link
[General]
EnableNetworkConfiguration=false
```

```bash
sudo systemctl enable --now iwd dhcpcd
```

## Knot Resolver

With an IP address you can browse, but only by numbers. Translating names to addresses is done by DNS, and by default you delegate that job to your provider's or your router's DNS server: no cache you control, no validation that the responses are authentic, and they know everything you look up. The solution is a resolver of your own on your machine: a service that asks the authoritative servers itself, caches the responses, and validates them with DNSSEC.

Knot Resolver, developed by CZ.NIC (the `.cz` domain registry), is a full resolver with a cache. Since version 6 it includes a _manager_ written in Python that simplifies its use with declarative YAML configuration and an HTTP API for hot changes. Its strong points:

- **Persistent cache** shared across worker processes, not lost on reboot, with aggressive caching of DNSSEC-validated data (RFC 8198).
- **Privacy and validation included:** support for encrypted DNS (TLS and HTTPS) and DNSSEC validation.
- **Works out of the box:** it starts as a local server with no changes, and its documentation even describes use without `systemd` and without the _manager_, which makes it viable on Artix and Obarun.

For the system to use it, `/etc/resolv.conf` must point at it, and that is what `openresolv` does: a `resolv.conf` manager that, if you give it fixed servers, puts them in place of the ones DHCP delivers.

| Fact          | Detail                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| Origin        | CZ.NIC Labs; version 6 with _manager_ and YAML configuration (6.2.0 in February 2026)    |
| License       | GPL-3.0-or-later                                                                         |
| Documentation | <https://www.knot-resolver.cz/documentation/latest/>                                     |
| Code          | <https://gitlab.nic.cz/knot/knot-resolver> and <https://github.com/CZ-NIC/knot-resolver> |
| openresolv    | <https://wiki.archlinux.org/title/Openresolv>                                            |

**Installation.** If you already ran the installation's `pacstrap`, all that is left is to enable the service and point `resolv.conf` at the local resolver with `openresolv`:

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

A common tweak is the cache size in `/etc/knot-resolver/config.yaml`:

```yaml
cache:
  size-max: 256M
```

## NextDNS

A resolver of your own has a limit: to answer, your Knot Resolver queries the root and authoritative servers in plain text, so your internet provider and any network you pass through still see every name you look up. And nothing blocks ads, trackers, or malicious domains.

NextDNS solves both. It was founded in May 2019 in Delaware by Romain Cointepas and Olivier Poitrey, who worked together at Dailymotion, and it offers encrypted DNS (DNS over TLS and over HTTPS) with configurable filtering per profile: ad and tracker blocklists, malware protection, and parental controls, with logs and analytics that you decide whether to keep. Each profile has a configuration identifier, and the DNS-over-TLS endpoint carries that identifier in the name (`ID.dns.nextdns.io`).

The way to tie it to the previous piece is to let Knot Resolver forward its queries to NextDNS over TLS. That way you keep the local cache and DNSSEC validation, and add encryption and filtering. It is worth knowing that this shifts the trust: your internet provider stops seeing your queries, but NextDNS starts seeing them. If you would rather nobody see them, the recursive resolver from the previous section without forwarding is the alternative, at the cost of having neither encryption nor filtering.

| Fact              | Detail                                                        |
| ----------------- | ------------------------------------------------------------- |
| Foundation        | May 2019, Delaware (NextDNS Inc.)                             |
| Founders          | Romain Cointepas and Olivier Poitrey (Dailymotion executives) |
| Protocols         | DNS over TLS (DoT) and over HTTPS (DoH)                       |
| Documentation     | <https://help.nextdns.io>                                     |
| Website and panel | <https://nextdns.io> and <https://my.nextdns.io>              |
| Client (optional) | <https://github.com/nextdns/nextdns> (MIT license)            |

**Installation.** Create a profile at <https://my.nextdns.io>, copy your identifier (`abc123` in the example), and add the encrypted forwarding to `/etc/knot-resolver/config.yaml`. The addresses and the exact name are in the _Setup_ tab of your panel; confirm them there before applying them:

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

To check that your queries now go through NextDNS, open <https://test.nextdns.io> in the browser.

## Summary of possible combinations

| Use case                   | Recommended stack                                    | Notes                                                    |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Server / fixed machine     | `iwd` + `dhcpcd`                                     | iwd only handles the link; dhcpcd the IP                 |
| Extreme minimalism         | `iwd` standalone (`EnableNetworkConfiguration=true`) | iwd does everything: link + DHCP + DNS                   |
| Home laptop                | `iwd` + `NetworkManager`                             | NM takes control; iwd is only the Wi-Fi backend          |
| Friendly terminal UI       | `impala` + `iwd`                                     | Do not use NetworkManager; Impala is a frontend over iwd |
| Embedded / IoT             | `ConnMan` or `systemd-networkd`                      | Fewer dependencies than NM, ideal for embedded systems   |
| Full graphical environment | `NetworkManager` + DE applet                         | The standard on desktops: KDE Plasma, GNOME, XFCE        |

Final rules:

- **Never enable two connection managers** (iwd, NetworkManager, dhcpcd, ConnMan) on the same interface.
- **Impala needs iwd**: it is not an alternative, it is a frontend.
- **NetworkManager + iwd**: configure the backend in NM, do not enable iwd as a standalone service.
- **dhcpcd and iwd's client**: one or the other per interface, not both.
