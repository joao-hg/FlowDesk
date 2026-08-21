/**
 * Configuração dos provedores. Lida apenas no servidor (rotas /api), o que
 * mantém endpoints e contatos fora do bundle enviado ao navegador.
 */

const env = (key: string, fallback: string) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

export const serverConfig = {
  geocoding: {
    provider: env("GEOCODING_PROVIDER", "nominatim"),
    baseUrl: env("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org"),
    language: env("GEOCODING_LANGUAGE", "pt-BR"),
    appName: env("NOMINATIM_APP_NAME", "RouteFlow"),
    contactEmail: env("NOMINATIM_CONTACT_EMAIL", ""),
  },
  routing: {
    provider: env("ROUTING_PROVIDER", "osrm"),
    endpoints: {
      car: env("OSRM_CAR_URL", "https://routing.openstreetmap.de/routed-car"),
      bike: env("OSRM_BIKE_URL", "https://routing.openstreetmap.de/routed-bike"),
      foot: env("OSRM_FOOT_URL", "https://routing.openstreetmap.de/routed-foot"),
    },
  },
} as const;

/**
 * Nominatim exige identificação da aplicação e um contato válido.
 * Sem e-mail configurado enviamos apenas o nome do app — suficiente para
 * desenvolvimento, mas o .env deve ser preenchido antes do deploy.
 */
export function geocodingUserAgent(): string {
  const { appName, contactEmail } = serverConfig.geocoding;
  return contactEmail ? `${appName} (${contactEmail})` : `${appName} (self-hosted)`;
}
