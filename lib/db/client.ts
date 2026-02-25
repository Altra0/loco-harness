import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/loco?sslmode=disable";
const sql = neon(url);
export const db = drizzle(sql, { schema });
