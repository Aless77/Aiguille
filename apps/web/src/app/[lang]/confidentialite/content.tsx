import { type ReactNode } from "react";

import { Link } from "@/lib/i18n/client";
import { type Locale } from "@/lib/i18n/config";

interface PrivacyContent {
  metaTitle: (site: string) => string;
  metaDescription: (site: string) => string;
  breadcrumb: string;
  title: string;
  body: (site: string, repository: string) => ReactNode;
}

const section = "space-y-3";
const h2 = "text-2xl font-semibold tracking-tight";
const link = "underline underline-offset-4";
const list = "list-disc space-y-1 pl-6";

const fr: PrivacyContent = {
  metaTitle: () => "Confidentialité : données personnelles et cookies",
  metaDescription: (site) =>
    `Quelles données ${site} conserve sur les comptes, pourquoi, combien de temps, et comment supprimer votre compte. Aucun traceur publicitaire.`,
  breadcrumb: "Confidentialité",
  title: "Règles de confidentialité",
  body: (site, repository) => (
    <>
      <p className="text-muted-foreground">Dernière mise à jour : 25 octobre 2026.</p>

      <section className={section}>
        <h2 className={h2}>En bref</h2>
        <ul className={list}>
          <li>Consulter le site ne demande aucun compte et ne dépose aucun traceur.</li>
          <li>
            Un compte sert uniquement à donner votre avis sur les montres et à tenir vos listes de
            souhaits.
          </li>
          <li>Nous ne vendons, ne louons ni ne partageons aucune donnée. Aucune publicité.</li>
          <li>Vous pouvez supprimer votre compte vous-même, à tout moment.</li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>Données conservées pour un compte</h2>
        <p>
          La connexion passe par GitHub ou Google : nous ne voyons ni ne stockons jamais votre mot
          de passe. Le service choisi nous transmet, avec votre accord :
        </p>
        <ul className={list}>
          <li>votre nom (ou pseudonyme) et votre photo de profil ;</li>
          <li>
            votre adresse e-mail, pour reconnaître votre compte d&apos;une visite à l&apos;autre ;
          </li>
          <li>un identifiant technique de votre compte chez ce service.</li>
        </ul>
        <p>
          Après la création du compte, nous vous demandons votre pays de provenance (facultatif, «
          Ne pas préciser » possible, modifiable sur la page Mon compte). Seul le pays est
          enregistré, jamais d&apos;adresse : il sert uniquement à compter les visiteurs par pays.
        </p>
        <p>
          Pour chaque session ouverte, nous enregistrons aussi l&apos;adresse IP et le type de
          navigateur, afin de détecter les abus (faux avis, comptes multiples). Vos avis (notes,
          commentaire, propriétaire ou non) sont rattachés à votre compte et affichés publiquement
          avec votre nom et votre photo de profil, sur la fiche de la montre.
        </p>
        <p>
          Vos listes de souhaits (nom, description, montres choisies) sont privées par défaut. Si
          vous choisissez de les partager par lien ou de les publier dans la communauté, elles
          deviennent visibles avec votre nom et votre photo de profil, comme les messages que vous
          laissez sur les listes des autres membres. Vous pouvez aussi publier une liste ou écrire
          anonymement : les autres membres voient alors « Auteur de la liste » ou un pseudonyme
          propre à chaque liste (par exemple « Balancier ambre 27 »), jamais votre nom ni votre
          photo, et ne peuvent pas relier vos messages d&apos;une liste à l&apos;autre. Le message
          reste rattaché à votre compte côté site, pour lutter contre les abus.
        </p>
        <p>
          Nous n&apos;envoyons aucun e-mail et ne demandons aucun accès à vos dépôts GitHub ni à vos
          données Google au-delà de votre profil. La langue choisie n&apos;est pas enregistrée :
          elle figure seulement dans l&apos;adresse de la page.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Pourquoi et sur quelle base</h2>
        <p>
          Ces données servent uniquement à faire fonctionner votre compte et à garantir un seul avis
          par personne et par montre. Base légale : l&apos;exécution du service que vous demandez en
          créant un compte (article 6.1.b du RGPD) et notre intérêt légitime à lutter contre les
          abus (article 6.1.f).
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Durée de conservation</h2>
        <ul className={list}>
          <li>Session : 30 jours au plus, effacée à la déconnexion.</li>
          <li>Compte : tant que vous ne le supprimez pas.</li>
          <li>
            À la suppression du compte, vos données de profil, vos sessions, vos avis, vos listes et
            vos commentaires sont effacés immédiatement. Vous pouvez aussi supprimer un seul avis
            depuis la fiche, une liste depuis « Mes listes » et un commentaire depuis la liste.
          </li>
        </ul>
      </section>

      <section className={section}>
        <h2 className={h2}>Cookies</h2>
        <p>Deux cookies au plus, tous deux nécessaires au service que vous demandez :</p>
        <ul className={list}>
          <li>le cookie de session, déposé uniquement quand vous vous connectez ;</li>
          <li>
            le cookie « theme », déposé uniquement si vous choisissez le thème sombre ou clair, pour
            retenir ce choix pendant un an. Il ne contient que ce choix et n&apos;est jamais lu par
            nos serveurs.
          </li>
        </ul>
        <p>
          Aucun cookie publicitaire, aucune mesure d&apos;audience, aucun bouton de réseau social :
          aucun bandeau de consentement n&apos;est donc nécessaire.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Hébergement</h2>
        <ul className={list}>
          <li>Site : Vercel Inc. (États-Unis), qui sert les pages et traite les requêtes.</li>
          <li>Base de données : Neon, hébergée dans l&apos;Union européenne (Francfort).</li>
          <li>Nom de domaine : Cloudflare.</li>
        </ul>
        <p>
          Les transferts hors de l&apos;Union européenne vers Vercel sont encadrés par le cadre de
          protection des données UE-États-Unis et les clauses contractuelles types de la Commission
          européenne.
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          portabilité et d&apos;opposition. Le plus simple : depuis la page{" "}
          <Link href="/compte" className={link}>
            Mon compte
          </Link>
          , vous voyez les données conservées et pouvez supprimer votre compte en un clic. Pour
          toute autre demande, ouvrez un ticket sur{" "}
          <a href={`${repository}/issues`} className={link} rel="noopener noreferrer">
            le dépôt GitHub du projet
          </a>{" "}
          sans y indiquer de donnée personnelle : nous vous répondrons pour vérifier votre identité.
        </p>
        <p>
          Vous pouvez aussi adresser une réclamation à la{" "}
          <a href="https://www.cnil.fr/fr/plaintes" className={link} rel="noopener noreferrer">
            CNIL
          </a>
          .
        </p>
      </section>

      <section className={section}>
        <h2 className={h2}>Responsable</h2>
        <p>
          {site} est un projet personnel, gratuit et non commercial, édité par une personne
          physique. Voir{" "}
          <Link href="/a-propos" className={link}>
            À propos
          </Link>
          .
        </p>
      </section>
    </>
  ),
};

