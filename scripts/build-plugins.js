import { execa } from "execa";
import fs from "fs";
import path from "path";

(async () => {
  const pluginName = path.basename(process.cwd());
  const rootBuildDir = path.resolve("../../build");
  if (!fs.existsSync(rootBuildDir)) fs.mkdirSync(rootBuildDir);

  const secretMode = process.argv.includes("--secret");

  await execa("vite", ["build"], { stdio: "inherit" });

  if (secretMode) {
    const JavaScriptObfuscator = (await import("javascript-obfuscator"))
      .default;
    const buildPath = path.resolve("build");
    const files = fs.readdirSync(buildPath).filter((f) => f.endsWith(".js"));

    let obfuscatorConfig = {};
    const configPath = path.resolve("obfuscator.config.js");
    if (fs.existsSync(configPath)) {
      try {
        const configModule = await import(configPath);
        obfuscatorConfig = configModule.default || configModule;
        console.log("obfuscator.config.jsを読み込みました");
      } catch (error) {
        console.warn("obfuscator.config.jsの読み込みに失敗しました:", error.message);
      }
    }

    for (const file of files) {
      const filePath = path.join(buildPath, file);
      const code = fs.readFileSync(filePath, "utf-8");
      const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscatorConfig);
      fs.writeFileSync(filePath, obfuscated.getObfuscatedCode());
    }
  }

  const outputZip = path.join(rootBuildDir, `${pluginName}.zip`);

  await execa(
    "npx",
    [
      "kintone-plugin-packer",
      "build",
      "./build",
      outputZip,
      "--ppk",
      "private.ppk",
    ],
    { stdio: "inherit" }
  );

  console.log(`Plugin packaged at build/${pluginName}.zip`);
})();
