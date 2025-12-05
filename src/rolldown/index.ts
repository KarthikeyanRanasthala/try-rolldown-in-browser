import {
  defineConfig as _defineConfig,
  type RolldownOptions,
} from "@rolldown/browser";
import {
  viteAssetPlugin,
  viteHtmlPlugin,
} from "@rolldown/browser/experimental";

export const defineConfig = (config: RolldownOptions) => {
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
    ...config,
    plugins: [
      viteAssetPlugin({
        ...basePluginConfig,
        isWorker: false,
        isSkipAssets: false,
        assetsInclude: [] as Array<string | RegExp>,
      }),
      viteHtmlPlugin({
        ...basePluginConfig,
        cssCodeSplit: false,
        modulePreload: false,
        preHooks: [],
        normalHooks: [],
        postHooks: [],
        applyHtmlTransforms: async (html: string): Promise<string> => html,
        // @ts-expect-error - says its optional but it is required
        transformIndexHtml: async (html: string): Promise<string> => html,
        setModuleSideEffects: (): void => {},
      }),
      ...(Array.isArray(config.plugins) ? config.plugins : []),
    ],
  });
};
