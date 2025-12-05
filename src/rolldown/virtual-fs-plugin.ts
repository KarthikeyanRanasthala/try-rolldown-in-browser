import type { Plugin } from "@rolldown/browser";

export interface VirtualFsOptions {
  /** Map of absolute file paths to their contents */
  files: Record<string, string>;
  /** Extensions to try when resolving (default: standard web extensions) */
  extensions?: string[];
}

const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"];

/** Resolve relative path against base */
function resolvePath(base: string, relative: string): string {
  const parts = base.split("/").filter(Boolean);
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return "/" + parts.join("/");
}

/** Split path from query/hash: "./a.css?raw" -> ["./a.css", "?raw"] */
function splitQuery(path: string): [string, string] {
  // Match first occurrence of ? or #
  const i = path.search(/[?#]/);
  return i >= 0 ? [path.slice(0, i), path.slice(i)] : [path, ""];
}

/** Build resolution map for O(1) lookups */
function buildResolutionMap(
  files: Record<string, string>,
  extensions: string[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const filePath of Object.keys(files)) {
    // Exact match
    map.set(filePath, filePath);

    // Extensionless: /App.tsx -> /App
    const ext = extensions.find((e) => filePath.endsWith(e));
    if (ext) {
      const base = filePath.slice(0, -ext.length);
      if (!map.has(base)) map.set(base, filePath);
    }

    // Directory index: /utils/index.ts -> /utils
    // Matches: /path/index.js, /path/index.jsx, /path/index.ts, /path/index.tsx
    const match = filePath.match(/^(.+)\/index\.[jt]sx?$/);
    if (match && !map.has(match[1])) {
      map.set(match[1], filePath);
    }
  }

  return map;
}

export function virtualFs(options: VirtualFsOptions = { files: {} }): Plugin {
  const { files, extensions = DEFAULT_EXTENSIONS } = options;
  const resolutionMap = buildResolutionMap(files, extensions);

  return {
    name: "virtual-fs",

    resolveId(source, importer) {
      const [cleanSource, query] = splitQuery(source);

      // Resolve to absolute path
      let absolute: string;
      if (cleanSource.startsWith(".")) {
        // Get directory: "/src/App.tsx" -> "/src"
        const dir = importer?.replace(/\/[^/]+$/, "") || "";
        absolute = resolvePath(dir, cleanSource);
      } else {
        absolute = cleanSource.startsWith("/")
          ? cleanSource
          : "/" + cleanSource;
      }

      const resolved = resolutionMap.get(absolute);
      return resolved ? resolved + query : null;
    },

    load(id) {
      const [cleanId] = splitQuery(id);
      return files[cleanId] ?? null;
    },
  };
}
