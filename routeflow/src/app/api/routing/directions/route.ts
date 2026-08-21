import { OsrmRoutingProvider, resolveProfile } from "@/services/routing/osrm";
import type { RoutingProvider } from "@/services/routing/types";
import { parseCoordinates, parseModes } from "@/lib/validation";
import { toAppError } from "@/utils/errors";
import type { Route, TransportMode } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const provider: RoutingProvider = new OsrmRoutingProvider();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const points = parseCoordinates(body?.points);
    const modes = parseModes(body?.modes);

    /*
     * Modos que compartilham o mesmo perfil (moto e carro, hoje) geram uma
     * única requisição ao motor de rotas; o resultado é reaproveitado e
     * marcado como aproximação quando for o caso.
     */
    const byProfile = new Map<string, TransportMode>();
    for (const mode of modes) {
      const { profile } = resolveProfile(mode);
      if (!byProfile.has(profile)) byProfile.set(profile, mode);
    }

    const computed = new Map<string, Route>();
    const settled = await Promise.allSettled(
      [...byProfile.entries()].map(async ([profile, mode]) => {
        const route = await provider.calculateRoute(points, mode, { signal: request.signal });
        return [profile, route] as const;
      }),
    );

    const failures: string[] = [];
    for (const result of settled) {
      if (result.status === "fulfilled") {
        computed.set(result.value[0], result.value[1]);
      } else {
        failures.push(toAppError(result.reason).message);
      }
    }

    if (computed.size === 0) {
      const appError = toAppError(new Error(failures[0] ?? "Falha ao calcular rota."));
      return Response.json(
        { error: { code: "ROUTE_NOT_POSSIBLE", message: appError.message } },
        { status: 502 },
      );
    }

    const routes: Route[] = [];
    for (const mode of modes) {
      const resolution = resolveProfile(mode);
      const base = computed.get(resolution.profile);
      if (!base) continue;
      routes.push({
        ...base,
        mode,
        profileUsed: resolution.profile,
        isApproximation: resolution.isApproximation,
      });
    }

    return Response.json({ routes, provider: provider.name });
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
