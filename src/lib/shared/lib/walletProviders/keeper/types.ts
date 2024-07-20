import type { SignedTx } from '@waves/signer';
import type { InvokeScriptTransaction } from '@waves/ts-types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IWavesSigner {
	/// Returns proofs
	signInvoke(tx: InvokeScriptTransaction): Promise<SignedTx<InvokeScriptTransaction>>;

	/// Broadcasts tx
	/// Returns transaction id
	broadcastInvoke(signedTx: SignedTx<InvokeScriptTransaction>): Promise<string>;
}

export type Config = {
	nodeUrl: string;
	// dApp
	contractAddress: string;
};

export type KeeperWalletState = {
	locked: boolean;
	account: {
		address: string;
		publicKey: string;
		chainId: string;
	};
};
