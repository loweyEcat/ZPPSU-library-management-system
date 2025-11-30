import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

// Parse DATABASE_URL if provided, otherwise use individual env vars
function parseDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      // Handle mysql://user:password@host:port/database or mysql://user@host:port/database
      // Example: mysql://root:@localhost:3306/library_system_database
      const urlMatch = databaseUrl.match(
        /^mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)$/
      );

      if (urlMatch) {
        return {
          host: urlMatch[3],
          port: parseInt(urlMatch[4]),
          user: urlMatch[1],
          password: urlMatch[2] || "",
          database: urlMatch[5],
        };
      }

      // Try without port
      const urlMatchNoPort = databaseUrl.match(
        /^mysql:\/\/([^:]+):([^@]*)@([^/]+)\/(.+)$/
      );
      if (urlMatchNoPort) {
        return {
          host: urlMatchNoPort[3],
          port: 3306,
          user: urlMatchNoPort[1],
          password: urlMatchNoPort[2] || "",
          database: urlMatchNoPort[4],
        };
      }
    } catch (error) {
      console.error("Failed to parse DATABASE_URL:", error);
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "",
  };
}

const dbConfig = parseDatabaseConfig();

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 5,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
