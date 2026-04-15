import { genAddressSeed, getZkLoginSignature } from '@mysten/zklogin';
import { jwtToAddress } from '@mysten/zklogin';

/**
 * Google JWT からユーザーの Sui アドレスを導出する
 * zkLogin の仕様: JWT + salt → 決定論的に Sui アドレスが生まれる
 */
export function deriveUserAddress(jwt: string, userSalt: string): string {
  return jwtToAddress(jwt, userSalt);
}

export { genAddressSeed, getZkLoginSignature };
