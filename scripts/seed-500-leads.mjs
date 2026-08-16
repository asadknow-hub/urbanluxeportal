import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

console.warn("seed-500-leads.mjs is retired. Running the 20-lead reset instead.");
const script = join(dirname(fileURLToPath(import.meta.url)), "reset-and-seed-20-leads.mjs");
const child = spawn(process.execPath, [script], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
