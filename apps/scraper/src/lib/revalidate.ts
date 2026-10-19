/**
 * Demande au site de régénérer ses pages après une collecte (route /api/revalidate).
 * Facultatif : sans SITE_URL ni REVALIDATE_SECRET (en local), rien n'est appelé. Un échec est
 * signalé mais ne fait pas échouer la collecte : les données sont en base, le cache expirera seul.
 */
export async function revalidateSite(env: Record<string, string | undefined> = process.env) {
  const siteUrl = env.SITE_URL?.replace(/\/+$/, "");
  const secret = env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) {
    console.log("Invalidation du cache du site ignorée (SITE_URL ou REVALIDATE_SECRET absent).");
    return;
  }
  try {
    const response = await fetch(`${siteUrl}/api/revalidate`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log("Cache du site invalidé : les pages afficheront les nouveaux relevés.");
  } catch (error) {
    console.warn(
      "Invalidation du cache du site impossible :",
      error instanceof Error ? error.message : error,
    );
  }
}
