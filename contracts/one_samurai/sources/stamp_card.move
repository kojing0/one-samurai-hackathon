/// ONE Samurai スタンプカード スマートコントラクト
/// Soulbound NFT: 転送不可、管理者のみスタンプ付与可能
module one_samurai::stamp_card {
    use sui::event;

    // ===== 定数 =====
    const DIFFICULTY_BEGINNER: u8 = 0;
    const DIFFICULTY_INTERMEDIATE: u8 = 1;
    const DIFFICULTY_ADVANCED: u8 = 2;

    // ===== エラーコード =====
    const EAlreadyStamped: u64 = 0;
    const EInvalidDifficulty: u64 = 1;

    // ===== 構造体 =====

    /// スタンプカード（Soulbound: key のみ, store/transfer なし）
    public struct StampCard has key {
        id: UID,
        owner: address,
        beginner_stamped: bool,
        intermediate_stamped: bool,
        advanced_stamped: bool,
        created_at: u64,
    }

    /// 管理者権限 Cap（スタンプ付与に必要）
    public struct AdminCap has key, store {
        id: UID,
    }

    // ===== イベント =====

    public struct StampCardMinted has copy, drop {
        card_id: address,
        owner: address,
    }

    public struct StampGranted has copy, drop {
        card_id: address,
        owner: address,
        difficulty: u8,
    }

    // ===== 初期化 =====

    /// デプロイ時に AdminCap をデプロイアドレスへ発行
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap { id: object::new(ctx) };
        transfer::transfer(admin_cap, ctx.sender());
    }

    // ===== パブリック関数 =====

    /// 初回ログイン時: スタンプカードを発行（Sponsored Transaction で呼び出す）
    public fun mint(ctx: &mut TxContext) {
        let owner = ctx.sender();
        let card = StampCard {
            id: object::new(ctx),
            owner,
            beginner_stamped: false,
            intermediate_stamped: false,
            advanced_stamped: false,
            created_at: ctx.epoch(),
        };

        event::emit(StampCardMinted {
            card_id: object::uid_to_address(&card.id),
            owner,
        });

        // Soulbound: ユーザー自身のアドレスにのみ転送
        transfer::transfer(card, owner);
    }

    /// クイズクリア時: スタンプ付与（AdminCap が必要）
    public fun add_stamp(
        _cap: &AdminCap,
        card: &mut StampCard,
        difficulty: u8,
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

    // ===== ビュー関数 =====

    public fun owner(card: &StampCard): address { card.owner }

    public fun beginner_stamped(card: &StampCard): bool { card.beginner_stamped }

    public fun intermediate_stamped(card: &StampCard): bool { card.intermediate_stamped }

    public fun advanced_stamped(card: &StampCard): bool { card.advanced_stamped }

    public fun is_stamped(card: &StampCard, difficulty: u8): bool {
        if (difficulty == DIFFICULTY_BEGINNER) card.beginner_stamped
        else if (difficulty == DIFFICULTY_INTERMEDIATE) card.intermediate_stamped
        else card.advanced_stamped
    }

    public fun all_stamped(card: &StampCard): bool {
        card.beginner_stamped && card.intermediate_stamped && card.advanced_stamped
    }
}
