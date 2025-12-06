import { useState, useEffect, useRef, useCallback } from "react";
import { rolldown } from "@rolldown/browser";
import { defineConfig, __volume } from "./rolldown";
import { InputPanel } from "./components/InputPanel";
import { OutputPanel } from "./components/OutputPanel";
import type { SourceFile } from "./types";
import { Button } from "./components/ui/button";

const defaultFiles: SourceFile[] = [
  {
    filename: "src/App.jsx",
    text: `
import React from "react";
import "./styles.css";

export default function App() {
  return (
    <div className="container">
      <h1>Hello World</h1>
      <p>Edit the code to see changes</p>
    </div>
  );
}`,
  },
  {
    filename: "src/index.jsx",
    text: `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);`,
  },
  {
    filename: "src/styles.css",
    text: `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "SF Pro Display", system-ui, sans-serif;
  background: #0a0a0a;
  min-height: 100vh;
  color: #fafafa;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 3.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: 1rem;
}

p {
  font-size: 1.125rem;
  color: #a1a1aa;
  max-width: 28rem;
  line-height: 1.6;
}`,
  },
  {
    filename: "index.html",
    text: `
<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>`,
  },
];

function App() {
  const [inputFiles, setInputFiles] = useState<SourceFile[]>(defaultFiles);
  const [outputFiles, setOutputFiles] = useState<SourceFile[]>([]);
  const [activeInputIdx, setActiveInputIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cache = useRef(new Map<string, string>());

  const bundle = useCallback(async (files: SourceFile[]) => {
    setIsBuilding(true);
    setError(null);

    try {
      const t0 = performance.now();

      // Populate the built-in memfs with input files
      const filesMap: Record<string, string> = {};
      for (const file of files) {
        const path = file.filename.startsWith("/")
          ? file.filename
          : `/${file.filename}`;
        filesMap[path] = file.text;
      }
      __volume.reset();
      __volume.fromJSON(filesMap);

      const t1 = performance.now();
      const build = await rolldown(
        defineConfig({
          cwd: "/",
          input: "/index.html",
          httpImportEsmPluginOptions: {
            cache: cache.current,
          },
        })
      );
      const t2 = performance.now();

      const result = await build.generate({
        format: "esm",
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
      });
      const t3 = performance.now();

      await build.close();
      const t4 = performance.now();

      console.log(
        `Build: rolldown=${(t2 - t1).toFixed(0)}ms, generate=${(
          t3 - t2
        ).toFixed(0)}ms, close=${(t4 - t3).toFixed(0)}ms, total=${(
          t4 - t0
        ).toFixed(0)}ms`
      );

      const outputs: SourceFile[] = result.output.map((output) => ({
        filename: output.fileName,
        text: "code" in output ? output.code : String(output.source),
      }));

      setOutputFiles(outputs);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOutputFiles([]);
    } finally {
      setIsBuilding(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      bundle(inputFiles);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputFiles, bundle]);

  const handleFileChange = (index: number, content: string) => {
    setInputFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, text: content } : f))
    );
  };

  const handleAddFile = (filename: string) => {
    const normalized = filename.startsWith("/") ? filename.slice(1) : filename;
    if (inputFiles.some((f) => f.filename === normalized)) {
      return;
    }
    setInputFiles((prev) => [...prev, { filename: normalized, text: "" }]);
    setActiveInputIdx(inputFiles.length);
  };

  const handleDeleteFile = (index: number) => {
    if (inputFiles.length <= 1) return;
    setInputFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeInputIdx >= index && activeInputIdx > 0) {
      setActiveInputIdx(activeInputIdx - 1);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h1 className="text-lg font-semibold">Try Rolldown in Browser</h1>
        <Button variant="ghost" size="sm" asChild>
          <a
            href="https://github.com/KarthikeyanRanasthala/try-rolldown-in-browser"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </Button>
      </header>
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 h-1/2 md:h-full">
          <InputPanel
            files={inputFiles}
            activeIndex={activeInputIdx}
            onSelect={setActiveInputIdx}
            onAdd={handleAddFile}
            onDelete={handleDeleteFile}
            onChange={handleFileChange}
          />
        </div>
        <div className="flex-1 flex flex-col min-h-0 h-1/2 md:h-full">
          <OutputPanel files={outputFiles} error={error} />
          {isBuilding && (
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded">
              Building...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
