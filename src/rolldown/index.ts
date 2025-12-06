import {
  defineConfig as _defineConfig,
  type RolldownOptions,
} from "@rolldown/browser";
import {
  viteAssetPlugin,
  viteCSSPlugin,
  viteCSSPostPlugin,
  viteHtmlPlugin,
} from "@rolldown/browser/experimental";
// @ts-expect-error - internal binding module exports __volume (aliased in vite.config.ts)
import { __volume } from "@rolldown/browser/binding";
import {
  httpImportEsm,
  type HttpImportEsmOptions,
} from "./http-import-esm-plugin";

// Re-export the memfs volume for direct access
export { __volume };

interface ExtendedRolldownOptions extends RolldownOptions {
  httpImportEsmPluginOptions?: HttpImportEsmOptions;
}

export const defineConfig = (config: ExtendedRolldownOptions) => {
  const { httpImportEsmPluginOptions, ...rolldownConfig } = config;
  const root = "/";

  const basePluginConfig = {
    root,
    isLib: false,
    isSsr: false,
    urlBase: "./",
    publicDir: `${root}/public`,
    decodedBase: "./",
    assetInlineLimit: 4096,
  };

  return _defineConfig({
    ...rolldownConfig,
    plugins: [
      httpImportEsm(httpImportEsmPluginOptions),
      viteAssetPlugin({
        ...basePluginConfig,
        isWorker: false,
        isSkipAssets: false,
        assetsInclude: [] as Array<string | RegExp>,
      }),
      viteCSSPlugin({
        ...basePluginConfig,
        // 2nd param is actually CSS content (not importer path as TS types suggest)
        compileCSS: async (_url, cssContent) => ({ code: cssContent }),
        // Required by binding, but unused since compileCSS doesn't use the resolver
        resolveUrl: async () => undefined,
      }),
      viteCSSPostPlugin({
        ...basePluginConfig,
        isWorker: false,
        isClient: true,
        cssCodeSplit: true,
        sourcemap: false,
        assetsDir: "",
      }),
      viteHtmlPlugin({
        ...basePluginConfig,
        cssCodeSplit: true,
        modulePreload: false,
        preHooks: [],
        normalHooks: [],
        postHooks: [],
        applyHtmlTransforms: async (html: string): Promise<string> => html,
        // @ts-expect-error - required by Rust binding but not in TS types
        transformIndexHtml: async (html: string): Promise<string> => html,
        setModuleSideEffects: (): void => {},
      }),
      ...(Array.isArray(rolldownConfig.plugins) ? rolldownConfig.plugins : []),
    ],
  });
};
