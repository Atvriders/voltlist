import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Express } from "express";
import { loadCars, CarStore } from "../src/carStore";
import { createApp, type CreateAppOptions } from "../src/app";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_PATH = resolve(here, "fixtures", "cars.sample.json");

export function testStore(): CarStore {
  return new CarStore(loadCars(FIXTURE_PATH));
}

export function testApp(opts?: CreateAppOptions): Express {
  return createApp(testStore(), opts);
}
