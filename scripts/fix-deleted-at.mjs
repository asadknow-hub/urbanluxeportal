import fs from "fs";
import path from "path";

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    const st = fs.statSync(fp);
    if (st.isDirectory()) {
      walk(fp);
    } else if (f.endsWith(".ts") || f.endsWith(".tsx")) {
      let c = fs.readFileSync(fp, "utf8");
      if (c.includes('.eq("deleted_at", null)')) {
        c = c.split('.eq("deleted_at", null)').join('.is("deleted_at", null)');
        fs.writeFileSync(fp, c);
        console.log("Fixed:", fp);
      }
    }
  }
}

walk("src");
console.log("Done!");
