# MEMORY

## プロジェクト概要
- スマホYouTubeアプリ（React Native/Expo）
- 数百人規模のコミュニティ向け
- YouTube公式API使用（違法性回避）

## 学習した知識・教訓

### 2026-03-22 セッション1

#### 技術スタック決定
- **バックエンド**: Firebase採用（Airtable・スプレッドシートは不採用）
  - 理由: GAS/スプレッドシートはAPI制限が厳しい（20,000回/日）
  - Firebaseは無料枠で十分、リアルタイム機能が使える
- **認証**: Firebase Authentication（Email/Password）
- **動画**: YouTube Data API v3

#### 実装完了
- ✅ Firebaseプロジェクトセットアップ
- ✅ ログイン/登録画面
- ✅ 動画一覧表示
- ✅ 動画再生
- ✅ 検索機能

#### トラブルシューティング
- **Expo SDK 55**: Expo Goで動作可
- **react-native-webview**: `npx expo install react-native-webview` でインストール必要
- **Metroキャッシュエラー**: `.expo`フォルダ削除で解決

#### 次回タスク
- 動画投稿画面
- 動画編集機能
- コメント機能
- マイページ
