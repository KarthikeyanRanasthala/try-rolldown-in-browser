import { rolldown } from "@rolldown/browser";
import { defineConfig } from "./rolldown";

const html = String.raw;

const indexHtml = html`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/index.jsx"></script>
    </body>
  </html>
`;

const build = async () => {
  const build = await rolldown(
    defineConfig({
      cwd: "/",
      input: "index.html",
      virtualFsPluginOptions: {
        files: {
          "/index.html": indexHtml,
          "/src/index.jsx": `
            import React from "react";
            import ReactDOM from "react-dom/client";
            import App from "./App";

            ReactDOM.createRoot(document.getElementById("root")).render(<App />);
          `,
          "/src/App.jsx": `
            import React from "react";
            import json from "./profile.json";

            export default function App() {
              console.log(json)
              return <h1>Hello World</h1>;
            }
          `,
          "/src/profile.json": `
            {
              "name": "Karthik",
              "age": 28
            }
          `,
        },
      },
    })
  );

  const result = await build.generate({
    format: "esm",
  });

  await build.close();

  for (const output of result.output) {
    console.log(`--- ${output.fileName} ---`);
    console.log("code" in output ? output.code : output.source);
  }
};

function App() {
  return (
    <>
      <h1>Rolldown in Browser</h1>
      <button onClick={build}>Build</button>
    </>
  );
}

export default App;
