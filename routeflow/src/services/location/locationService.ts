"use client";

import { AppError, type Coordinate } from "@/types";

export interface LocationProvider {
  isSupported(): boolean;
  getCurrentPosition(options?: PositionOptions): Promise<Coordinate>;
}

/**
 * Geolocalização do navegador.
 *
 * A posição nunca é enviada a um servidor de persistência: ela permanece no
 * estado da aplicação e, no máximo, é convertida em endereço pela rota de
 * geocodificação reversa, que não guarda nada.
 */
export class BrowserLocationProvider implements LocationProvider {
  isSupported(): boolean {
    return typeof navigator !== "undefined" && "geolocation" in navigator;
  }

  getCurrentPosition(options: PositionOptions = {}): Promise<Coordinate> {
    if (!this.isSupported()) {
      return Promise.reject(
        new AppError("LOCATION_UNAVAILABLE", "Seu navegador não oferece geolocalização."),
      );
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(
              new AppError(
                "LOCATION_DENIED",
                "Permissão de localização negada. Digite a origem manualmente.",
              ),
            );
            return;
          }
          reject(
            new AppError(
              "LOCATION_UNAVAILABLE",
              "Não foi possível obter sua localização. Digite a origem manualmente.",
            ),
          );
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000, ...options },
      );
    });
  }
}

export const locationService = new BrowserLocationProvider();
