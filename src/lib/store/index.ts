import type { DataStore } from "./types";

let storePromise: Promise<DataStore> | null = null;

export async function getDataStore() {
  if (!storePromise) {
    storePromise = createStore();
  }
  return storePromise;
}

async function createStore(): Promise<DataStore> {
  const driver = process.env.DATA_DRIVER || (process.env.DATABASE_URL ? "pg" : "json");

  if (driver === "pg") {
    const { createPgStore } = await import("./pg-store");
    return createPgStore();
  }

  const { createJsonStore } = await import("./json-store");
  return createJsonStore();
}
