import 'dotenv/config';
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

const quizzes = [
  // ===== 初級（5問）=====
  {
    difficulty: 'beginner',
    order: 1,
    question: 'ONE Championshipはどこの国に本部を置く格闘技団体ですか？',
    choices: ['日本', 'アメリカ', 'シンガポール', 'タイ'],
    correctIndex: 2,
  },
  {
    difficulty: 'beginner',
    order: 2,
    question: 'ONE Samuraiとはどのような大会ですか？',
    choices: [
      'ボクシング専門の日本大会',
      'ONE Championshipが開催する日本向けの格闘技シリーズ',
      '相撲の国際大会',
      '柔道のワールドカップ',
    ],
    correctIndex: 1,
  },
  {
    difficulty: 'beginner',
    order: 3,
    question: 'MMA（総合格闘技）の試合で相手を地面に押さえつけて戦うことを何と呼びますか？',
    choices: ['スタンドアップ', 'グラウンドゲーム', 'クリンチ', 'スパーリング'],
    correctIndex: 1,
  },
  {
    difficulty: 'beginner',
    order: 4,
    question: 'MMAの試合で勝利を決める方法として正しくないものはどれですか？',
    choices: ['KO（ノックアウト）', 'タップアウト（サブミッション）', 'ジャッジの判定', 'コイントス'],
    correctIndex: 3,
  },
  {
    difficulty: 'beginner',
    order: 5,
    question: 'ONE Championshipのリングはどのような形をしていますか？',
    choices: ['円形', '正方形', '八角形', '六角形'],
    correctIndex: 2,
  },

  // ===== 中級（7問）=====
  {
    difficulty: 'intermediate',
    order: 1,
    question: 'ONE Championshipで活躍する日本人選手、青木真也の得意技は何ですか？',
    choices: ['ボクシング', 'グラップリング・関節技', 'ムエタイ', 'レスリング'],
    correctIndex: 1,
  },
  {
    difficulty: 'intermediate',
    order: 2,
    question: 'ONE Championshipで使用される体重計測の方式として正しいものはどれですか？',
    choices: [
      '試合直前の計量のみ',
      '水抜きなしのハイドレーションテスト方式',
      '試合1週間前の計量',
      'BMI基準による判定',
    ],
    correctIndex: 1,
  },
  {
    difficulty: 'intermediate',
    order: 3,
    question: 'ムエタイで使用できる攻撃部位として正しいものはどれですか？',
    choices: [
      'パンチのみ',
      'パンチとキック',
      'パンチ・キック・肘・膝',
      'パンチ・キック・肘・膝・頭突き',
    ],
    correctIndex: 2,
  },
  {
    difficulty: 'intermediate',
    order: 4,
    question: 'ONE Championshipのストロー級の体重上限は何kgですか？',
    choices: ['52.2kg', '56.7kg', '61.2kg', '65.8kg'],
    correctIndex: 0,
  },
  {
    difficulty: 'intermediate',
    order: 5,
    question: 'MMAの試合でタップアウトとは何を意味しますか？',
    choices: [
      'レフェリーが試合を止めること',
      '選手が降参の意思を示すこと',
      'コーナーマンがタオルを投げること',
      '観客が拍手をすること',
    ],
    correctIndex: 1,
  },
  {
    difficulty: 'intermediate',
    order: 6,
    question: 'ONE Championshipが重視する「武道の精神」を表すスローガンは何ですか？',
    choices: [
      'Fight to Win',
      'Unlimited',
      'Integrity, Passion, Courage',
      'Be the Best',
    ],
    correctIndex: 2,
  },
  {
    difficulty: 'intermediate',
    order: 7,
    question: '柔術において背中をマットにつけた状態から相手を制する技術を何と呼びますか？',
    choices: ['ハーフガード', 'バタフライガード', 'クローズドガード', 'ガードポジション'],
    correctIndex: 3,
  },

  // ===== 上級（10問）=====
  {
    difficulty: 'advanced',
    order: 1,
    question: 'ONE Championshipで採用されているグラウンド状態でのサッカーキックのルールはどれですか？',
    choices: [
      '完全に禁止されている',
      'ヘッドへのみ禁止',
      '倒れた相手へは禁止、四つん這いへは許可',
      '無制限に許可されている',
    ],
    correctIndex: 0,
  },
  {
    difficulty: 'advanced',
    order: 2,
    question: 'MMAにおける「ダーティーボクシング」とはどのような技術ですか？',
    choices: [
      '反則的なパンチ技術',
      'クリンチ状態でのショートパンチや肘打ち',
      'グローブの外側で打つ技術',
      'バックハンドブローの別称',
    ],
    correctIndex: 1,
  },
  {
    difficulty: 'advanced',
    order: 3,
    question: 'ONE Samuraiで用いられる「ONE Super Series」のキックボクシングルールにおいて、ダウン後の試合再開はどのカウントで行われますか？',
    choices: ['5カウント', '8カウント', '10カウント', 'レフェリー裁量'],
    correctIndex: 3,
  },
  {
    difficulty: 'advanced',
    order: 4,
    question: '柔術の三角絞め（トライアングルチョーク）の正しい原理はどれですか？',
    choices: [
      '気管を直接圧迫して呼吸を止める',
      '頸動脈を圧迫して脳への血流を遮断する',
      '脊髄を圧迫して神経を麻痺させる',
      '肩関節を極めて動きを封じる',
    ],
    correctIndex: 1,
  },
  {
    difficulty: 'advanced',
    order: 5,
    question: 'ONE Championshipのポイントシステムで最も重視される評価基準はどれですか？',
    choices: [
      'ストライキングの手数',
      'テイクダウン数',
      'ダメージとドミナンス（支配）',
      'アグレッション（積極性）',
    ],
    correctIndex: 2,
  },
  {
    difficulty: 'advanced',
    order: 6,
    question: 'MMAにおけるウィリーギロチン（Arm-In Guillotine）の正しい説明はどれですか？',
    choices: [
      '相手の腕を外に出してから絞めるギロチン',
      '相手の腕を内側に巻き込んだまま行うギロチン',
      '立った状態でのみ有効なギロチン',
      'バックポジションから行うギロチン',
    ],
    correctIndex: 1,
  },
  {
    difficulty: 'advanced',
    order: 7,
    question: 'ONE Championshipのハイドレーションテストで失格となる基準はどれですか？',
    choices: [
      '尿比重が1.025以上',
      '尿比重が1.030以上',
      '体重がリミットの5%超過',
      '血糖値が基準値を超えた場合',
    ],
    correctIndex: 0,
  },
  {
    difficulty: 'advanced',
    order: 8,
    question: 'レスリングの「ダブルレッグテイクダウン」に対する最も効果的なディフェンスはどれですか？',
    choices: [
      'スプロール（腰を引いて足を後ろに抜く）',
      'その場でジャンプする',
      '相手の頭を下に押す',
      '後ろに下がって距離を取る',
    ],
    correctIndex: 0,
  },
  {
    difficulty: 'advanced',
    order: 9,
    question: '打撃技術において「カーフキック」が有効な理由として最も正しいものはどれですか？',
    choices: [
      'KOを狙いやすいため',
      'ふくらはぎへのダメージが蓄積しスタンス・移動力を奪えるため',
      'ガードの上から打てるため',
      'スピードが最も速い蹴り技のため',
    ],
    correctIndex: 1,
  },
  {
    difficulty: 'advanced',
    order: 10,
    question: 'ONE Samurai において「武士道」の精神が重視される理由として、ONE Championshipが掲げる理念に最も近いものはどれですか？',
    choices: [
      '日本市場へのマーケティング戦略のため',
      '選手の安全を最優先し、勝利よりも品位ある戦いを推進するため',
      '伝統武術のみを競技種目にするため',
      'アジア地域限定の大会にするため',
    ],
    correctIndex: 1,
  },
];

async function seed() {
  console.log('クイズデータの投入を開始します...');

  const batch = db.batch();
  const collection = db.collection('quizzes');

  for (const quiz of quizzes) {
    const ref = collection.doc();
    batch.set(ref, quiz);
  }

  await batch.commit();

  console.log(`✅ ${quizzes.length}件のクイズを投入しました`);
  console.log(`  初級: ${quizzes.filter((q) => q.difficulty === 'beginner').length}問`);
  console.log(`  中級: ${quizzes.filter((q) => q.difficulty === 'intermediate').length}問`);
  console.log(`  上級: ${quizzes.filter((q) => q.difficulty === 'advanced').length}問`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
