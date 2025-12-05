/**
 * HTTP Import Plugin for Rolldown
 * Resolves bare npm imports to ESM CDN URLs and fetches them
 * Based on rspack's BrowserHttpImportEsmPlugin
 */
import type { Plugin } from "@rolldown/browser";

const DEFAULT_CDN = "https://esm.sh";

export interface ResolvedRequest {
  request: string;
  issuer: string;
  packageName: string;
}

export interface ProcessedRequest extends ResolvedRequest {
  url: URL;
}

export interface HttpImportEsmOptions {
  /** ESM CDN domain (default: https://esm.sh). Can be string or function. */
  cdn?: string | ((resolved: ResolvedRequest) => string);
  /** Full URL overrides for packages. Checked first, bypasses other options. */
  dependencyOverrides?:
    | Record<string, string | undefined>
    | ((resolved: ResolvedRequest) => string | undefined);
  /** Version overrides for packages (default: "latest") */
  dependencyVersions?: Record<string, string | undefined>;
  /** Post-process URL (e.g., add ?external=react for esm.sh) */
  postprocess?: (request: ProcessedRequest) => void;
  /** Shared cache for fetched modules */
  cache?: Map<string, string>;
}

/** Check if string is HTTP(S) URL */
function isHttp(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

/** Parse as HTTP URL, returns undefined if invalid */
function toHttpUrl(str: string): URL | undefined {
  if (!isHttp(str)) return undefined;
  try {
    return new URL(str);
  } catch {
    return undefined;
  }
}

/**
 * Extract package name from import specifier or CDN URL path
 * - "react" -> "react"
 * - "@org/pkg/path" -> "@org/pkg"
 * - "/@org/pkg@1.0.0/es2022/index.js" -> "@org/pkg"
 */
function getPackageName(
  request: string,
  issuer: string,
  isHttpIssuer: boolean
): string {
  if (isHttpIssuer) {
    // Use issuer for relative imports, request for absolute paths
    const path = request.startsWith("/") ? request : issuer;
    const segments = path.split("/");

    // Find versioned segment: "pkg@1.0.0" (has @ but doesn't start with @)
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.includes("@") && !seg.startsWith("@")) {
        const name = seg.slice(0, seg.indexOf("@"));
        const prev = segments[i - 1];
        return prev.startsWith("@") ? `${prev}/${name}` : name;
      }
    }
  }

  // Standard: @scope/pkg or pkg
  const parts = request.split("/");
  return parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
}

/** Add version: "react" -> "react@18.2.0", "@org/pkg/path" -> "@org/pkg@1.0.0/path" */
function addVersion(request: string, version: string): string {
  const isScoped = request.startsWith("@");
  const slashIdx = isScoped
    ? request.indexOf("/", request.indexOf("/") + 1)
    : request.indexOf("/");

  if (slashIdx === -1) {
    return `${request}@${version}`;
  }
  return `${request.slice(0, slashIdx)}@${version}${request.slice(slashIdx)}`;
}

export function httpImportEsm(options: HttpImportEsmOptions = {}): Plugin {
  const {
    cdn = DEFAULT_CDN,
    dependencyOverrides,
    dependencyVersions = {},
    postprocess,
  } = options;
  const cache = options.cache ?? new Map<string, string>();

  return {
    name: "http-import-esm",

    resolveId(source, importer) {
      // Skip webpack-style loaders
      if (source.includes("!")) return null;

      const issuer = importer ?? "";
      const issuerUrl = toHttpUrl(issuer);
      const packageName = getPackageName(source, issuer, !!issuerUrl);
      const resolved: ResolvedRequest = {
        request: source,
        issuer,
        packageName,
      };

      // Check overrides first
      if (dependencyOverrides) {
        const override =
          typeof dependencyOverrides === "function"
            ? dependencyOverrides(resolved)
            : dependencyOverrides[packageName];
        if (override) return override;
      }

      // Resolve relative to HTTP issuer
      if (issuerUrl) {
        const url = new URL(source, issuerUrl);
        if (postprocess) {
          postprocess({ ...resolved, url });
          return url.toString();
        }
        return url.href;
      }

      // Convert bare imports to CDN URLs
      const isBareImport =
        !source.startsWith(".") && !source.startsWith("/") && !isHttp(source);

      if (isBareImport) {
        const domain = typeof cdn === "function" ? cdn(resolved) : cdn;
        const version = dependencyVersions[packageName] ?? "latest";
        const urlStr = `${domain}/${addVersion(source, version)}`;

        if (postprocess) {
          const url = new URL(urlStr);
          postprocess({ ...resolved, url });
          return url.toString();
        }
        return urlStr;
      }

      return null;
    },

    async load(id) {
      if (!isHttp(id)) return null;

      const cached = cache.get(id);
      if (cached) return cached;

      const res = await fetch(id);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${id}: ${res.status}`);
      }

      const code = await res.text();
      cache.set(id, code);
      return code;
    },
  };
}
