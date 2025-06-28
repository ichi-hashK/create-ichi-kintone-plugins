import { execa } from "execa";
import fs from "fs";
import path from "path";

(async () => {
  const pluginName = process.argv[2];
  if (!pluginName) {
    console.error(
      "Plugin name is required. Usage: npm run build <plugin-name> [--secret]"
    );
    process.exit(1);
  }

  // --secretフラグのチェック
  const shouldObfuscate = process.argv.includes('--secret');

  const pluginDir = path.resolve("packages", pluginName);
  if (!fs.existsSync(pluginDir)) {
    console.error(`Plugin ${pluginName} does not exist.`);
    process.exit(1);
  }

  // プラグインの種類を判別
  const viteConfigPath = path.join(pluginDir, "vite.config.js");
  const isVitePlugin = fs.existsSync(viteConfigPath);
  
  console.log(`Building plugin: ${pluginName} (${isVitePlugin ? 'Vite' : 'Traditional'} type)${shouldObfuscate ? ' with obfuscation' : ''}`);

  if (isVitePlugin) {
    // Vite型プラグインの処理
    // 1. Viteビルド
    try {
      console.log(`Running Vite build in ${pluginDir}...`);
      await execa("npm", ["run", "build"], { cwd: pluginDir, stdio: "inherit" });
      console.log("Vite build completed.");
    } catch (error) {
      console.error("Vite build failed:", error.message);
      process.exit(1);
    }

    // 2. --secretフラグがある場合のみ難読化
    if (shouldObfuscate) {
      try {
        const distPath = path.join(pluginDir, "dist");
        if (!fs.existsSync(distPath)) {
          console.error("Dist directory not found. Vite build may have failed.");
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
        
        const files = fs.readdirSync(distPath).filter((f) => f.endsWith(".js"));
        for (const file of files) {
          const filePath = path.join(distPath, file);
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
    } else {
      console.log("Skipping obfuscation (--secret flag not provided).");
    }
  } else {
    // 従来型プラグインの処理
    // src配下をdistにコピー
    try {
      console.log("Copying src to dist directory...");
      const srcDir = path.join(pluginDir, "src");
      const distDir = path.join(pluginDir, "dist");
      
      if (!fs.existsSync(srcDir)) {
        console.error("src directory not found.");
        process.exit(1);
      }
      
      if (fs.existsSync(distDir)) {
        fs.rmSync(distDir, { recursive: true, force: true });
      }
      fs.mkdirSync(distDir, { recursive: true });
      
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
      
      copyRecursive(srcDir, distDir);
      console.log("src copied to dist directory.");
    } catch (error) {
      console.error("Copy src to dist failed:", error.message);
      process.exit(1);
    }

    // 従来型プラグインでも--secretフラグがある場合は難読化
    if (shouldObfuscate) {
      try {
        const distPath = path.join(pluginDir, "dist");
        if (!fs.existsSync(distPath)) {
          console.error("Dist directory not found.");
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
        
        // dist内のjsファイルを再帰的に検索して難読化
        const obfuscateRecursive = (dir) => {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
              obfuscateRecursive(itemPath);
            } else if (item.endsWith('.js')) {
              const code = fs.readFileSync(itemPath, "utf-8");
              const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscatorConfig);
              fs.writeFileSync(itemPath, obfuscated.getObfuscatedCode());
              console.log(`Obfuscated: ${itemPath.replace(pluginDir, '')}`);
            }
          }
        };
        
        obfuscateRecursive(distPath);
        console.log("Code obfuscation completed for traditional plugin.");
      } catch (error) {
        console.error("Code obfuscation failed:", error.message);
        process.exit(1);
      }
    } else {
      console.log("Skipping obfuscation (--secret flag not provided).");
    }
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
      ["@kintone/plugin-packer", "./dist", "--out", "plugin.zip", "--ppk", ppkFile],
      { cwd: pluginDir, stdio: "inherit" }
    );
    console.log("plugin.zip generated.");
  } catch (error) {
    console.error("Plugin zip generation failed:", error.message);
    process.exit(1);
  }

  // 4. dist/ディレクトリとplugin.zipをrootのdist/プラグイン名/にコピー（zipのみ）
  try {
    const rootDistDir = path.resolve("dist", pluginName);
    if (fs.existsSync(rootDistDir)) {
      fs.rmSync(rootDistDir, { recursive: true, force: true });
    }
    fs.mkdirSync(rootDistDir, { recursive: true });

    // plugin.zipのみコピー
    const zipPath = path.join(pluginDir, "plugin.zip");
    const destZipPath = path.join(rootDistDir, `${pluginName}.zip`);
    if (fs.existsSync(zipPath)) {
      fs.copyFileSync(zipPath, destZipPath);
      console.log(`Plugin zip copied to: dist/${pluginName}/${pluginName}.zip`);
    } else {
      console.error("plugin.zip not found for copying to dist.");
      process.exit(1);
    }

    console.log(`Plugin zip only copied to: dist/${pluginName}/`);
  } catch (error) {
    console.error("Copy to dist failed:", error.message);
    process.exit(1);
  }

  // 5. 各プラグインのdistフォルダを削除
  try {
    const distDir = path.join(pluginDir, "dist");
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
      console.log("Plugin local dist directory deleted.");
    }
  } catch (error) {
    console.error("Failed to delete plugin local dist directory:", error.message);
  }

  console.log(`✅ Plugin ${pluginName} built${shouldObfuscate ? ', obfuscated' : ''}, and packaged successfully!`);
  console.log(`📁 Output: dist/${pluginName}/`);
  console.log(`📦 Plugin zip: dist/${pluginName}/${pluginName}.zip`);
})(); 
