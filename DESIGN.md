# ONE Samurai クイズアプリ 設計書

## 概要

ONE Samurai（格闘技）をテーマにしたクイズアプリ。
Googleログインで認証し、初級・中級・上級のクイズに全問正解するとSuiブロックチェーン上のスタンプカードにスタンプが押される。

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js (App Router) |
| 認証 | Firebase Authentication (Google OAuth) |
| バックエンド | Google Cloud Run |
| データベース | Cloud Firestore |
| 秘密情報管理 | Google Cloud Secret Manager |
| ブロックチェーン | Sui (Testnet → Mainnet) |
| スマートコントラクト | Move言語 |
| ウォレット方式 | zkLogin + Sponsored Transactions |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                     │
│                                                         │
│  ・Googleログインボタン                                 │
│  ・スタンプカード表示（オンチェーンデータ取得）         │
│  ・クイズUI（4択）                                      │
│  ・進捗表示                                             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS API
┌──────────────────────▼──────────────────────────────────┐
│              Backend (Google Cloud Run)                 │
│                                                         │
│  ┌────────────────┐  ┌─────────────────┐               │
│  │ Auth Service   │  │  Quiz Service   │               │
│  │ Firebase Auth  │  │ ・問題取得      │               │
│  │ JWT検証        │  │ ・回答判定      │               │
│  └───────┬────────┘  └────────┬────────┘               │
│          │                    │                         │
│  ┌───────▼────────────────────▼────────┐               │
│  │       Sui Transaction Service       │               │
│  │ ・zkLoginプロキシ                   │               │
│  │ ・スポンサードトランザクション署名  │               │
│  │ ・Sponsorウォレット管理             │               │
│  └─────────────────────────────────────┘               │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
┌────────▼────────┐         ┌─────────▼────────────────┐
│  Cloud Firestore│         │  Google Secret Manager   │
│ ・クイズ問題    │         │  ・Sponsorウォレット秘密鍵│
│ ・ユーザー進捗  │         └──────────────────────────┘
│ ・セッション情報│
└────────┬────────┘
         │
┌────────▼──────────────────────────────────────────────┐
│                   Sui Blockchain                      │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │         StampCard Object (Soulbound)           │  │
│  │                                                │  │
│  │   id: UID                                      │  │
│  │   owner: address          ← zkLoginで生成      │  │
│  │   beginner_stamped: bool                       │  │
│  │   intermediate_stamped: bool                   │  │
│  │   advanced_stamped: bool                       │  │
│  │   created_at: u64                              │  │
│  └────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

---

## 認証・ウォレットフロー（zkLogin）

```
1. ユーザーが「Googleでログイン」をクリック
       ↓
2. Firebase Auth で Google OAuth認証
   → Google JWTトークン取得
       ↓
3. バックエンドでzkLogin処理
   Google JWT + ランダムnonce
   → ゼロ知識証明を生成
   → ユーザー固有のSuiアドレスを決定論的に導出
       ↓
4. 初回ログイン時のみ: スタンプカード発行
   Sponsor（アプリのサーバーウォレット）がガス代を負担
   → StampCard Objectをユーザーのアドレスに発行
   → Firestoreにユーザー情報・Suiアドレスを保存
       ↓
5. ログイン完了 → クイズ画面へ
```

```
クイズクリア時:
   バックエンドで回答を検証（全問正解）
       ↓
   Sponsorがスポンサードトランザクションを作成・署名
       ↓
   on-chain: StampCard の該当難易度フラグを true に更新
       ↓
   フロントエンドにトランザクション結果を返却
   → スタンプがアニメーションで押される
```

---

## スマートコントラクト設計（Move）

### モジュール構成

```
one_samurai/
└── sources/
    ├── stamp_card.move     # スタンプカードのコアロジック
    └── admin.move          # 管理者権限（スタンプ付与権限）
```

### stamp_card.move

