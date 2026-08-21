/**
 * Dados de demonstração: endereços reais de São Paulo.
 * Os textos são geocodificados de verdade ao carregar a demo — as
 * coordenadas abaixo servem apenas de fallback se o geocoder falhar,
 * nunca para simular rotas ou distâncias.
 */
export interface DemoStop {
  query: string;
  fallback: { lat: number; lng: number };
}

export const DEMO_ORIGIN: DemoStop = {
  query: "Avenida Paulista, Bela Vista, São Paulo - SP",
  fallback: { lat: -23.5614, lng: -46.6559 },
};

export const DEMO_DESTINATIONS: DemoStop[] = [
  { query: "Rua Vergueiro, Liberdade, São Paulo - SP", fallback: { lat: -23.5719, lng: -46.6392 } },
  { query: "Avenida Ibirapuera, Moema, São Paulo - SP", fallback: { lat: -23.6033, lng: -46.6659 } },
  { query: "Rua Augusta, Consolação, São Paulo - SP", fallback: { lat: -23.5533, lng: -46.6618 } },
  { query: "Mooca, São Paulo - SP", fallback: { lat: -23.5561, lng: -46.5975 } },
  { query: "Vila Mariana, São Paulo - SP", fallback: { lat: -23.5893, lng: -46.6345 } },
];
