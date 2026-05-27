import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function loadCaCert(): string | undefined {
  const certPath = resolve(process.cwd(), "certs", "aiven-ca.pem");
  try {
    return readFileSync(certPath, "utf8");
  } catch {
    return undefined;
  }
}

function parseConnectionString(url: string) {
  const u = new URL(url);
  const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
  const ca = loadCaCert();
  return {
    host: u.hostname,
    port: parseInt(u.port, 10) || 5432,
    database: u.pathname.slice(1),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: ca ? { rejectUnauthorized, ca } : { rejectUnauthorized },
  };
}

function makeClient() {
  const url = process.env.DATABASE_URL ?? "";
  const pool = new Pool(parseConnectionString(url));
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