```move
module one_samurai::stamp_card {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;

    // 難易度定数
    const DIFFICULTY_BEGINNER: u8 = 0;
    const DIFFICULTY_INTERMEDIATE: u8 = 1;
    const DIFFICULTY_ADVANCED: u8 = 2;

    // エラーコード
    const EAlreadyStamped: u64 = 0;
    const EInvalidDifficulty: u64 = 1;
    const ENotAuthorized: u64 = 2;

    // Soulbound NFT（key のみ、store/transferなし）
    public struct StampCard has key {
        id: UID,
        owner: address,
        beginner_stamped: bool,
        intermediate_stamped: bool,
        advanced_stamped: bool,
        created_at: u64,
    }

    // 管理者権限 Cap
    public struct AdminCap has key, store {
        id: UID,
    }

    // スタンプ付与イベント
    public struct StampGranted has copy, drop {
        card_id: address,
        owner: address,
        difficulty: u8,
    }

    // デプロイ時に AdminCap を発行
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // 初回ログイン時: スタンプカード発行
    // Sponsored Transaction でアプリが呼び出す
    public fun mint(ctx: &mut TxContext) {
        let card = StampCard {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            beginner_stamped: false,
            intermediate_stamped: false,
            advanced_stamped: false,
            created_at: tx_context::epoch(ctx),
        };
        // transfer（Soulbound: 本人アドレスにのみ送付）
        transfer::transfer(card, tx_context::sender(ctx));
    }

    // クイズクリア時: スタンプ付与（AdminCapが必要）
    public fun add_stamp(
        _cap: &AdminCap,
        card: &mut StampCard,
        difficulty: u8,
        ctx: &TxContext,
    ) {
        assert!(difficulty <= DIFFICULTY_ADVANCED, EInvalidDifficulty);

        if (difficulty == DIFFICULTY_BEGINNER) {
            assert!(!card.beginner_stamped, EAlreadyStamped);
            card.beginner_stamped = true;
        } else if (difficulty == DIFFICULTY_INTERMEDIATE) {
            assert!(!card.intermediate_stamped, EAlreadyStamped);
            card.intermediate_stamped = true;
        } else {
            assert!(!card.advanced_stamped, EAlreadyStamped);
            card.advanced_stamped = true;
        };

        event::emit(StampGranted {
            card_id: object::uid_to_address(&card.id),
            owner: card.owner,
            difficulty,
        });
    }

    // ビュー関数
    public fun is_stamped(card: &StampCard, difficulty: u8): bool {
        if (difficulty == DIFFICULTY_BEGINNER) card.beginner_stamped
        else if (difficulty == DIFFICULTY_INTERMEDIATE) card.intermediate_stamped
        else card.advanced_stamped
    }
}
```

---

## Firestore データ設計

### コレクション構成

```
firestore/
├── users/
│   └── {uid}/
│       ├── suiAddress: string        # zkLoginで生成したSuiアドレス
│       ├── email: string
│       ├── displayName: string
│       ├── stampCardObjectId: string # on-chainのObject ID
│       └── createdAt: timestamp
│
├── quizzes/
│   └── {quizId}/
│       ├── difficulty: "beginner" | "intermediate" | "advanced"
│       ├── question: string
│       ├── choices: string[]         # 4択の選択肢
│       ├── correctIndex: number      # 正解のindex（0〜3）
│       └── order: number             # 問題の表示順
│
└── quiz_sessions/
    └── {sessionId}/
        ├── uid: string
        ├── difficulty: string
        ├── answers: number[]         # ユーザーの回答履歴
        ├── completed: boolean
        ├── passed: boolean
        └── createdAt: timestamp
```

---

## API設計（Cloud Run）

### エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/auth/verify` | Firebase JWTを検証し、zkLoginでSuiアドレスを生成 |
| POST | `/stamp-card/mint` | 初回: スタンプカードをon-chainで発行 |
| GET | `/stamp-card` | スタンプカード情報を取得（Suiチェーンから） |
| GET | `/quiz/:difficulty` | 指定難易度のクイズ問題一覧を取得 |
| POST | `/quiz/session/start` | クイズセッション開始 |
| POST | `/quiz/session/answer` | 回答を送信・全問正解時にスタンプ付与 |

### POST /quiz/session/answer レスポンス例

```json
{
  "correct": true,
  "allPassed": true,
  "stampGranted": true,
  "txDigest": "8xJk...abc123",
  "stampCard": {
    "beginner": true,
    "intermediate": false,
    "advanced": false
  }
}
```

