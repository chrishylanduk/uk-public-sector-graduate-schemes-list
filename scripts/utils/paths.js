import path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "..", "..");

export const paths = {
  readme: path.join(projectRoot, "README.md"),
  template: path.join(projectRoot, "templates", "layout.html"),
  staticDir: path.join(projectRoot, "static"),
  distDir: path.join(projectRoot, "dist"),
  outputHtml: path.join(projectRoot, "dist", "index.html"),
  roleConfig: path.join(projectRoot, "config", "roles.json"),
};
