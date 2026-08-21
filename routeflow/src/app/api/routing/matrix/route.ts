import { OsrmRoutingProvider } from "@/services/routing/osrm";
import type { RoutingProvider } from "@/services/routing/types";
import { parseCoordinates, parseMode } from "@/lib/validation";
import { toAppError } from "@/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Troque a implementação para migrar de OSRM para GraphHopper/Valhalla.
const provider: RoutingProvider = new OsrmRoutingProvider();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const points = parseCoordinates(body?.points);
    const mode = parseMode(body?.mode);

    const matrix = await provider.calculateMatrix(points, mode, { signal: request.signal });
    return Response.json({ matrix, provider: provider.name });
  } catch (error) {
    const appError = toAppError(error);
    const status =
      appError.code === "RATE_LIMITED" ? 429 : appError.code === "UNKNOWN" ? 400 : 502;
    return Response.json(
      { error: { code: appError.code, message: appError.message } },
      { status },
    );
  }
}
