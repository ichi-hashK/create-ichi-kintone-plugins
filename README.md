# create-ichi-kintone-plugins

Kintone プラグイン開発用の CLI ツールです。Vite を使用したモダンなビルドと従来型の両方に対応しています。

## 機能

- 🚀 **柔軟なビルド対応**: Vite 型と従来型プラグインの両方をサポート
- 📝 **自動プラグイン生成**: 基本的な Kintone プラグイン構造を自動生成
- 🔐 **自動証明書生成**: プラグイン署名用の.ppk ファイルを自動生成
- ⚡ **高速開発**: Vite 型ではホットモジュール置換と最適化されたビルド
- 🔒 **コード難読化**: 本番ビルド用のオプションコード難読化
- 📦 **自動パッケージング**: ビルド後の自動 zip 化と配布用ファイル生成

## 前提条件

- Node.js 18.0.0 以上
- npm 8.0.0 以上

## インストール

1. リポジトリをクローン:

```bash
git clone https://github.com/ichi-hashK/create-ichi-kintone-plugins.git
cd create-ichi-kintone-plugins
```

2. 依存関係をインストール:

```bash
npm install
```

## 使用方法

### 新しい Kintone プラグインを作成

```bash
npm run create <プラグイン名>
```

#### 例

```bash
npm run create my-awesome-plugin
```

これにより以下が実行されます:

1. `packages/my-awesome-plugin`ディレクトリを作成
2. 基本的な Kintone プラグイン構造をセットアップ
3. プラグイン署名用の`.ppk`ファイルを生成
4. 必要な設定ファイルを配置

## プラグインの種類

このツールは 2 種類のプラグインをサポートしています：

### 1. Vite 型プラグイン（モダン）

- `vite.config.js`が存在する場合
- Vite を使用した高速なビルド
- ホットモジュール置換対応
- TypeScript 対応
- 最適化されたバンドル

### 2. 従来型プラグイン（シンプル）

- `vite.config.js`が存在しない場合
- `src/`フォルダの内容をそのまま使用
- 追加のビルド処理なし
- シンプルな構成で軽量

## プロジェクト構造

```
create-ichi-kintone-plugins/
├── packages/           # 生成されたプラグイン
│   ├── sample/         # 従来型プラグインの例
│   │   ├── src/        # ソースコード
│   │   │   ├── js/     # JavaScriptファイル
│   │   │   ├── css/    # CSSファイル
│   │   │   ├── html/   # HTMLファイル
│   │   │   ├── image/  # 画像ファイル
│   │   │   └── manifest.json
│   │   └── *.ppk       # プラグイン証明書
│   └── <プラグイン名>/  # Vite型プラグイン
│       ├── src/        # ソースコード
│       ├── dist/       # ビルドされたファイル（一時的）
│       ├── vite.config.js
│       ├── package.json
│       └── *.ppk       # プラグイン証明書
├── dist/               # 配布用ファイル
│   └── <プラグイン名>/
│       └── <プラグイン名>.zip
├── scripts/
│   ├── create-plugin.js # プラグイン作成スクリプト
│   └── build-plugin.js  # ビルド・難読化・パッケージングスクリプト
├── obfuscator.config.js # 難読化設定
├── package.json
└── README.md
```

## プラグインのビルド

### プラグインのビルド

```bash
# 通常ビルド（難読化なし）
npm run build <プラグイン名>

# 難読化付きビルド
npm run build <プラグイン名> --secret
```

#### 例

```bash
# 通常ビルド
npm run build sample

# 難読化付きビルド
npm run build sample --secret
```

### ビルド処理の詳細

#### Vite 型プラグインの場合

1. **Vite ビルド**: `npm run build`を実行
2. **コード難読化**: `--secret`フラグがある場合のみ JavaScript ファイルを難読化
3. **プラグイン zip 化**: `@kintone/plugin-packer`で zip 作成
4. **配布用ファイル生成**: `dist/<プラグイン名>/<プラグイン名>.zip`に配置
5. **一時ファイル削除**: 各プラグインの`dist/`フォルダを削除

#### 従来型プラグインの場合

1. **ソースコピー**: `src/`の内容を`dist/`にコピー
2. **コード難読化**: `--secret`フラグがある場合のみ JavaScript ファイルを難読化（`dist/`配下のjsを再帰的に処理）
3. **プラグイン zip 化**: `@kintone/plugin-packer`で zip 作成
4. **配布用ファイル生成**: `dist/<プラグイン名>/<プラグイン名>.zip`に配置
5. **一時ファイル削除**: 各プラグインの`dist/`フォルダを削除

### コード難読化について

- **`--secret`フラグ**: Vite型・従来型どちらのプラグインでも、`--secret`フラグを付けてビルドするとJavaScriptファイルが難読化されます。
- **難読化設定**: `obfuscator.config.js`でカスタマイズ可能
- **難読化しない場合**: `--secret`フラグを付けなければ難読化は行われません

### ビルド成果物

- **配布用 zip**: `dist/<プラグイン名>/<プラグイン名>.zip`
- この zip ファイルを Kintone にアップロードして使用

## 開発

### 利用可能なスクリプト

- `npm run create <名前>` - 新しいプラグインを作成
- `npm run build <名前>` - プラグインをビルド・パッケージング
- `npm run build <名前> --secret` - プラグインをビルド・難読化・パッケージング（Vite型のみ）

### 難読化設定

`obfuscator.config.js`で難読化の設定をカスタマイズできます：

```javascript
export default {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: true,
  identifierNamesGenerator: "hexadecimal",
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};
```

## プラグインのデプロイ

1. `npm run build <プラグイン名>`でプラグインをビルド
2. 生成された`dist/<プラグイン名>/<プラグイン名>.zip`を Kintone インスタンスにアップロード
3. プラグインを有効化して使用開始

## プラグイン開発のベストプラクティス

### Vite 型プラグイン（推奨）

- 複雑な機能や多数のファイルがある場合
- TypeScript を使用したい場合
- モジュール分割や最適化が必要な場合

### 従来型プラグイン

- シンプルな機能の場合
- 軽量なプラグインを作りたい場合
- 既存の Kintone プラグインを移植する場合

## トラブルシューティング

### よくある問題

1. **ビルドエラー**: プラグイン名が正しく指定されているか確認
2. **ppk ファイルが見つからない**: `npm run create`でプラグインを正しく作成したか確認
3. **Vite ビルドエラー**: `vite.config.js`の設定を確認

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 謝辞

- [Kintone Plugin Packer](https://github.com/kintone/js-sdk/tree/main/packages/plugin-packer) - プラグインのパッケージングと署名用
- [Vite](https://vitejs.dev/) - ビルドツール用
- [JavaScript Obfuscator](https://obfuscator.io/) - コード難読化用