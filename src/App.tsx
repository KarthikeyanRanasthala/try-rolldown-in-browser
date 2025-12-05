import { rolldown } from "@rolldown/browser";
import { defineConfig } from "./rolldown";

const build = async () => {
  (
    await rolldown(
      defineConfig({
        cwd: "/",
        input: "index.html",
      })
    )
  ).generate({
    format: "esm",
  });
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
