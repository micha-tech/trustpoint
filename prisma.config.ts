import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config({ path: ".env" });

const url = process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasourceUrl: url,
  datasource: { url },
});
