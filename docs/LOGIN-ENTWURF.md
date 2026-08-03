# Anmeldung — technischer Entwurf

Stand: Entwurf. **Noch nichts davon ist gebaut.**

Die Datenstruktur trennt bereits nach Betrieb (siehe `Betrieb` in
`Server/prisma/schema.prisma`). Was fehlt, ist die Anmeldung, die einen
Benutzer seinem Betrieb zuordnet. Bis dahin kommt der aktive Betrieb aus
`BETRIEB_ID` in `Server/.env` — und die Anwendung ist ungeschützt.

Die drei Oberflächen-Varianten zum Vergleichen liegen als Artifact vor. Dieses
Dokument beschreibt den Unterbau, der unter allen dreien gleich ist.

---

## Entscheidungen, die schon gefallen sind

| Frage | Entscheidung |
| --- | --- |
| Verfahren | Serverseitige Sitzung, Kennung im httpOnly-Cookie |
| Kontenanlage | Nur der Administrator, keine Selbstregistrierung |
| Betriebe | Über `npm run betrieb:neu`, kein Endpunkt |

Warum Sitzung statt JWT: Abmelden wirkt sofort, weil die Sitzung serverseitig
gelöscht wird. Ein JWT bliebe bis zum Ablauf gültig. Da Express das Frontend
ohnehin selbst ausliefert, entfällt auch der Grund, der sonst für JWT spricht
(getrennte Domains).

---

## Datenmodell

```prisma
model Benutzer {
  id           Int       @id @default(autoincrement())
  email        String
  passwortHash String
  name         String
  rolle        Rolle     @default(MITARBEITER)
  aktiv        Boolean   @default(true)
  erstelltAm   DateTime  @default(now())
  letzterLogin DateTime?

  betrieb      Betrieb   @relation(fields: [betriebId], references: [id])
  betriebId    Int

  sitzungen    Sitzung[]

  // E-Mail nur je Betrieb eindeutig - dieselbe Person kann später für zwei
  // Betriebe ein Konto haben, ohne dass das Modell umgebaut werden muss.
  @@unique([betriebId, email])
  @@index([betriebId])
}

enum Rolle {
  INHABER      // pflegt Stammdaten und Benutzerkonten
  MITARBEITER  // erfasst Abgaben, erstellt Lieferscheine
}

model Sitzung {
  id         String   @id             // zufällige Kennung, steht im Cookie
  tokenHash  String                   // Hash des Geheimnisses, nie im Klartext
  benutzer   Benutzer @relation(fields: [benutzerId], references: [id], onDelete: Cascade)
  benutzerId Int
  laeuftAb   DateTime
  erstelltAm DateTime @default(now())
  letzterZugriff DateTime @default(now())

  @@index([benutzerId])
  @@index([laeuftAb])
}
```

**Warum der Token gehasht wird:** Wer Lesezugriff auf die Datenbank bekommt —
etwa über ein Backup — könnte sonst mit den gespeicherten Werten fremde
Sitzungen übernehmen. Gespeichert wird nur der Hash, verglichen wird der Hash
des mitgeschickten Werts.

---

## Passwörter

Argon2id, ersatzweise bcrypt mit mindestens 12 Runden. Das Klartextpasswort
wird nie gespeichert, nie protokolliert und nie in einer Fehlermeldung
zurückgegeben.

Beim Anlegen gilt eine Mindestlänge von 12 Zeichen. Keine erzwungenen
Sonderzeichen — Länge schützt mehr als Zeichenklassen und führt seltener zu
Zetteln am Monitor.

---

## Ablauf

### Anmelden — `POST /api/anmelden`

1. E-Mail und Passwort entgegennehmen
2. Benutzer suchen; Passwort-Hash prüfen
3. Bei Erfolg: Sitzung anlegen, Cookie setzen, Benutzer und Betrieb zurückgeben
4. Bei Misserfolg: **immer dieselbe Meldung**, egal ob die E-Mail unbekannt
   oder das Passwort falsch war. Andernfalls ließe sich herausfinden, welche
   Adressen im System existieren.

Auch bei unbekannter E-Mail wird ein Hash-Vergleich gegen einen Dummy-Wert
ausgeführt. Ohne das verrät die Antwortzeit, ob es das Konto gibt.

