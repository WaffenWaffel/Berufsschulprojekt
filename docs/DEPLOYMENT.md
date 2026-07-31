# Deployment auf einen eigenen Server

Anleitung, um die Biogas-Verwaltung auf einem gemieteten Linux-Server
produktiv zu betreiben. Getestet mit Ubuntu 24.04 LTS.

---

## ⚠️ Vorher lesen: Die Anwendung hat keine Zugriffskontrolle

Aktuell kann **jeder, der die Adresse kennt**, alle Kundendaten lesen, ändern
und löschen — Namen, Anschriften, Liefermengen. Es gibt keine Anmeldung, keine
Benutzerverwaltung, keinen Schutz.

Solange das so ist, gilt:

- **Nicht mit echten Kundendaten ins offene Internet stellen.** Es handelt sich
  um personenbezogene Daten. Ohne Zugriffsschutz ist das ein Verstoß gegen
  Art. 32 DSGVO (Sicherheit der Verarbeitung), und im Ernstfall haftet der
  Betrieb, nicht der Entwickler.
- Zum Ausprobieren mit **Testdaten** ist ein öffentlicher Server unproblematisch.

Drei Wege, das zu lösen — in aufsteigendem Aufwand:

| Weg | Aufwand | Eignung |
| --- | --- | --- |
| **Basic Auth im Reverse Proxy** | ~10 Minuten | Ein gemeinsames Passwort für alle. Für einen Familienbetrieb mit zwei Nutzern völlig ausreichend. In dieser Anleitung enthalten. |
| **Nur im Heimnetz / per VPN** | ~30 Minuten | Server gar nicht öffentlich, Zugriff über WireGuard oder Tailscale. Sicherste Variante. |
| **Richtige Anmeldung in der App** | ~1 Tag | Benutzertabelle, Passwort-Hashing, Sessions. Nur nötig, wenn mehrere Personen unterscheidbar sein sollen. |

Diese Anleitung richtet **Basic Auth** ein. Damit ist die Anwendung nicht mehr
frei zugänglich. Für den Schulbetrieb und einen kleinen Hof reicht das.

---

## 1. Welcher Server?

**Empfehlung: Hetzner Cloud CX22** — 2 vCPU, 4 GB RAM, 40 GB SSD, 20 TB
Traffic, ca. **4,51 €/Monat**, Standort Nürnberg oder Falkenstein.

Warum diese Größe:

- **4 GB RAM sind nötig, nicht optional.** Die Lieferschein-PDFs entstehen über
  Puppeteer, das dafür einen kompletten Chromium startet. Der belegt beim
  Rendern schnell 500 MB bis 1 GB. Zusammen mit PostgreSQL und Node wird es
  bei 2 GB eng.
- 40 GB Festplatte sind reichlich: `node_modules` samt Chromium liegt bei
  etwa 1 GB, die Datenbank wächst bei ein paar tausend Abgaben im Bereich
  weniger Megabyte.

**Wichtig: x86 wählen, nicht ARM.** Die günstigen CAX-Server (ARM) sind
verlockend, aber Puppeteer liefert für ARM64-Linux kein Chrome mit — dort
erscheint `The chromium binary is not available for arm64`. Man kann das mit
einem systemweiten Chromium umgehen, handelt sich aber Extraarbeit und eine
Fehlerquelle ein. Für den Preisunterschied lohnt das nicht.

**Alternativen:** IONOS und netcup liegen preislich ähnlich und sind ebenfalls
deutsche Anbieter. Ein Standort in Deutschland ist bei personenbezogenen Daten
das einfachste Argument gegenüber der DSGVO — Auftragsverarbeitungsvertrag
(AVV) trotzdem abschließen, das geht bei Hetzner online im Kundenkonto.

> Preise Stand Juli 2026. Hetzner hat zum 15. Juni 2026 die Preise angepasst
> (CPX und CCX deutlich stärker als CX). Vor der Bestellung aktuell prüfen.

---

## 2. Was am Projekt bereits angepasst wurde

Damit die Anwendung überhaupt produktiv laufen kann, wurde Folgendes geändert.
Zum Nachvollziehen, nicht zum Nachbauen — es ist schon im Repository:

| Was | Warum |
| --- | --- |
| `Server/src/index.ts` liefert `Client/dist` aus | In der Entwicklung übernimmt Vite das Frontend. In Produktion gibt es keinen Vite-Prozess mehr; ohne diese Zeilen wäre nur die API erreichbar und die Oberfläche gar nicht. |
| SPA-Fallback, aber JSON-404 für `/api/*` | Unbekannte Unterseiten sollen die App laden, unbekannte API-Pfade aber einen ehrlichen Fehler liefern statt HTML. |
| `app.set('trust proxy', 1)` | Hinter dem Reverse Proxy steht die echte Besucher-IP im Header. |
| `Server`: neue Skripte `build` und `start` | Es gab **kein** `start`-Skript — der Startbefehl im Hauptordner zeigte ins Leere. |
| Hauptordner: `start` und `build` korrigiert | Verwies auf `server` statt `Server` (auf Linux ein Unterschied) und baute nur den Client. |
| `prisma` von `devDependencies` nach `dependencies` | Auf dem Server werden Migrationen ausgeführt. Bei einer Installation ohne Entwicklungspakete wäre das Werkzeug sonst nicht vorhanden. |
| `skipLibCheck` in `Server/tsconfig.json` | Der Build brach an einem Fehler in einem Fremdpaket ab und lieferte Exit-Code 2 — jedes Deployment-Skript wäre daran gescheitert. |
| Seitentitel und `lang="de"` in `Client/index.html` | Der Browser-Tab hieß „Client". Zusätzlich `noindex`, damit die Seite nicht in Suchmaschinen landet. |

---

## 3. Schritt für Schritt

### 3.1 Server bestellen

