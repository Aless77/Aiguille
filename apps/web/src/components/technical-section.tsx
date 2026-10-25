import { movementMaker, warrantyFor } from "@aiguille/db/brand-info";
import {
  COMPLICATIONS,
  extractConstructionFacts,
  extractMovementFacts,
  extractOwnershipFacts,
} from "@aiguille/db/facts";
import { Link } from "@/lib/i18n/client";

import { MOVEMENT_LABELS } from "@/lib/catalog/format";
import { type WatchDetail } from "@/lib/catalog/queries";

const UNKNOWN = "Non communiqué par la marque";

type Row = [label: string, value: string | null, note?: string];

function Rows({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <dl className="divide-y text-sm">
        {rows.map(([label, value, note]) => (
          <div key={label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={value === null ? "text-muted-foreground italic" : undefined}>
              {value ?? UNKNOWN}
              {note && (
                <span className="block text-xs text-muted-foreground not-italic">{note}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const yesNo = (v: boolean) => (v ? "Oui" : "Non mentionné");
const fr = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");

/**
 * Faits techniques, garantie et entretien, sans note (décision du 24 octobre 2026) : ce que la
 * marque publie, dit clairement, et « non communiqué » quand elle ne le publie pas.
 */
export function TechnicalSection({
  watch: w,
  storeCount,
}: {
  watch: WatchDetail;
  storeCount: number;
}) {
  const source = { ...w, collectionName: w.collectionName };
  const m = extractMovementFacts(source);
  const c = extractConstructionFacts(source);
  const o = extractOwnershipFacts(source);
  const mechanical = m.type === "automatique" || m.type === "manuel";
  const maker = movementMaker(w.brandSlug, m.caliber);
  const warranty = warrantyFor(w.brandSlug, o.warrantyMonths);

  const movement: Row[] = [
    ["Type", m.type ? MOVEMENT_LABELS[m.type] : null],
    ["Calibre", m.caliber],
    ["Constructeur du mouvement", maker?.value ?? null],
    ...(mechanical
      ? ([
          ["Réserve de marche", m.powerReserveH ? `${m.powerReserveH} heures` : null],
          ["Fréquence", m.frequencyVph ? `${fr(m.frequencyVph)} alternances par heure` : null],
          [
            "Spiral",
            m.siliconHairspring
              ? "Silicium (amagnétique, insensible aux variations de température)"
              : m.antimagnetic
                ? "Antimagnétique"
                : null,
          ],
        ] satisfies Row[])
      : []),
    ["Certification chronomètre (COSC)", m.chronometer ? "Oui" : "Non mentionnée"],
    [
      "Fonctions",
      m.complications.length
        ? [...m.complications.map((x) => COMPLICATIONS[x]), ...o.chronographMechanism].join(", ")
        : "Heures, minutes (et selon le modèle secondes, date)",
    ],
  ];

  const construction: Row[] = [
    [
      "Verre",
      c.crystalKnown
        ? c.sapphire
          ? `Saphir${c.antiReflective ? ", traitement antireflet" : ""}`
          : (w.crystal ?? null)
        : null,
    ],
    ["Étanchéité", w.waterResistanceM ? `${w.waterResistanceM} m` : null],
    ["Boîtier", w.caseMaterial],
    ...(c.ceramicBezel ? ([["Lunette", "Céramique (résiste aux rayures)"]] satisfies Row[]) : []),
    ["Fond transparent", yesNo(c.exhibitionCaseback)],
    ["Couronne vissée", yesNo(c.screwDownCrown)],
    ["Luminescence", c.luminescent ? "Oui (Super-LumiNova ou équivalent)" : "Non mentionnée"],
    [
      "Bracelet",
      [
        o.interchangeableStrap && "interchangeable sans outil",
        o.deployantClasp && "boucle déployante",
      ]
        .filter(Boolean)
        .join(", ") || "Non mentionné",
    ],
  ];

  const care: Row[] = [
    [
      "Garantie internationale",
      warranty ? `${warranty.months / 12} ans` : null,
      warranty
        ? warranty.extended.map((e) => `${e.months / 12} ans : ${e.when}.`).join(" ") ||
          (warranty.source.startsWith("http") ? "Selon les conditions de la marque." : undefined)
        : undefined,
    ],
    ["Fabrication", o.madeIn],
    ...(m.type === "quartz" || m.type === "solaire"
      ? ([
          [
            "Pile",
            m.type === "solaire"
              ? "Accumulateur rechargé par la lumière"
              : o.battery
                ? `Pile standard ${o.battery}`
                : null,
            o.endOfLifeIndicator ? "Indicateur de fin de vie de la pile." : undefined,
          ],
        ] satisfies Row[])
      : []),
    ["Points de vente agréés en Europe", storeCount > 0 ? `${fr(storeCount)} répertoriés` : null],
    ["Tarifs et délais de révision", null],
  ];

  return (
    <section id="technique" aria-labelledby="technique-titre" className="scroll-mt-20 space-y-6">
      <div className="space-y-1">
        <h2 id="technique-titre" className="text-2xl font-semibold tracking-tight">
          Technique, garantie et entretien
        </h2>
        <p className="text-sm text-muted-foreground">
          Les faits publiés par {w.brandName}, sans jugement de goût. « {UNKNOWN} » signale une
          information absente de sa fiche officielle.
        </p>
      </div>
      {o.vintageYear && (
        <p className="rounded-lg border p-3 text-sm">
          Pièce vintage de {o.vintageYear}, vendue d&apos;occasion par la marque : elle n&apos;est
          pas comparée aux montres neuves.
        </p>
      )}
      <div className="grid gap-8 lg:grid-cols-3">
        <Rows title="Mouvement" rows={movement} />
        <Rows title="Construction" rows={construction} />
        <Rows title="Garantie et entretien" rows={care} />
      </div>
      <p className="text-sm text-muted-foreground">
        D&apos;où viennent ces informations :{" "}
        <Link href="/methodologie#technique" className="underline underline-offset-4">
          notre méthodologie
        </Link>
        .
      </p>
    </section>
  );
}
