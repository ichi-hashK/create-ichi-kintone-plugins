import { execa } from "execa";
import fs from "fs";
import path from "path";

(async () => {
  const pluginName = process.argv[2];
  if (!pluginName) {
    console.error(
      "Plugin name is required. Usage: npm run build <plugin-name>"
    );
    process.exit(1);
  }

  const pluginDir = path.resolve("packages", pluginName);
  if (!fs.existsSync(pluginDir)) {
    console.error(`Plugin ${pluginName} does not exist.`);
    process.exit(1);
  }

  // 1. Viteビルド
  try {
    console.log(`Running Vite build in ${pluginDir}...`);
    await execa("npm", ["run", "build"], { cwd: pluginDir, stdio: "inherit" });
    console.log("Vite build completed.");
  } catch (error) {
    console.error("Vite build failed:", error.message);
    process.exit(1);
  }

  // 2. build/内のjsをobfuscate
  try {
    const buildPath = path.join(pluginDir, "build");
    if (!fs.existsSync(buildPath)) {
      console.error("Build directory not found. Vite build may have failed.");
      process.exit(1);
    }
    const JavaScriptObfuscator = (await import("javascript-obfuscator")).default;
    let obfuscatorConfig = {};
    
    // rootのobfuscator.config.jsを読み込み
    const configPath = path.join(process.cwd(), "obfuscator.config.js");
    if (fs.existsSync(configPath)) {
      try {
        // fileスキームを付与してimport（Windows対応）
        const configModule = await import('file://' + configPath.replace(/\\/g, '/'));
        obfuscatorConfig = configModule.default || configModule;
        console.log("rootのobfuscator.config.jsを読み込みました");
      } catch (error) {
        console.warn("rootのobfuscator.config.jsの読み込みに失敗しました:", error.message);
      }
    } else {
      console.warn("rootのobfuscator.config.jsが見つかりません。デフォルト設定を使用します。");
    }
    
    const files = fs.readdirSync(buildPath).filter((f) => f.endsWith(".js"));
    for (const file of files) {
      const filePath = path.join(buildPath, file);
      const code = fs.readFileSync(filePath, "utf-8");
      const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscatorConfig);
      fs.writeFileSync(filePath, obfuscated.getObfuscatedCode());
      console.log(`Obfuscated: ${file}`);
    }
    console.log("Code obfuscation completed.");
  } catch (error) {
    console.error("Code obfuscation failed:", error.message);
    process.exit(1);
  }

  // 3. plugin.zipを生成
  try {
    console.log("Generating plugin.zip...");
    
    // 既存のppkファイルを探す
    const pluginFiles = fs.readdirSync(pluginDir);
    const ppkFiles = pluginFiles.filter(file => file.endsWith('.ppk'));
    
    if (ppkFiles.length === 0) {
      console.error("No ppk file found. Please create a plugin first with 'npm run create'.");
      process.exit(1);
    }
    
    const ppkFile = ppkFiles[0]; // 最初のppkファイルを使用
    console.log(`Using existing ppk file: ${ppkFile}`);
    
    await execa(
      "npx",
      ["@kintone/plugin-packer", "./build", "--out", "plugin.zip", "--ppk", ppkFile],
      { cwd: pluginDir, stdio: "inherit" }
    );
    console.log("plugin.zip generated.");
  } catch (error) {
    console.error("Plugin zip generation failed:", error.message);
    process.exit(1);
  }

  // 4. build/ディレクトリとplugin.zipをrootのdist/プラグイン名/にコピー
  try {
    const rootDistDir = path.resolve("dist", pluginName);
    if (fs.existsSync(rootDistDir)) {
      fs.rmSync(rootDistDir, { recursive: true, force: true });
    }
    fs.mkdirSync(rootDistDir, { recursive: true });
    const buildPath = path.join(pluginDir, "build");
    const copyRecursive = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        for (const file of files) {
          copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursive(buildPath, rootDistDir);
    
    // plugin.zipもコピー
    const zipPath = path.join(pluginDir, "plugin.zip");
    const destZipPath = path.join(rootDistDir, `${pluginName}.zip`);
    if (fs.existsSync(zipPath)) {
      fs.copyFileSync(zipPath, destZipPath);
      console.log(`Plugin zip copied to: dist/${pluginName}/${pluginName}.zip`);
    }
    
    console.log(`Plugin build copied to: dist/${pluginName}/`);
  } catch (error) {
    console.error("Copy to dist failed:", error.message);
    process.exit(1);
  }

  console.log(`✅ Plugin ${pluginName} built, obfuscated, and packaged successfully!`);
  console.log(`📁 Output: dist/${pluginName}/`);
  console.log(`📦 Plugin zip: dist/${pluginName}/${pluginName}.zip`);
})(); 