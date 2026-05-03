#!/usr/bin/env node
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "..");
const cliRoot = path.join(repoRoot, "packages/cli");
const webDistRoot = path.join(repoRoot, "apps/web/dist");
const cliWebDestination = path.join(cliRoot, "web");
const repoReadme = path.join(repoRoot, "README.md");
const cliReadmeDestination = path.join(cliRoot, "README.md");
const repoLicense = path.join(repoRoot, "LICENSE");
const cliLicenseDestination = path.join(cliRoot, "LICENSE");

const die = (message) => {
  console.error(`prepare-cli-publish: ${message}`);
  process.exit(1);
};

if (!existsSync(webDistRoot)) {
  die(
    `apps/web/dist not found. run 'pnpm build' before publishing so the bundled web UI ships with the CLI tarball.`,
  );
}

rmSync(cliWebDestination, { recursive: true, force: true });
cpSync(webDistRoot, cliWebDestination, { recursive: true });
console.log(
  `prepare-cli-publish: copied ${path.relative(repoRoot, webDistRoot)} -> ${path.relative(repoRoot, cliWebDestination)}`,
);

cpSync(repoReadme, cliReadmeDestination);
cpSync(repoLicense, cliLicenseDestination);
console.log(
  `prepare-cli-publish: copied README.md and LICENSE into ${path.relative(repoRoot, cliRoot)}`,
);
