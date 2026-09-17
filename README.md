# GeneralAstraea-JP

GeneralAstraea 日本語版で使用するスクリプト、画面、フォント、画像、内蔵ライブラリの保管先です。

## 配布

固定版: [v1.0.0](https://github.com/eumenes12ds/GeneralAstraea-JP/tree/v1.0.0)。各ファイルの固定URLとSHA-256は [manifest.json](manifest.json) に記録しています。

元のプリセットは依存資源をすでに内蔵しています。日本語版も同じ内蔵方式を維持し、このリポジトリからのオンライン読み込みを新たに要求しません。第三者CDNに対する実行時の要求は、検証した編集画面・選択肢・思考要約の再生で0件です。

- runtime/: 日本語化したSPreset本体、元と同じBase64ローダー、思考要約スクリプト
- ui/: 日本語の編集画面、選択肢、機能紹介
- fonts/、images/、vendor/: 元の内蔵資源をバイト単位で保持
- licenses/、THIRD_PARTY_NOTICES.md: 上流のライセンスと権利表示

SillyTavern本体の ./script.js、./scripts/openai.js、/version、jQuery等のホスト提供APIは、アプリケーション側の依存関係です。SVG名前空間およびコード内の文書・ライセンスURLは読み込み先ではありません。

プリセット本文、接続先、認証情報、アカウント設定、会話履歴はこのリポジトリに含めません。利用者向けテキストを日本語化し、プロトコルの変数名、イベント名、コードの識別子は互換性のため維持しています。
