import fs from "fs";
import path from "path";
import { execa } from "execa";

// プラグイン名をサニタイズする関数
function sanitizePluginName(name) {
  // 危険な文字を除去または置換
  return name
    .replace(/[<>:"/\\|?*]/g, "") // Windowsで使用できない文字を除去
    .replace(/\.\./g, "") // Path Traversal攻撃を防ぐ
    .replace(/^[.-]+|[.-]+$/g, "") // 先頭・末尾のドットやハイフンを除去
    .replace(/^[a-zA-Z0-9_-]+$/, (match) => match) // 英数字、アンダースコア、ハイフンのみ許可
    .substring(0, 50); // 長さを制限
}

(async () => {
  const rawPluginName = process.argv[2];
  if (!rawPluginName) {
    console.error(
      "Plugin name is required. Usage: npm run create <plugin-name>"
    );
    process.exit(1);
  }

  // プラグイン名をサニタイズ
  const pluginName = sanitizePluginName(rawPluginName);

  // サニタイズ後の名前が空または無効な場合
  if (!pluginName || pluginName !== rawPluginName) {
    console.error(
      "Invalid plugin name. Use only alphanumeric characters, underscores, and hyphens."
    );
    console.error("Original name:", rawPluginName);
    console.error("Sanitized name:", pluginName);
    process.exit(1);
  }

  const dir = path.join("packages", pluginName);
  if (fs.existsSync(dir)) {
    console.error("Plugin already exists.");
    process.exit(1);
  }

  fs.mkdirSync(dir, { recursive: true });

  // srcディレクトリとそのサブディレクトリを作成
  const srcDir = path.join(dir, "src");
  fs.mkdirSync(srcDir, { recursive: true });

  const iconDir = path.join(dir, "src", "image");
  fs.mkdirSync(iconDir, { recursive: true });

  // dummy src/index.js 作成
  fs.writeFileSync(path.join(srcDir, "index.js"), 'console.log("hello");');

  // manifest.json 作成 (修正版)
  const manifest = {
    $schema:
      "https://raw.githubusercontent.com/kintone/js-sdk/%40kintone/plugin-manifest-validator%4010.2.0/packages/plugin-manifest-validator/manifest-schema.json",
    manifest_version: 1,
    version: 1,
    type: "APP",
    desktop: {},
    icon: "image/icon.png",
    config: {},
    name: {
      en: pluginName,
    },
    description: {
      en: pluginName,
    },
    mobile: {},
    homepage_url: {
      en: "https://example.com",
    },
  };

  fs.writeFileSync(
    path.join(srcDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  // dummy icon.png 作成（実際のファイルとして）
  const dummyIconData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  fs.writeFileSync(path.join(iconDir, "icon.png"), dummyIconData);

  // package.json 作成
  const packageJson = {
    name: pluginName,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {},
    devDependencies: {
      vite: "workspace:*",
    },
  };

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // vite.config.js 作成
  const viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'build',
    lib: {
      entry: 'src/index.js',
      name: '${pluginName}',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['kintone'],
      output: {
        globals: {
          kintone: 'kintone'
        }
      }
    }
  }
})`;

  fs.writeFileSync(path.join(dir, "vite.config.js"), viteConfig);

  // ppkファイル生成（@kintone/plugin-packerを使用）
  try {
    console.log("証明書を生成中...");

    // buildディレクトリを作成
    const buildDir = path.join(dir, "build");
    fs.mkdirSync(buildDir, { recursive: true });

    await execa(
      "npx",
      ["@kintone/plugin-packer", "./src", "--out", "./build/plugin.zip"],
      { cwd: dir, stdio: "inherit" }
    );

    // buildディレクトリ内のppkファイルをプラグインのルートディレクトリに移動
    const buildFiles = fs.readdirSync(buildDir);
    const ppkFiles = buildFiles.filter((file) => file.endsWith(".ppk"));

    for (const ppkFile of ppkFiles) {
      const sourcePath = path.join(buildDir, ppkFile);
      const destPath = path.join(dir, ppkFile);
      fs.renameSync(sourcePath, destPath);
    }

    // 移動されたppkファイルを確認
    const files = fs.readdirSync(dir);
    const movedPpkFiles = files.filter((file) => file.endsWith(".ppk"));
    if (movedPpkFiles.length > 0) {
      console.log(`証明書が生成されました: ${movedPpkFiles[0]}`);
      if (movedPpkFiles.length > 1) {
        console.log(`その他の証明書: ${movedPpkFiles.slice(1).join(", ")}`);
      }
    } else {
      console.log("証明書ファイルが見つかりませんでした");
    }

    console.log("プラグインがビルドされました: build/plugin.zip");
  } catch (error) {
    console.warn("証明書の生成に失敗しました。後で手動で生成してください。");
    console.warn("エラー:", error.message);
  }

  console.log(`Plugin ${pluginName} created in packages/${pluginName}`);
  console.log(
    `Run 'cd packages/${pluginName} && npm install && npm run dev' to start development`
  );
})();
