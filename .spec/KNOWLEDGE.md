# KNOWLEDGE - ドメイン知識・調査結果

## 業務・ドメイン知識
- YouTube Data APIを使用した動画アプリ開発
- 数百人規模のコミュニティアプリ向け設計

## 調査・リサーチ結果
- GAS/スプレッドシート: API制限20,000回/日、リアルタイム性なし
- Airtable: 無料枠1,000レコード、API制限あり
- Firebase: 無料枠が大きく、リアルタイム機能あり

## 技術的な知見
- Expo SDK 55: Expo Goで動作可（Development Build必須ではない）
- react-native-webview: `npx expo install` でExpo SDK対応版をインストール
- Metroキャッシュエラー: `.expo`フォルダ削除で解決
- React Navigation: 認証状態による画面切り替え実装

## 決定事項と理由
- バックエンド: Firebase採用
  - 理由: 無料枠で数百人対応、リアルタイム機能、認証組み込み
- スプレッドシート/Airtable: 不採用
  - 理由: API制限が厳しい、リアルタイム性がない、開発工数が増える