### Cookie

```
Name:     sitzung
httpOnly: true        // für JavaScript unsichtbar, schützt bei XSS
secure:   true        // nur über HTTPS (in Entwicklung abschaltbar)
sameSite: lax         // schützt gegen Anfragen von fremden Seiten
maxAge:   12 Stunden
path:     /
```

### Jede weitere Anfrage

Die vorhandene Middleware in `Server/src/lib/betrieb.ts` wird erweitert:

```
Heute:   req.betriebId = Number(process.env.BETRIEB_ID) || 1
Künftig: Sitzung aus dem Cookie laden → Benutzer → req.betriebId = benutzer.betriebId
         zusätzlich req.benutzer für Rollenprüfungen
```

**Das ist der eigentliche Vorteil des jetzigen Aufbaus:** Die rund 15 Abfragen
in `Server/src/routes/guelle.routes.ts` filtern bereits nach `req.betriebId`.
An ihnen ändert sich nichts — nur die Quelle des Werts wechselt.

Ohne gültige Sitzung antwortet die API mit `401`. Ausgenommen sind
`/api/anmelden` und die statischen Dateien des Frontends.

### Abmelden — `POST /api/abmelden`

Sitzung aus der Datenbank löschen, Cookie leeren. Wirkt sofort und auf allen
Geräten, an denen dieselbe Sitzung offen war.

---

## Rollen

| | Inhaber | Mitarbeiter |
| --- | --- | --- |
| Abgaben erfassen, ändern, löschen | ja | ja |
| Lieferscheine erstellen und zurücknehmen | ja | ja |
| Kunden und Analysen pflegen | ja | ja |
| Benutzerkonten anlegen und sperren | ja | nein |
| Betriebsdaten ändern (Briefkopf) | ja | nein |

Zwei Rollen genügen. Feinere Rechte kosten Aufwand und bringen bei zwei bis
fünf Personen je Betrieb nichts.

---

## Was zusätzlich nötig wird

**Fehlversuche bremsen.** Nach fünf Fehlversuchen für dieselbe E-Mail wird die
Anmeldung 15 Minuten gesperrt. Ohne diese Bremse lässt sich ein Passwort
automatisiert durchprobieren.

**Passwort zurücksetzen.** Bewusst ohne E-Mail-Versand: Der Inhaber setzt für
seine Mitarbeiter ein neues Passwort, das beim ersten Anmelden geändert werden
muss. Kein Mailserver, keine Reset-Links, die ablaufen können.

**Erster Zugang.** Ein Skript `npm run benutzer:neu` legt zu einem Betrieb den
ersten Inhaber an — analog zu `betrieb:neu`.

**Abgelaufene Sitzungen aufräumen.** Ein täglicher Lauf, der Sitzungen mit
überschrittenem `laeuftAb` löscht.

---

## Aufwand

| Baustein | Aufwand |
| --- | --- |
| Tabellen, Migration, Anlege-Skript | ½ Tag |
| Anmelden, Abmelden, Sitzungsprüfung | ½ Tag |
| Routen schützen, Middleware umstellen | ¼ Tag |
| Oberfläche Variante A | ¼ Tag |
| Oberfläche Variante B (mehrere Betriebe je Person) | 1 Tag zusätzlich |
| Oberfläche Variante C (PIN, Tablet) | 1 Tag zusätzlich |
| Fehlversuche bremsen, Passwort zurücksetzen, Tests | ½ Tag |

Variante A landet damit bei rund zwei Tagen, B und C bei rund drei.

---

## Wie geprüft wird

Derselbe Trennungstest wie bei der Datenstruktur, nur über Benutzer statt über
zwei Server:

1. Zwei Betriebe mit je einem Benutzer anlegen
2. Als Benutzer A anmelden, Daten abrufen — nur die eigenen erscheinen
3. Mit derselben Sitzung gezielt eine ID aus Betrieb B ändern und löschen →
   muss `404` liefern
4. Ohne Cookie eine geschützte Route aufrufen → `401`
5. Abmelden, dann dieselbe Sitzungskennung erneut verwenden → `401`
6. Sechs Fehlversuche → der sechste wird abgewiesen, auch mit richtigem
   Passwort
