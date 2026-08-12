export type SiteKey = "winking" | "elcuk";

export const managedSites = [
  { key: "winking" as const, label: "Winking Games", hostname: "winking.games", defaultUrl: "https://winking.games/" },
  { key: "elcuk" as const, label: "Elcuk", hostname: "elcuk.lol", defaultUrl: "https://elcuk.lol/" },
];

export function siteFromHostname(hostname: string): SiteKey {
  const normalized = hostname.toLowerCase().replace(/^www\./, "");
  return normalized === "elcuk.lol" ? "elcuk" : "winking";
}

export function siteSettingsKey(siteKey: SiteKey) {
  return `redirects:${siteKey}`;
}

export function siteConfig(siteKey: SiteKey) {
  return managedSites.find((site) => site.key === siteKey) ?? managedSites[0];
}
