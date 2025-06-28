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

  // package.json 作成（rootのviteを使う設定）
  const pkg = {
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
    JSON.stringify(pkg, null, 2)
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

  // src/index.js 作成
  const srcDir = path.join(dir, "src");
  fs.mkdirSync(srcDir, { recursive: true });

  const indexJs = `// Kintone Plugin Entry Point
console.log('${pluginName} plugin loaded');

// Your plugin code here
kintone.events.on('app.record.index.show', function(event) {
  console.log('${pluginName}: App record index show event');
  return event;
});`;

  fs.writeFileSync(path.join(srcDir, "index.js"), indexJs);

  // private.ppk 生成
  await execa(
    "npx",
    ["@kintone/plugin-packer", "generate-cert", "--out", "private.ppk"],
    { cwd: dir, stdio: "inherit" }
  );

  console.log(
    `Plugin ${pluginName} created in packages/${pluginName} with private.ppk`
  );
  console.log(
    `Run 'cd packages/${pluginName} && npm run dev' to start development`
  );
})();