interface PrivacyTexts {
  metaTitle: string;
  metaDescription: (site: string) => string;
  breadcrumb: string;
  title: string;
  updated: string;
  notice: string;
  /** Rubriques simples : titre, puis paragraphes (texte) ou listes (tableau). */
  sections: { title: string; blocks: (string | string[])[] }[];
  rightsTitle: string;
  rights: [before: string, account: string, middle: string, repository: string, after: string];
  complaint: [before: string, after: string];
  controllerTitle: string;
  controller: (site: string) => string;
  about: string;
}

/** Traductions fournies à titre d'information : la version française fait foi. */
function translated(t: PrivacyTexts): PrivacyContent {
  return {
    metaTitle: () => t.metaTitle,
    metaDescription: t.metaDescription,
    breadcrumb: t.breadcrumb,
    title: t.title,
    body: (site, repository) => (
      <>
        <p className="text-muted-foreground">{t.updated}</p>
        <p className="rounded-lg border p-3 text-sm">{t.notice}</p>
        {t.sections.map((s) => (
          <section key={s.title} className={section}>
            <h2 className={h2}>{s.title}</h2>
            {s.blocks.map((block, i) =>
              Array.isArray(block) ? (
                <ul key={i} className={list}>
                  {block.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p key={i}>{block}</p>
              ),
            )}
          </section>
        ))}
        <section className={section}>
          <h2 className={h2}>{t.rightsTitle}</h2>
          <p>
            {t.rights[0]}{" "}
            <Link href="/compte" className={link}>
              {t.rights[1]}
            </Link>
            {t.rights[2]}{" "}
            <a href={`${repository}/issues`} className={link} rel="noopener noreferrer">
              {t.rights[3]}
            </a>{" "}
            {t.rights[4]}
          </p>
          <p>
            {t.complaint[0]}{" "}
            <a href="https://www.cnil.fr/fr/plaintes" className={link} rel="noopener noreferrer">
              CNIL
            </a>
            {t.complaint[1]}
          </p>
        </section>
        <section className={section}>
          <h2 className={h2}>{t.controllerTitle}</h2>
          <p>
            {t.controller(site)}{" "}
            <Link href="/a-propos" className={link}>
              {t.about}
            </Link>
            .
          </p>
        </section>
      </>
    ),
  };
}

const en = translated({
  metaTitle: "Privacy: personal data and cookies",
  metaDescription: (site) =>
    `What data ${site} keeps about accounts, why, for how long, and how to delete your account. No advertising trackers.`,
  breadcrumb: "Privacy",
  title: "Privacy policy",
  updated: "Last updated: 25 October 2026.",
  notice:
    "This translation is provided for information. In the event of any difference, the French version prevails.",
  sections: [
    {
      title: "In short",
      blocks: [
        [
          "Browsing the site requires no account and sets no tracker.",
          "An account is only used to review watches and keep your wish lists.",
          "We do not sell, rent or share any data. No advertising.",
          "You can delete your account yourself, at any time.",
        ],
      ],
    },
    {
      title: "Data kept for an account",
      blocks: [
        "Sign-in goes through GitHub or Google: we never see or store your password. The chosen service sends us, with your consent:",
        [
          "your name (or nickname) and your profile photo;",
          "your email address, to recognise your account from one visit to the next;",
          "a technical identifier of your account with that service.",
        ],
        "After the account is created, we ask for your country of origin (optional, “Prefer not to say” is possible, editable on the My account page). Only the country is recorded, never an address: it is only used to count visitors by country.",
        "For each open session, we also record the IP address and browser type, to detect abuse (fake reviews, multiple accounts). Your reviews (ratings, comment, owner or not) are linked to your account and shown publicly with your name and profile photo on the watch page.",
        "Your wish lists (name, description, chosen watches) are private by default. If you choose to share them by link or publish them in the community, they become visible with your name and profile photo, like the messages you leave on other members' lists. You can also publish a list or write anonymously: other members then see “List author” or a pseudonym specific to each list, never your name or photo, and cannot link your messages from one list to another. The message stays linked to your account on the site side, to fight abuse.",
        "We send no emails and request no access to your GitHub repositories or Google data beyond your profile. The chosen language is not stored: it only appears in the page address.",
      ],
    },
    {
      title: "Why and on what basis",
      blocks: [
        "This data is only used to run your account and to ensure one review per person and per watch. Legal basis: performance of the service you request by creating an account (Article 6(1)(b) GDPR) and our legitimate interest in fighting abuse (Article 6(1)(f)).",
      ],
    },
    {
      title: "Retention period",
      blocks: [
        [
          "Session: 30 days at most, erased on sign-out.",
          "Account: until you delete it.",
          "When the account is deleted, your profile data, sessions, reviews, lists and comments are erased immediately. You can also delete a single review from the watch page, a list from “My lists” and a comment from the list.",
        ],
      ],
    },
    {
      title: "Cookies",
      blocks: [
        "Two cookies at most, both necessary for the service you request:",
        [
          "the session cookie, set only when you sign in;",
          "the “theme” cookie, set only if you choose the dark or light theme, to remember that choice for a year. It contains only that choice and is never read by our servers.",
        ],
        "No advertising cookies, no audience measurement, no social media buttons: no consent banner is therefore needed.",
      ],
    },
    {
      title: "Hosting",
      blocks: [
        [
          "Site: Vercel Inc. (United States), which serves the pages and processes requests.",
          "Database: Neon, hosted in the European Union (Frankfurt).",
          "Domain name: Cloudflare.",
        ],
        "Transfers outside the European Union to Vercel are covered by the EU-US Data Privacy Framework and the European Commission's standard contractual clauses.",
      ],
    },
  ],
  rightsTitle: "Your rights",
  rights: [
    "You have the right of access, rectification, erasure, portability and objection. The simplest way: from the",
    "My account",
    " page, you can see the data kept and delete your account in one click. For any other request, open an issue on",
    "the project's GitHub repository",
    "without including any personal data: we will reply to verify your identity.",
  ],
  complaint: ["You can also lodge a complaint with the French data protection authority, the", "."],
  controllerTitle: "Controller",
  controller: (site) =>
    `${site} is a personal, free and non-commercial project, published by a private individual. See`,
  about: "About",
});

const de = translated({
  metaTitle: "Datenschutz: personenbezogene Daten und Cookies",
  metaDescription: (site) =>
    `Welche Daten ${site} zu Konten speichert, warum, wie lange und wie Sie Ihr Konto löschen. Keine Werbe-Tracker.`,
  breadcrumb: "Datenschutz",
  title: "Datenschutzerklärung",
  updated: "Zuletzt aktualisiert: 25. Oktober 2026.",
  notice:
    "Diese Übersetzung dient nur zur Information. Bei Abweichungen ist die französische Fassung maßgeblich.",
  sections: [
    {
      title: "Kurz gesagt",
      blocks: [
        [
          "Für den Besuch der Website ist kein Konto nötig und es wird kein Tracker gesetzt.",
          "Ein Konto dient nur dazu, Uhren zu bewerten und Ihre Wunschlisten zu führen.",
          "Wir verkaufen, vermieten oder teilen keine Daten. Keine Werbung.",
          "Sie können Ihr Konto jederzeit selbst löschen.",
        ],
      ],
    },
    {
      title: "Für ein Konto gespeicherte Daten",
      blocks: [
        "Die Anmeldung erfolgt über GitHub oder Google: Wir sehen und speichern Ihr Passwort nie. Der gewählte Dienst übermittelt uns mit Ihrer Zustimmung:",
        [
          "Ihren Namen (oder Spitznamen) und Ihr Profilfoto;",
          "Ihre E-Mail-Adresse, um Ihr Konto von Besuch zu Besuch wiederzuerkennen;",
          "eine technische Kennung Ihres Kontos bei diesem Dienst.",
        ],
        "Nach der Kontoerstellung fragen wir nach Ihrem Herkunftsland (freiwillig, „Keine Angabe“ möglich, auf der Seite Mein Konto änderbar). Gespeichert wird nur das Land, nie eine Adresse: Es dient nur dazu, Besucher nach Ländern zu zählen.",
        "Für jede offene Sitzung speichern wir außerdem IP-Adresse und Browsertyp, um Missbrauch zu erkennen (gefälschte Meinungen, Mehrfachkonten). Ihre Meinungen (Bewertungen, Kommentar, Besitzer oder nicht) sind Ihrem Konto zugeordnet und werden öffentlich mit Ihrem Namen und Profilfoto auf der Uhrenseite angezeigt.",
        "Ihre Wunschlisten (Name, Beschreibung, gewählte Uhren) sind standardmäßig privat. Wenn Sie sie per Link teilen oder in der Community veröffentlichen, werden sie mit Ihrem Namen und Profilfoto sichtbar, ebenso wie Ihre Nachrichten auf den Listen anderer Mitglieder. Sie können eine Liste auch anonym veröffentlichen oder anonym schreiben: Andere Mitglieder sehen dann „Autor der Liste“ oder ein Pseudonym pro Liste, nie Ihren Namen oder Ihr Foto, und können Ihre Nachrichten nicht listenübergreifend verknüpfen. Die Nachricht bleibt auf Seiten der Website Ihrem Konto zugeordnet, um Missbrauch zu bekämpfen.",
        "Wir senden keine E-Mails und verlangen keinen Zugriff auf Ihre GitHub-Repositorys oder Google-Daten über Ihr Profil hinaus. Die gewählte Sprache wird nicht gespeichert: Sie steht nur in der Adresse der Seite.",
      ],
    },
    {
      title: "Zweck und Rechtsgrundlage",
      blocks: [
        "Diese Daten dienen nur dem Betrieb Ihres Kontos und der Sicherstellung einer Meinung pro Person und Uhr. Rechtsgrundlage: Erfüllung des Dienstes, den Sie mit der Kontoerstellung anfordern (Art. 6 Abs. 1 lit. b DSGVO), und unser berechtigtes Interesse an der Missbrauchsbekämpfung (Art. 6 Abs. 1 lit. f).",
      ],
    },
    {
      title: "Speicherdauer",
      blocks: [
        [
          "Sitzung: höchstens 30 Tage, bei der Abmeldung gelöscht.",
          "Konto: bis Sie es löschen.",
          "Bei der Kontolöschung werden Ihre Profildaten, Sitzungen, Meinungen, Listen und Kommentare sofort gelöscht. Sie können auch eine einzelne Meinung auf der Uhrenseite, eine Liste unter „Meine Listen“ und einen Kommentar auf der Liste löschen.",
        ],
      ],
    },
    {
      title: "Cookies",
      blocks: [
        "Höchstens zwei Cookies, beide für den angeforderten Dienst erforderlich:",
        [
          "das Sitzungscookie, nur bei der Anmeldung gesetzt;",
          "das Cookie „theme“, nur gesetzt, wenn Sie das dunkle oder helle Design wählen, um diese Wahl ein Jahr lang zu speichern. Es enthält nur diese Wahl und wird von unseren Servern nie gelesen.",
        ],
        "Keine Werbecookies, keine Reichweitenmessung, keine Social-Media-Schaltflächen: Ein Einwilligungsbanner ist daher nicht nötig.",
      ],
    },
    {
      title: "Hosting",
      blocks: [
        [
          "Website: Vercel Inc. (USA), das die Seiten ausliefert und die Anfragen verarbeitet.",
          "Datenbank: Neon, gehostet in der Europäischen Union (Frankfurt).",
          "Domainname: Cloudflare.",
        ],
        "Übermittlungen an Vercel außerhalb der Europäischen Union erfolgen im Rahmen des EU-US-Datenschutzrahmens und der Standardvertragsklauseln der Europäischen Kommission.",
      ],
    },
  ],
  rightsTitle: "Ihre Rechte",
  rights: [
    "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Datenübertragbarkeit und Widerspruch. Am einfachsten: Auf der Seite",
    "Mein Konto",
    " sehen Sie die gespeicherten Daten und können Ihr Konto mit einem Klick löschen. Für jede andere Anfrage eröffnen Sie ein Ticket im",
    "GitHub-Repository des Projekts",
    "ohne personenbezogene Daten anzugeben: Wir antworten Ihnen, um Ihre Identität zu prüfen.",
  ],
  complaint: [
    "Sie können auch eine Beschwerde bei der französischen Datenschutzbehörde einreichen, der",
    ".",
  ],
  controllerTitle: "Verantwortlicher",
  controller: (site) =>
    `${site} ist ein persönliches, kostenloses und nicht kommerzielles Projekt einer Privatperson. Siehe`,
  about: "Über uns",
});

const it = translated({
  metaTitle: "Privacy: dati personali e cookie",
  metaDescription: (site) =>
    `Quali dati ${site} conserva sugli account, perché, per quanto tempo e come eliminare il tuo account. Nessun tracker pubblicitario.`,
  breadcrumb: "Privacy",
  title: "Informativa sulla privacy",
  updated: "Ultimo aggiornamento: 25 ottobre 2026.",
  notice:
    "Questa traduzione è fornita a titolo informativo. In caso di differenze, fa fede la versione francese.",
  sections: [
    {
      title: "In breve",
      blocks: [
        [
          "Consultare il sito non richiede alcun account e non installa alcun tracker.",
          "Un account serve solo per dare la tua opinione sugli orologi e tenere le tue liste dei desideri.",
          "Non vendiamo, non affittiamo e non condividiamo alcun dato. Nessuna pubblicità.",
          "Puoi eliminare il tuo account da solo, in qualsiasi momento.",
        ],
      ],
    },
    {
      title: "Dati conservati per un account",
      blocks: [
        "L'accesso avviene tramite GitHub o Google: non vediamo né conserviamo mai la tua password. Il servizio scelto ci trasmette, con il tuo consenso:",
        [
          "il tuo nome (o pseudonimo) e la tua foto del profilo;",
          "il tuo indirizzo e-mail, per riconoscere il tuo account da una visita all'altra;",
          "un identificativo tecnico del tuo account presso quel servizio.",
        ],
        "Dopo la creazione dell'account, ti chiediamo il tuo paese di provenienza (facoltativo, «Preferisco non dirlo» possibile, modificabile nella pagina Il mio account). Viene registrato solo il paese, mai un indirizzo: serve solo a contare i visitatori per paese.",
        "Per ogni sessione aperta registriamo anche l'indirizzo IP e il tipo di browser, per individuare gli abusi (false opinioni, account multipli). Le tue opinioni (voti, commento, proprietario o no) sono collegate al tuo account e mostrate pubblicamente con il tuo nome e la tua foto del profilo sulla scheda dell'orologio.",
        "Le tue liste dei desideri (nome, descrizione, orologi scelti) sono private per impostazione predefinita. Se scegli di condividerle tramite link o di pubblicarle nella community, diventano visibili con il tuo nome e la tua foto del profilo, come i messaggi che lasci sulle liste degli altri membri. Puoi anche pubblicare una lista o scrivere in forma anonima: gli altri membri vedono allora «Autore della lista» o uno pseudonimo proprio di ogni lista, mai il tuo nome né la tua foto, e non possono collegare i tuoi messaggi da una lista all'altra. Il messaggio resta collegato al tuo account lato sito, per contrastare gli abusi.",
        "Non inviamo e-mail e non chiediamo accesso ai tuoi repository GitHub né ai tuoi dati Google oltre al profilo. La lingua scelta non viene registrata: compare solo nell'indirizzo della pagina.",
      ],
    },
    {
      title: "Perché e su quale base",
      blocks: [
        "Questi dati servono solo a far funzionare il tuo account e a garantire una sola opinione per persona e per orologio. Base giuridica: l'esecuzione del servizio che richiedi creando un account (articolo 6.1.b del GDPR) e il nostro legittimo interesse a contrastare gli abusi (articolo 6.1.f).",
      ],
    },
    {
      title: "Durata di conservazione",
      blocks: [
        [
          "Sessione: al massimo 30 giorni, cancellata alla disconnessione.",
          "Account: finché non lo elimini.",
          "All'eliminazione dell'account, i tuoi dati del profilo, le sessioni, le opinioni, le liste e i commenti vengono cancellati subito. Puoi anche eliminare una singola opinione dalla scheda, una lista da «Le mie liste» e un commento dalla lista.",
        ],
      ],
    },
    {
      title: "Cookie",
      blocks: [
        "Al massimo due cookie, entrambi necessari al servizio che richiedi:",
        [
          "il cookie di sessione, installato solo quando accedi;",
          "il cookie «theme», installato solo se scegli il tema scuro o chiaro, per ricordare questa scelta per un anno. Contiene solo questa scelta e non viene mai letto dai nostri server.",
        ],
        "Nessun cookie pubblicitario, nessuna misurazione dell'audience, nessun pulsante social: non serve quindi alcun banner di consenso.",
      ],
    },
    {
      title: "Hosting",
      blocks: [
        [
          "Sito: Vercel Inc. (Stati Uniti), che serve le pagine ed elabora le richieste.",
          "Database: Neon, ospitato nell'Unione europea (Francoforte).",
          "Nome di dominio: Cloudflare.",
        ],
        "I trasferimenti verso Vercel fuori dall'Unione europea sono regolati dal quadro UE-USA per la protezione dei dati e dalle clausole contrattuali tipo della Commissione europea.",
      ],
    },
  ],
  rightsTitle: "I tuoi diritti",
  rights: [
    "Hai diritto di accesso, rettifica, cancellazione, portabilità e opposizione. Il modo più semplice: dalla pagina",
    "Il mio account",
    " vedi i dati conservati e puoi eliminare il tuo account con un clic. Per qualsiasi altra richiesta, apri un ticket sul",
    "repository GitHub del progetto",
    "senza indicare dati personali: ti risponderemo per verificare la tua identità.",
  ],
  complaint: [
    "Puoi anche presentare un reclamo all'autorità francese per la protezione dei dati, la",
    ".",
  ],
  controllerTitle: "Titolare",
  controller: (site) =>
    `${site} è un progetto personale, gratuito e non commerciale, pubblicato da una persona fisica. Vedi`,
  about: "Chi siamo",
});

const es = translated({
  metaTitle: "Privacidad: datos personales y cookies",
  metaDescription: (site) =>
    `Qué datos conserva ${site} sobre las cuentas, por qué, durante cuánto tiempo y cómo eliminar su cuenta. Sin rastreadores publicitarios.`,
  breadcrumb: "Privacidad",
  title: "Política de privacidad",
  updated: "Última actualización: 25 de octubre de 2026.",
  notice:
    "Esta traducción se ofrece a título informativo. En caso de diferencia, prevalece la versión francesa.",
  sections: [
    {
      title: "En resumen",
      blocks: [
        [
          "Consultar el sitio no requiere cuenta ni instala ningún rastreador.",
          "Una cuenta solo sirve para opinar sobre los relojes y gestionar sus listas de deseos.",
          "No vendemos, alquilamos ni compartimos ningún dato. Sin publicidad.",
          "Puede eliminar su cuenta usted mismo, en cualquier momento.",
        ],
      ],
    },
    {
      title: "Datos conservados de una cuenta",
      blocks: [
        "El inicio de sesión se hace con GitHub o Google: nunca vemos ni guardamos su contraseña. El servicio elegido nos transmite, con su consentimiento:",
        [
          "su nombre (o seudónimo) y su foto de perfil;",
          "su dirección de correo electrónico, para reconocer su cuenta de una visita a otra;",
          "un identificador técnico de su cuenta en ese servicio.",
        ],
        "Tras crear la cuenta, le pedimos su país de procedencia (opcional, «Prefiero no decirlo» posible, modificable en la página Mi cuenta). Solo se registra el país, nunca una dirección: sirve únicamente para contar los visitantes por país.",
        "En cada sesión abierta registramos también la dirección IP y el tipo de navegador, para detectar abusos (opiniones falsas, cuentas múltiples). Sus opiniones (valoraciones, comentario, propietario o no) están vinculadas a su cuenta y se muestran públicamente con su nombre y su foto de perfil en la ficha del reloj.",
        "Sus listas de deseos (nombre, descripción, relojes elegidos) son privadas por defecto. Si decide compartirlas por enlace o publicarlas en la comunidad, se vuelven visibles con su nombre y su foto de perfil, como los mensajes que deja en las listas de otros miembros. También puede publicar una lista o escribir de forma anónima: los demás miembros ven entonces «Autor de la lista» o un seudónimo propio de cada lista, nunca su nombre ni su foto, y no pueden relacionar sus mensajes de una lista a otra. El mensaje sigue vinculado a su cuenta en el sitio, para combatir los abusos.",
        "No enviamos correos ni pedimos acceso a sus repositorios de GitHub ni a sus datos de Google más allá de su perfil. El idioma elegido no se guarda: solo aparece en la dirección de la página.",
      ],
    },
    {
      title: "Por qué y con qué base",
      blocks: [
        "Estos datos solo sirven para que su cuenta funcione y para garantizar una sola opinión por persona y por reloj. Base jurídica: la ejecución del servicio que solicita al crear una cuenta (artículo 6.1.b del RGPD) y nuestro interés legítimo en combatir los abusos (artículo 6.1.f).",
      ],
    },
    {
      title: "Plazo de conservación",
      blocks: [
        [
          "Sesión: 30 días como máximo, borrada al cerrar sesión.",
          "Cuenta: mientras no la elimine.",
          "Al eliminar la cuenta, sus datos de perfil, sesiones, opiniones, listas y comentarios se borran inmediatamente. También puede eliminar una sola opinión desde la ficha, una lista desde «Mis listas» y un comentario desde la lista.",
        ],
      ],
    },
    {
      title: "Cookies",
      blocks: [
        "Dos cookies como máximo, ambas necesarias para el servicio que solicita:",
        [
          "la cookie de sesión, instalada solo cuando inicia sesión;",
          "la cookie «theme», instalada solo si elige el tema oscuro o claro, para recordar esa elección durante un año. Solo contiene esa elección y nuestros servidores nunca la leen.",
        ],
        "Sin cookies publicitarias, sin medición de audiencia, sin botones de redes sociales: por tanto, no hace falta ningún aviso de consentimiento.",
      ],
    },
    {
      title: "Alojamiento",
      blocks: [
        [
          "Sitio: Vercel Inc. (Estados Unidos), que sirve las páginas y procesa las solicitudes.",
          "Base de datos: Neon, alojada en la Unión Europea (Fráncfort).",
          "Nombre de dominio: Cloudflare.",
        ],
        "Las transferencias fuera de la Unión Europea a Vercel se rigen por el Marco de Privacidad de Datos UE-EE. UU. y las cláusulas contractuales tipo de la Comisión Europea.",
      ],
    },
  ],
  rightsTitle: "Sus derechos",
  rights: [
    "Tiene derecho de acceso, rectificación, supresión, portabilidad y oposición. Lo más sencillo: desde la página",
    "Mi cuenta",
    " ve los datos conservados y puede eliminar su cuenta con un clic. Para cualquier otra solicitud, abra una incidencia en",
    "el repositorio GitHub del proyecto",
    "sin indicar datos personales: le responderemos para verificar su identidad.",
  ],
  complaint: [
    "También puede presentar una reclamación ante la autoridad francesa de protección de datos, la",
    ".",
  ],
  controllerTitle: "Responsable",
  controller: (site) =>
    `${site} es un proyecto personal, gratuito y no comercial, editado por una persona física. Ver`,
  about: "Acerca de",
});

export const PRIVACY: Record<Locale, PrivacyContent> = { fr, en, de, it, es };
