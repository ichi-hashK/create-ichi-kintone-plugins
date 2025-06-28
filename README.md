# create-ichi-kintone-plugins

Viteを使用したモダンなビルドツールでKintoneプラグインを作成するCLIツールです。

## 機能

- 🚀 **モダンなビルドツール**: 高速な開発とビルドのためのViteを使用
- 📝 **TypeScript対応**: JavaScriptとTypeScriptの選択が可能
- 🔐 **自動証明書生成**: プラグイン署名用のprivate.ppkを自動生成
- ⚡ **高速開発**: ホットモジュール置換と最適化されたビルド
- 🔒 **コード難読化**: 本番ビルド用のオプションコード難読化

## 前提条件

- Node.js 18.0.0以上
- npm 8.0.0以上

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

新しいKintoneプラグインを作成:

```bash
npm run create <プラグイン名>
```

### 例

```bash
npm run create my-awesome-plugin
```

これにより以下が実行されます:

1. `packages/my-awesome-plugin`ディレクトリを作成
2. 基本的なKintoneプラグイン構造でViteプロジェクトをセットアップ
3. プラグイン署名用の`private.ppk`ファイルを生成
4. Kintoneプラグイン開発用にプロジェクトを設定

## プロジェクト構造

```
create-ichi-kintone-plugins/
├── packages/           # 生成されたプラグイン
│   └── <プラグイン名>/
│       ├── src/        # ソースコード
│       ├── build/      # ビルドされたファイル
│       ├── private.ppk # プラグイン証明書
│       └── package.json
├── scripts/
│   ├── create-plugin.js # プラグイン作成スクリプト
│   └── build-plugins.js # 難読化付きプラグインビルドスクリプト
├── package.json
└── README.md
```

## 開発

### 利用可能なスクリプト

- `npm run create <名前>` - 新しいプラグインを作成

## プラグインのビルド

プラグインを作成した後、プラグインディレクトリに移動してビルド:

```bash
cd packages/my-awesome-plugin
npm install
npm run build
```

### コード難読化

コード難読化付きの本番ビルドには、`--secret`フラグを使用:

```bash
npm run build -- --secret
```

これにより、知的財産を保護するためにJavaScriptコードが難読化されます。

ビルドされたプラグインは`build/`ディレクトリに配置されます。

## プラグインのデプロイ

1. `npm run build`（または難読化ビルドには`npm run build -- --secret`）でプラグインをビルド
2. 生成された`private.ppk`を使用してプラグインに署名
3. 署名されたプラグインをKintoneインスタンスにアップロード

## コントリビューション

1. リポジトリをフォーク
2. 機能ブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add some amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 謝辞

- [Kintone Plugin Packer](https://github.com/kintone/plugin-packer) - プラグインのパッケージングと署名用
- [Vite](https://vitejs.dev/) - ビルドツール用
- [JavaScript Obfuscator](https://obfuscator.io/) - コード難読化用
- [Turbo](https://turbo.build/) - モノレポ管理用

## サポート

問題が発生した場合や質問がある場合は、GitHubで[issueを作成](https://github.com/ichi-hashK/create-ichi-kintone-plugins/issues)してください。
