/**
 * Benutzerkonten verwalten.
 *
 * Bewusst ein Skript und kein Endpunkt: Es gibt keine Selbstregistrierung.
 * Den ersten Inhaber je Betrieb legt der Administrator hier an, weitere
 * Konten kann der Inhaber später in der Anwendung anlegen.
 *
 *   npm run benutzer:liste --prefix Server
 *   npm run benutzer:neu   --prefix Server -- <BetriebId> "email@hof.de" "Vorname Nachname" [INHABER|MITARBEITER]
 *   npm run benutzer:passwort --prefix Server -- "email@hof.de"
 */
import 'dotenv/config';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { passwortHashen } from '../lib/passwort';

/** Gut vorlesbares Startpasswort - der Benutzer muss es ohnehin ändern. */
function startpasswortErzeugen(): string {
    // Ohne leicht verwechselbare Zeichen (0/O, 1/l/I)
    const zeichen = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(20);
    return Array.from(bytes, (b) => zeichen[b % zeichen.length]).join('');
}

async function liste() {
    const benutzer = await prisma.benutzer.findMany({
        orderBy: [{ betriebId: 'asc' }, { name: 'asc' }],
        include: { betrieb: { select: { name: true } } },
    });

    if (benutzer.length === 0) {
        console.log('Noch kein Benutzer angelegt.\n' +
            'Anlegen mit: npm run benutzer:neu -- <BetriebId> "email@hof.de" "Name" INHABER');
        return;
    }

    console.log('\nBenutzerkonten:\n');
    let letzterBetrieb = -1;
    for (const b of benutzer) {
        if (b.betriebId !== letzterBetrieb) {
            console.log(`  Betrieb ${b.betriebId} — ${b.betrieb.name}`);
            letzterBetrieb = b.betriebId;
        }
        const zusatz = [
            b.rolle === 'INHABER' ? 'Inhaber' : 'Mitarbeiter',
            b.aktiv ? null : 'gesperrt',
            b.passwortWechseln ? 'Passwortwechsel offen' : null,
        ].filter(Boolean).join(', ');
        console.log(`    ${b.email.padEnd(28)} ${b.name.padEnd(22)} (${zusatz})`);
    }
    console.log();
}

async function neu(argumente: string[]) {
    const [betriebIdRoh, email, name, rolleRoh] = argumente;
    const betriebId = Number(betriebIdRoh);
    const rolle = (rolleRoh || 'MITARBEITER').toUpperCase();

    if (!Number.isInteger(betriebId) || !email || !name) {
        console.error(
            'Zu wenige Angaben.\n\n' +
            '  npm run benutzer:neu -- <BetriebId> "email@hof.de" "Vorname Nachname" [INHABER|MITARBEITER]\n\n' +
            'Betriebe anzeigen: npm run betrieb:liste\n'
        );
        process.exitCode = 1;
        return;
    }
    if (rolle !== 'INHABER' && rolle !== 'MITARBEITER') {
        console.error(`Unbekannte Rolle "${rolleRoh}". Erlaubt: INHABER, MITARBEITER`);
        process.exitCode = 1;
        return;
    }

    const betrieb = await prisma.betrieb.findUnique({ where: { id: betriebId } });
    if (!betrieb) {
        console.error(`Betrieb mit der ID ${betriebId} existiert nicht. Anzeigen mit: npm run betrieb:liste`);
        process.exitCode = 1;
        return;
    }

    const passwort = startpasswortErzeugen();
    const benutzer = await prisma.benutzer.create({
        data: {
            betriebId,
            email: email.toLowerCase(),
            name,
            rolle: rolle as 'INHABER' | 'MITARBEITER',
            passwortHash: await passwortHashen(passwort),
            passwortWechseln: true,
        },
    });

    console.log(`\n✓ Benutzer angelegt für ${betrieb.name}\n`);
    console.log(`  E-Mail:         ${benutzer.email}`);
    console.log(`  Startpasswort:  ${passwort}`);
    console.log(`  Rolle:          ${benutzer.rolle}\n`);
    console.log('Das Passwort wird nur jetzt angezeigt und muss beim ersten Anmelden geändert werden.\n');
}

async function passwortZuruecksetzen(argumente: string[]) {
    const [email] = argumente;
    if (!email) {
        console.error('  npm run benutzer:passwort -- "email@hof.de"');
        process.exitCode = 1;
        return;
    }

    const benutzer = await prisma.benutzer.findFirst({ where: { email: email.toLowerCase() } });
    if (!benutzer) {
        console.error(`Kein Benutzer mit der E-Mail ${email}.`);
        process.exitCode = 1;
        return;
    }

    const passwort = startpasswortErzeugen();
    await prisma.benutzer.update({
        where: { id: benutzer.id },
        data: { passwortHash: await passwortHashen(passwort), passwortWechseln: true },
    });
    // Offene Sitzungen beenden
    await prisma.sitzung.deleteMany({ where: { benutzerId: benutzer.id } });

    console.log(`\n✓ Neues Startpasswort für ${benutzer.email}: ${passwort}`);
    console.log('  Alle offenen Sitzungen wurden beendet.\n');
}

async function main() {
    const [befehl, ...rest] = process.argv.slice(2);

    if (befehl === 'neu') await neu(rest);
    else if (befehl === 'passwort') await passwortZuruecksetzen(rest);
    else if (befehl === 'liste' || !befehl) await liste();
    else console.error(`Unbekannter Befehl "${befehl}". Erlaubt: liste, neu, passwort`);

    await prisma.$disconnect();
}

main().catch(async (fehler) => {
    console.error('Fehler:', fehler instanceof Error ? fehler.message : fehler);
    await prisma.$disconnect();
    process.exit(1);
});
