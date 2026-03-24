import type { Request, Response, NextFunction } from "express";
import * as weatherService from "./weather.service";
import * as routingService from "./routing.service";

// GET /api/v1/integrations/weather?lat=31.9&lng=35.2
// GET /api/v1/integrations/weather?city=Ramallah
export async function getWeather(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, city } = req.query as Record<string, string>;

    let data: weatherService.WeatherData;

    if (city) {
      data = await weatherService.getWeatherByCity(city);
    } else if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        res.status(400).json({ error: "lat and lng must be valid numbers" });
        return;
      }

      data = await weatherService.getWeatherByCoords(parsedLat, parsedLng);
    } else {
      res.status(400).json({ error: "Provide either ?city=<name> or ?lat=<lat>&lng=<lng>" });
      return;
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/integrations/route
// Body: { origin: { lat, lng }, destination: { lat, lng } }
export async function getRoadRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const { origin, destination } = req.body as {
      origin?: { lat?: number; lng?: number };
      destination?: { lat?: number; lng?: number };
    };

    if (
      !origin?.lat || !origin?.lng ||
      !destination?.lat || !destination?.lng
    ) {
      res.status(400).json({
        error: "Body must include origin.lat, origin.lng, destination.lat, destination.lng",
      });
      return;
    }

    const route = await routingService.getRoadRoute(
      origin.lat, origin.lng,
      destination.lat, destination.lng
    );

    res.json({ data: route });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/integrations/geocode?address=Ramallah
export async function geocodeAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const { address } = req.query as { address?: string };

    if (!address?.trim()) {
      res.status(400).json({ error: "?address=<text> is required" });
      return;
    }

    const result = await routingService.geocodeAddress(address);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/integrations/reverse-geocode?lat=31.9&lng=35.2
export async function reverseGeocode(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng } = req.query as Record<string, string>;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      res.status(400).json({ error: "?lat=<num>&lng=<num> are required" });
      return;
    }

    const result = await routingService.reverseGeocode(parsedLat, parsedLng);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}