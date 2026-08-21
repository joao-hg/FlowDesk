import { NominatimGeocodingProvider } from "@/services/geocoding/nominatim";
import { geocodingThrottle } from "@/lib/rateLimit";
import { toAppError } from "@/utils/errors";
import type { GeocodingProvider } from "@/services/geocoding/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Troque a linha abaixo para usar outro geocoder: nada mais na aplicação muda.
const provider: GeocodingProvider = new NominatimGeocodingProvider();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const limit = Number.parseInt(searchParams.get("limit") ?? "6", 10);
  const countryCode = searchParams.get("country") ?? undefined;

  if (query.length < 3) {
    return Response.json({ results: [] });
  }

  try {
    const results = await geocodingThrottle.run(() =>
      provider.searchAddress(query, {
        limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 10) : 6,
        countryCode,
        signal: request.signal,
      }),
    );
    return Response.json({ results, provider: provider.name });
  } catch (error) {
    const appError = toAppError(error);
    return Response.json(
      { error: { code: appError.code, message: appError.message } },
      { status: appError.code === "RATE_LIMITED" ? 429 : 502 },
    );
  }
}
