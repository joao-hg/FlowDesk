import { NominatimGeocodingProvider } from "@/services/geocoding/nominatim";
import { geocodingThrottle } from "@/lib/rateLimit";
import { toAppError } from "@/utils/errors";
import type { GeocodingProvider } from "@/services/geocoding/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const provider: GeocodingProvider = new NominatimGeocodingProvider();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lng = Number.parseFloat(searchParams.get("lng") ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { error: { code: "UNKNOWN", message: "Coordenadas inválidas." } },
      { status: 400 },
    );
  }

  try {
    const result = await geocodingThrottle.run(() =>
      provider.reverse({ lat, lng }, { signal: request.signal }),
    );
    return Response.json({ result });
  } catch (error) {
    const appError = toAppError(error);
    return Response.json(
      { error: { code: appError.code, message: appError.message } },
      { status: appError.code === "RATE_LIMITED" ? 429 : 502 },
    );
  }
}
