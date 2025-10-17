/**
 * SnapTrade Credentials Helper
 * Handles encryption/decryption of SnapTrade secrets
 */

import { decrypt, isEncrypted } from '@/lib/crypto/encryption';

export interface SnapTradeCredentials {
  userId: string;
  userSecret: string;
  accountId?: string;
}

/**
 * Decrypt SnapTrade user secret
 * Handles both encrypted and plaintext secrets for backward compatibility
 */
export function decryptSnapTradeSecret(encryptedSecret: string): string {
  if (!encryptedSecret) {
    throw new Error('SnapTrade secret is missing');
  }

  // If already decrypted (backward compatibility), return as is
  if (!isEncrypted(encryptedSecret)) {
    console.warn('SnapTrade secret is not encrypted. Please run migration to encrypt existing secrets.');
    return encryptedSecret;
  }

  // Decrypt the secret
  try {
    return decrypt(encryptedSecret);
  } catch (error) {
    console.error('Failed to decrypt SnapTrade secret:', error);
    throw new Error('Failed to decrypt SnapTrade credentials');
  }
}

/**
 * Get decrypted SnapTrade credentials from database user object
 */
export function getSnapTradeCredentials(user: {
  snaptrade_user_id: string;
  snaptrade_user_secret: string;
  snaptrade_account_id?: string;
}): SnapTradeCredentials {
  return {
    userId: user.snaptrade_user_id,
    userSecret: decryptSnapTradeSecret(user.snaptrade_user_secret),
    accountId: user.snaptrade_account_id || undefined,
  };
}
