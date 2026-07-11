import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Shared MSW server for the test suite (started in src/test/setup.ts). */
export const server = setupServer(...handlers);
