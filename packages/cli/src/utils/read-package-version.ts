import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const packageJsonSchema = z.object({ version: z.string().min(1) });

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(moduleDir, "../../package.json");

export const readPackageVersion = (): string => {
  const parsed = packageJsonSchema.parse(JSON.parse(readFileSync(packageJsonPath, "utf8")));
  return parsed.version;
};
