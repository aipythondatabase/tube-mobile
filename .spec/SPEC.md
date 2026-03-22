# SPEC - 技術仕様・要件定義

## 機能要件
- ユーザー登録・ログイン機能
- 動画の視聴機能（YouTube公式API使用）
- 動画の投稿・編集機能
- コメント機能（動画へのコメント投稿・表示）
- 動画一覧表示・検索機能
- マイページ（投稿した動画の管理）

## 非機能要件
- 対象ユーザー数：数百人規模
- 違法性回避：YouTube公式API使用、動画ダウンロード機能なし
- 利用シーン：特定のグループ・コミュニティ内向け

## 技術構成
- フロントエンド：React Native (Expo)
- バックエンド：Firebase（Firestore、Storage、Auth）
  - 動画ストレージ：YouTube Data API v3
  - ユーザーデータ・コメント：Firestore
  - 認証：Firebase Authentication
- 動画投稿：YouTube Data APIを通じてYouTubeに直接アップロード

## バックエンド選定の理由
- Googleスプレッドシートは動画管理・リアルタイム性に不向き
- Firebaseは無料枠で数百人規模に対応可能
- YouTubeとの連携がスムーズ