---

## クイズ仕様

### 難易度別設定

| 難易度 | 問題数 | 内容レベル |
|-------|-------|-----------|
| 初級 | 5問 | ONE Samurai の基本知識 |
| 中級 | 7問 | 選手・試合の詳細知識 |
| 上級 | 10問 | 技術・ルールの深い知識 |

### クイズルール

- 4択形式
- **全問正解でスタンプ付与**（部分点なし）
- 不正解の場合は**何度でもリトライ可能**
- 一度スタンプを取得した難易度は再挑戦不要（スタンプはオンチェーンで保持）
- 時間制限: 将来実装予定

### 問題例（初級）

```json
{
  "question": "ONE Samuraiとはどのような格闘技大会ですか？",
  "choices": [
    "ボクシング専門の大会",
    "総合格闘技・武術の世界的な大会",
    "相撲の国際大会",
    "柔道のワールドカップ"
  ],
  "correctIndex": 1
}
```

---

## セキュリティ設計

### バックエンド

- Firebase JWT を全APIで必須検証
- クイズ正解判定はサーバーサイドのみで実施（フロントに正解を渡さない）
- Sponsorウォレットの秘密鍵はSecret Managerで管理（コードに埋め込まない）
- AdminCapはSponsorウォレットが保持（デプロイ時に移転）

### スマートコントラクト

- `StampCard` は `key` のみ（`store` なし）→ 転送API不可（Soulbound）
- スタンプ付与には `AdminCap` が必須 → ユーザーが自分でスタンプを付与不可
- 同一難易度の二重スタンプをコントラクト側でrevert

### フロントエンド

- Suiアドレス・秘密情報はフロントエンドに渡さない
- セッション管理はFirebase Auth（HttpOnly Cookie推奨）

---

## ディレクトリ構成

```
one-samurai-hackathon/
├── contracts/                    # Suiスマートコントラクト（Move）
│   └── one_samurai/
│       ├── Move.toml
│       └── sources/
│           ├── stamp_card.move
│           └── admin.move
│
├── backend/                      # Cloud Run バックエンド（Node.js/TypeScript）
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── stamp_card.ts
│   │   │   └── quiz.ts
│   │   ├── services/
│   │   │   ├── sui_service.ts    # zkLogin・トランザクション処理
│   │   │   ├── quiz_service.ts
│   │   │   └── firebase_service.ts
│   │   └── index.ts
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                     # Next.js フロントエンド
│   ├── app/
│   │   ├── page.tsx              # トップ（ログイン）
│   │   ├── stamp-card/
│   │   │   └── page.tsx          # スタンプカード表示
│   │   └── quiz/
│   │       └── [difficulty]/
│   │           └── page.tsx      # クイズ画面
│   ├── components/
│   │   ├── StampCard.tsx
│   │   ├── QuizQuestion.tsx
│   │   └── GoogleLoginButton.tsx
│   └── package.json
│
└── DESIGN.md
```

---

## 開発フェーズ

### Phase 1: スマートコントラクト
- Move言語でStampCardコントラクト実装
- Sui Localnet/Testnetでテスト
- AdminCap・Sponsorウォレットのセットアップ

### Phase 2: バックエンド基盤
- Firebase Auth設定
- Cloud Run環境構築
- zkLogin実装（Google JWT → Suiアドレス導出）
- Sponsored Transaction実装

### Phase 3: クイズロジック
- Firestoreにクイズデータ投入
- クイズAPI実装（問題取得・回答判定・スタンプ付与）

### Phase 4: フロントエンド
- Next.js プロジェクトセットアップ
- Googleログイン画面
- スタンプカード表示画面
- クイズ画面（4択UI）

### Phase 5: 統合テスト・デプロイ
- E2Eフロー検証
- Sui Testnetでの通しテスト
- Cloud Runデプロイ
- Sui Mainnetデプロイ

---

## 将来拡張

- クイズの時間制限機能
- スタンプコンプリート特典（追加NFT発行など）
- リーダーボード
- 多言語対応（英語）
- モバイルアプリ（React Native / Expo）
