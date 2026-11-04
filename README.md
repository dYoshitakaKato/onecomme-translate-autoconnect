# わんコメ翻訳 自動接続

[わんコメ翻訳キット](https://onecomme.com/tools/translate/)の「わんコメと接続する」を自動で押す、
Tampermonkey用の非公式スクリプトです。
スクリプトの利用に追加のAPI契約やサーバーは必要ありません。

## インストール

1. 翻訳ページを使用するChromeへ、[Tampermonkey](https://www.tampermonkey.net/)を導入します。
2. 拡張機能の詳細で必要な場合は「ユーザースクリプトを許可する」を有効にします。
   [Tampermonkey公式の実行許可の案内](https://www.tampermonkey.net/faq.php#Q209)を参照してください。
3. [自動接続スクリプトをインストール](https://raw.githubusercontent.com/dYoshitakaKato/onecomme-translate-autoconnect/main/onecomme-translate-autoconnect.user.js)を開き、
   Tampermonkeyの確認画面で「インストール」を押します。
4. [わんコメ翻訳キット](https://onecomme.com/tools/translate/)を開き、使用言語・翻訳先を設定します。
5. 接続ボタンが表示され、有効になると自動で接続します。「接続済み：翻訳待機中」を確認してください。

インストール画面が開かない場合は、Tampermonkeyの「新規スクリプトを追加」で、
リンク先のコード全文を初期コードと置き換えて保存できます。
以前に手動登録した版がある場合は、その版を無効にしてから公開版をインストールしてください。

## 初回の準備と動作

- 翻訳モデルの初回準備やローカル接続の権限確認は、手動操作が必要な場合があります。
  [Chrome公式のユーザー操作条件](https://developer.chrome.com/docs/ai/get-started#user_activation)を参照してください。
- 自動接続で初期化に失敗した場合は、ページを再読み込みしてください。
  次の読込では自動操作を一度休止するので、手動で接続して初回準備を済ませられます。
- 接続ボタンの表示と有効化を最大2分待ち、同じ読込で一度だけ押します。
  接続後の再接続は公式ページの機能を使います。
- 対象は `https://onecomme.com/tools/translate` と末尾スラッシュ付きの同じページです。
  使用中の言語設定は公式ページで管理します。
- 公式ページのボタン文言や接続処理が変わった場合は、スクリプトの更新が必要です。

## 更新

公開URLを `@updateURL` と `@downloadURL` に設定しています。
Tampermonkeyの更新確認で、新しい `@version` を取得できます。
更新のタイミングはTampermonkey側の設定に従います。

## 開発と検証

Node.js 24で実行します。実OneComme・翻訳モデル・利用者のブラウザー設定は使用しません。

```sh
npm ci --ignore-scripts
npm test
npm run lint:md
```

試験では、遅延描画、無効・非表示ボタン、対象URL、多重実行、手動操作、失敗後の再読込を確認します。
ローカル試験の成功と、実Chrome・OneCommeでの接続成功は分けて確認してください。

## ライセンス

[MIT License](LICENSE)です。
