/**
 * Betriebe verwalten (Mandanten).
 *
 * Bewusst ein Skript und kein Endpunkt: Betriebe legt ausschließlich der
 * Administrator an, es gibt keine Selbstregistrierung.
 *
 *   npm run betrieb:liste --prefix Server
 *   npm run betrieb:neu   --prefix Server -- "Name" "Straße" "PLZ" "Ort" [UstIdNr] [Ansprechpartner] [Telefon] [E-Mail]
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function liste() {
    const betriebe = await prisma.betrieb.findMany({
        orderBy: { id: 'asc' },
        include: {
            _count: { select: { kunden: true, abgaben: true, lieferscheine: true } },
        },
    });

    if (betriebe.length === 0) {
        console.log('Noch kein Betrieb angelegt. Anlegen mit: npm run betrieb:neu -- "Name" "Straße" "PLZ" "Ort"');
        return;
    }

    console.log('\nAngelegte Betriebe:\n');
    for (const b of betriebe) {
        console.log(`  ID ${b.id}  ${b.name}`);
        console.log(`         ${b.strasse}, ${b.plz} ${b.ort}`);
        console.log(`         ${b._count.kunden} Kunden, ${b._count.abgaben} Abgaben, ${b._count.lieferscheine} Lieferscheine`);
        if (!b.aktiv) console.log('         (inaktiv)');
        console.log();
    }
    console.log('Benutzer zu einem Betrieb anlegen: npm run benutzer:neu -- <BetriebId> "email" "Name" INHABER\n');
}

async function neu(argumente: string[]) {
    const [name, strasse, plz, ort, ustIdNr, ansprechpartner, telefon, email] = argumente;

    if (!name || !strasse || !plz || !ort) {
        console.error(
            'Zu wenige Angaben.\n\n' +
            '  npm run betrieb:neu -- "Name" "Straße" "PLZ" "Ort" [UstIdNr] [Ansprechpartner] [Telefon] [E-Mail]\n\n' +
            'Beispiel:\n' +
            '  npm run betrieb:neu -- "Musterhof GbR" "Dorfstr. 1" "86733" "Alerheim"\n'
        );
        process.exitCode = 1;
        return;
    }

    const betrieb = await prisma.betrieb.create({
        data: {
            name, strasse, plz, ort,
            ustIdNr: ustIdNr || null,
            ansprechpartner: ansprechpartner || null,
            telefon: telefon || null,
            email: email || null,
        },
    });

    console.log(`\n✓ Betrieb angelegt: ${betrieb.name} (ID ${betrieb.id})\n`);
    console.log('Jetzt noch einen Inhaber für diesen Betrieb anlegen:');
    console.log(`  npm run benutzer:neu -- ${betrieb.id} "email@hof.de" "Vorname Nachname" INHABER\n`);
}

async function main() {
    const [befehl, ...rest] = process.argv.slice(2);

    if (befehl === 'neu') await neu(rest);
    else if (befehl === 'liste' || !befehl) await liste();
    else console.error(`Unbekannter Befehl "${befehl}". Erlaubt: liste, neu`);

    await prisma.$disconnect();
}

main().catch(async (fehler) => {
    console.error('Fehler:', fehler instanceof Error ? fehler.message : fehler);
    await prisma.$disconnect();
    process.exit(1);
});
