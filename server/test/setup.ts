import { beforeEach, afterAll } from "vitest";
import { prisma } from "../src/db";

// Truncate user data before each test for isolation. Deleting users cascades to
// favorites and cart via the schema's onDelete: Cascade.
beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
