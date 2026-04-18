import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { DIFFICULTY_INDEX, type Difficulty, type StampCardState } from '../types/index.js';

let client: SuiClient;
let sponsorKeypair: Ed25519Keypair;

export function getSuiClient(): SuiClient {
  if (client) return client;
  const network = (process.env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet') ?? 'testnet';
  client = new SuiClient({ url: getFullnodeUrl(network) });
  return client;
}

function getSponsorKeypair(): Ed25519Keypair {
  if (sponsorKeypair) return sponsorKeypair;
  const privateKey = process.env.SUI_SPONSOR_PRIVATE_KEY;
  if (!privateKey) throw new Error('SUI_SPONSOR_PRIVATE_KEY is not set');
  sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKey);
  return sponsorKeypair;
}

/**
 * ユーザーの Sui アドレスにスタンプカードを発行する（初回のみ）
 * Sponsored Transaction: Sponsor がガス代を負担する
 */
export async function mintStampCard(userAddress: string): Promise<string> {
  const client = getSuiClient();
  const sponsor = getSponsorKeypair();
  const packageId = process.env.SUI_PACKAGE_ID!;

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::stamp_card::mint_for`,
    arguments: [tx.pure.address(userAddress)],
  });

  const sponsoredTx = await client.signAndExecuteTransaction({
    signer: sponsor,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true },
  });

  const createdObject = sponsoredTx.objectChanges?.find(
    (change) => change.type === 'created' && change.objectType?.includes('StampCard'),
  );

  if (!createdObject || createdObject.type !== 'created') {
    throw new Error('StampCard の作成に失敗しました');
  }

  return createdObject.objectId;
}

/**
 * スタンプカードに指定難易度のスタンプを付与する
 * AdminCap を持つ Sponsor が実行する
 */
export async function addStamp(stampCardObjectId: string, difficulty: Difficulty): Promise<string> {
  const client = getSuiClient();
  const sponsor = getSponsorKeypair();
  const packageId = process.env.SUI_PACKAGE_ID!;
  const adminCapId = process.env.SUI_ADMIN_CAP_ID!;

  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::stamp_card::add_stamp`,
    arguments: [
      tx.object(adminCapId),
      tx.object(stampCardObjectId),
      tx.pure.u8(DIFFICULTY_INDEX[difficulty]),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    signer: sponsor,
    transaction: tx,
    options: { showEffects: true },
  });

  if (result.effects?.status.status !== 'success') {
    throw new Error(`スタンプ付与に失敗しました: ${result.effects?.status.error}`);
  }

  return result.digest;
}

/**
 * オンチェーンからスタンプカードの状態を取得する
 */
export async function getStampCard(stampCardObjectId: string): Promise<StampCardState> {
  const client = getSuiClient();

  const object = await client.getObject({
    id: stampCardObjectId,
    options: { showContent: true },
  });

  if (object.data?.content?.dataType !== 'moveObject') {
    throw new Error('StampCard オブジェクトが見つかりません');
  }

  const fields = object.data.content.fields as Record<string, unknown>;

  return {
    objectId: stampCardObjectId,
    owner: fields['owner'] as string,
    beginnerStamped: fields['beginner_stamped'] as boolean,
    intermediateStamped: fields['intermediate_stamped'] as boolean,
    advancedStamped: fields['advanced_stamped'] as boolean,
  };
}

/**
 * アドレスが所有する StampCard の Object ID を取得する
 */
export async function findStampCardByOwner(ownerAddress: string): Promise<string | null> {
  const client = getSuiClient();
  const packageId = process.env.SUI_PACKAGE_ID!;

  const events = await client.queryEvents({
    query: { MoveEventType: `${packageId}::stamp_card::StampCardMinted` },
    limit: 50,
    order: 'descending',
  });

  const match = events.data.find((e) => {
    const parsed = e.parsedJson as { owner?: string };
    return parsed.owner === ownerAddress;
  });

  if (!match) return null;
  const parsed = match.parsedJson as { card_id: string };
  return parsed.card_id;
}