1. Konto bei [Hetzner Cloud](https://console.hetzner.cloud) anlegen
2. Neues Projekt → **Server erstellen**
3. Standort **Nürnberg** oder **Falkenstein**
4. Image **Ubuntu 24.04**
5. Typ **CX22** (unter „Shared vCPU", x86)
6. **SSH-Key hinterlegen** statt Passwort. Falls noch keiner vorhanden, auf dem
   eigenen Rechner erzeugen:
   ```powershell
   ssh-keygen -t ed25519 -C "biogas-server"
   type $env:USERPROFILE\.ssh\id_ed25519.pub
   ```
   Den ausgegebenen Text bei Hetzner einfügen.
7. Erstellen. Notiere die IPv4-Adresse.

### 3.2 Erstzugang und Grundabsicherung

```bash
ssh root@DEINE-SERVER-IP
```

System aktualisieren und einen Benutzer ohne Root-Rechte anlegen — als `root`
zu arbeiten ist unnötig riskant:

```bash
apt update && apt upgrade -y
adduser --disabled-password --gecos "" biogas
usermod -aG sudo biogas
rsync --archive --chown=biogas:biogas ~/.ssh /home/biogas
```

Passwort-Anmeldung abschalten (nur noch SSH-Key):

```bash
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

> Vor dem Abmelden in einem **zweiten Terminal** prüfen, dass
> `ssh biogas@SERVER-IP` funktioniert. Sonst sperrst du dich aus.

Firewall — nur SSH und Web:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

Sicherheitsupdates automatisch einspielen:

```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

Etwas Auslagerungsspeicher als Sicherheitsnetz — Chromium kann beim
PDF-Erzeugen Spitzen verursachen:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Ab hier als `biogas` weiterarbeiten:

```bash
exit
ssh biogas@DEINE-SERVER-IP
```

### 3.3 Node.js, PostgreSQL und Chromium-Bibliotheken

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs postgresql git
node -v    # sollte v22.x zeigen
```

Puppeteer lädt seinen Chromium beim Installieren selbst herunter, die
Systembibliotheken fehlen auf einem frischen Server aber:

```bash
sudo apt install -y \
  libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2t64 libpango-1.0-0 libcairo2 fonts-liberation
```

> Die Endung `t64` bei einigen Paketen ist kein Tippfehler. Ubuntu 24.04 hat
> viele Bibliotheken im Zuge der 64-Bit-Zeitstempel-Umstellung umbenannt.
> Anleitungen für ältere Ubuntu-Versionen nennen `libatk1.0-0` ohne `t64` —
> das gibt es hier nicht mehr.

### 3.4 Datenbank anlegen

```bash
sudo -u postgres psql
```

Im psql-Prompt — **Passwort ersetzen**:

```sql
CREATE DATABASE biogas;
CREATE USER biogas WITH ENCRYPTED PASSWORD 'HIER-EIN-LANGES-ZUFALLSPASSWORT';
GRANT ALL PRIVILEGES ON DATABASE biogas TO biogas;
\c biogas
GRANT ALL ON SCHEMA public TO biogas;
\q
```

Passwort erzeugen mit:

```bash
openssl rand -hex 24
```

> Bewusst `-hex` und nicht `-base64`: Base64 enthält `+`, `/` und `=`. Ein `/`
> im Passwort zerlegt die Verbindungs-URL
> `postgresql://benutzer:passwort@host/datenbank` an der falschen Stelle und du
> suchst den Fehler lange. Hex enthält nur `0-9a-f` und ist überall gefahrlos.

PostgreSQL lauscht standardmäßig nur lokal — genau richtig, die Datenbank soll
nicht aus dem Internet erreichbar sein.

### 3.5 Projekt einrichten

```bash
sudo mkdir -p /opt/biogas && sudo chown biogas:biogas /opt/biogas
git clone https://github.com/WaffenWaffel/Berufsschulprojekt.git /opt/biogas
cd /opt/biogas
```

Zugangsdaten hinterlegen:

```bash
cat > Server/.env <<'EOF'
DATABASE_URL=postgresql://biogas:DEIN-PASSWORT@localhost:5432/biogas
NODE_ENV=production
PORT=3001
EOF
chmod 600 Server/.env
```

> Bewusst ohne Anführungszeichen. Dieselbe Datei wird später von systemd als
> `EnvironmentFile` gelesen, und dessen Zitierregeln haben Eigenheiten. Ohne
> Anführungszeichen verhalten sich beide gleich — geprüft mit `dotenv`, das
> mit und ohne funktioniert.

Installieren, Datenbank aufbauen, bauen:

```bash
npm install
npm install --prefix Client
npm install --prefix Server
npm run db:migrate --prefix Server
npm run build
```

Der Build dauert ein paar Minuten. Kurz testen:

```bash
npm start
```

Läuft `🚀 Server läuft auf Port 3001`, in einem zweiten Terminal prüfen:

```bash
curl -s localhost:3001/api/getCustomer
curl -s -o /dev/null -w "%{http_code}\n" localhost:3001/
```

Beides sollte antworten (`200`). Danach mit `Strg+C` beenden.

### 3.6 Als Dienst einrichten

Damit die Anwendung nach einem Neustart automatisch wieder läuft:

```bash
sudo tee /etc/systemd/system/biogas.service > /dev/null <<'EOF'
[Unit]
Description=Biogas-Verwaltung
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=biogas
WorkingDirectory=/opt/biogas/Server
EnvironmentFile=/opt/biogas/Server/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5

# Etwas Abschottung
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now biogas
sudo systemctl status biogas
```

Logs ansehen:

```bash
journalctl -u biogas -f
```

### 3.7 Domain, HTTPS und Passwortschutz

Ohne eigene Domain geht auch die IP-Adresse, dann aber ohne gültiges
HTTPS-Zertifikat. Eine `.de`-Domain kostet wenige Euro im Jahr und ist die
Mühe wert.

**DNS:** Beim Domain-Anbieter einen A-Record anlegen, der auf die Server-IP
zeigt, z.B. `biogas.deine-domain.de → 203.0.113.42`.

**Caddy** installieren — kümmert sich selbst um Let's-Encrypt-Zertifikate und
deren Verlängerung:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Passwort-Hash für die Anmeldung erzeugen:

```bash
caddy hash-password
```

Passwort eingeben, den ausgegebenen Hash (beginnt mit `$2a$`) kopieren.

```bash
sudo tee /etc/caddy/Caddyfile > /dev/null <<'EOF'
biogas.deine-domain.de {
    basic_auth {
        hof HIER-DEN-HASH-EINFUEGEN
    }
    reverse_proxy localhost:3001
    encode gzip
}
EOF

sudo systemctl reload caddy
```

`hof` ist der Benutzername, frei wählbar. Caddy holt beim ersten Aufruf
automatisch ein Zertifikat.

Fertig — die Anwendung ist unter `https://biogas.deine-domain.de` erreichbar
und fragt nach Benutzername und Passwort.

---

## 4. Updates einspielen

```bash
cd /opt/biogas
git pull
npm install --prefix Client
npm install --prefix Server
npm run db:migrate --prefix Server
npm run build
sudo systemctl restart biogas
```

`db:migrate` ist nur nötig, wenn sich `Server/prisma/schema.prisma` geändert
hat — es schadet aber nie, den Befehl mitlaufen zu lassen. Er tut nichts, wenn
keine neuen Migrationen vorliegen.

Als Skript unter `/opt/biogas/deploy.sh`:

```bash
#!/usr/bin/env bash
set -e
cd /opt/biogas
git pull
npm install --prefix Client
npm install --prefix Server
npm run db:migrate --prefix Server
npm run build
sudo systemctl restart biogas
echo "Fertig. Status:"
sudo systemctl is-active biogas
```

Ausführbar machen mit `chmod +x deploy.sh`.

---

## 5. Backups

**Ohne Backup keine Produktivdaten.** Ein Server kann jederzeit ausfallen, und
gelöschte Kundendaten sind weg.

Tägliche Datenbanksicherung:

```bash
sudo mkdir -p /var/backups/biogas && sudo chown biogas:biogas /var/backups/biogas

cat > /opt/biogas/backup.sh <<'EOF'
#!/usr/bin/env bash
set -e
DATUM=$(date +%F)
pg_dump "postgresql://biogas:DEIN-PASSWORT@localhost:5432/biogas" \
  | gzip > "/var/backups/biogas/biogas-$DATUM.sql.gz"
# älter als 30 Tage entfernen
find /var/backups/biogas -name 'biogas-*.sql.gz' -mtime +30 -delete
EOF
chmod 700 /opt/biogas/backup.sh
```

Täglich um 3 Uhr ausführen:

```bash
crontab -e
# folgende Zeile einfügen:
0 3 * * * /opt/biogas/backup.sh
```

Zusätzlich bei Hetzner die **automatischen Backups** aktivieren (ca. 20 % des
Serverpreises, also rund 1 € im Monat). Die sichern die ganze Maschine, nicht
nur die Datenbank.

Eine Sicherung, die nie zurückgespielt wurde, ist keine Sicherung — einmal
testen:

```bash
gunzip -c /var/backups/biogas/biogas-2026-07-31.sql.gz | head -30
```

Wiederherstellen im Ernstfall:

```bash
gunzip -c BACKUPDATEI.sql.gz | psql "postgresql://biogas:PASSWORT@localhost:5432/biogas"
```

---

## 6. Was sonst wichtig ist

**Die `.env` gehört nicht ins Repository.** Sie steht in `.gitignore` und wird
auf dem Server von Hand angelegt. Kommt das Datenbankpasswort versehentlich in
einen Commit, ist es dauerhaft in der Git-Historie — dann muss es geändert
werden, Löschen der Datei reicht nicht.

**PDF-Erzeugung ist der schwerste Vorgang.** Jeder Lieferschein startet einen
Chromium. Bei mehreren gleichzeitigen Anfragen kann der Speicher knapp werden.
Falls das auftritt, zeigt `journalctl -u biogas` Abbrüche und im Systemlog
steht `Out of memory`. Der Auslagerungsspeicher aus Schritt 3.2 fängt Spitzen
ab; dauerhaft hilft nur ein größerer Server.

**Zeitzone des Servers.** Datumsangaben werden bewusst als reines Kalenderdatum
in UTC gespeichert, deshalb ist die Serverzeitzone unkritisch. Für lesbare
Logs trotzdem sinnvoll: `sudo timedatectl set-timezone Europe/Berlin`.

**Die Datenbank ist nicht von außen erreichbar** — und das soll so bleiben.
PostgreSQL lauscht nur auf `localhost`, die Firewall lässt nur 22, 80 und 443
durch. Für einen Blick in die Daten von deinem Rechner aus nutze einen
SSH-Tunnel statt die Datenbank zu öffnen:

```powershell
ssh -L 5432:localhost:5432 biogas@SERVER-IP
```

Danach erreichst du sie lokal unter `localhost:5432`.

**Kein Testbetrieb auf dem Produktivserver.** Der Import per
`npm run import-csv` und `prisma studio` verändern echte Daten. Zum
Ausprobieren die lokale Entwicklungsumgebung nutzen.

**Was noch fehlt**, wenn das Ganze länger laufen soll:

- Eine richtige Anmeldung in der Anwendung statt Basic Auth, sobald mehrere
  Personen unterscheidbar sein müssen
- Protokollierung, wer wann etwas geändert hat
- Überwachung, die meldet, wenn der Dienst steht (z.B. Uptime Kuma)
