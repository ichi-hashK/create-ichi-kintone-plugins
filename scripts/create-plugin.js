import fs from "fs";
import path from "path";
import { execa } from "execa";

(async () => {
  const pluginName = process.argv[2];
  if (!pluginName) {
    console.error(
      "Plugin name is required. Usage: npm run create <plugin-name>"
    );
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

  // manifest.json 作成 (必要最小限)
  const manifest = {
    "$schema": "https://raw.githubusercontent.com/kintone/js-sdk/%40kintone/plugin-manifest-validator%4010.2.0/packages/plugin-manifest-validator/manifest-schema.json",
    "manifest_version": 1,
    "version": 1,
    "type": "APP",
    "desktop": {},
    "icon": "",
    "config": {},
    "name": {
      "en": pluginName
    },
    "description": {
      "en": pluginName
    },
    "mobile": {}
  };

  fs.writeFileSync(
    path.join(srcDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  // dummy icon.png 作成
  fs.writeFileSync(path.join(iconDir, "icon.png"), "");

  // package.json 作成
  const packageJson = {
    name: pluginName,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {},
    devDependencies: {
      vite: "workspace:*"
    }
  };

  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // vite.config.js 作成
  const viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  build: {
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

  console.log(
    `Plugin ${pluginName} created in packages/${pluginName}`
  );
  console.log(
    `Run 'cd packages/${pluginName} && npm install && npm run dev' to start development`
  );
})();