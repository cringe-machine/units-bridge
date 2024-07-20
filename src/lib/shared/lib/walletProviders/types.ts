import type BigNumber from '@waves/bignumber';
import type { Maybe } from '@sweet-monads/maybe';

import { WalletType } from '$lib/shared/enums/wallet';
import { WalletState } from '$lib/shared/types/wallet';

export interface IWalletProvider {
	getType(): WalletType;
	disconnect(): Promise<void>;
	onConnect(callback: () => void): void;
	onChange(callback: () => void): void;
	onDisconnect(callback?: () => void): void;
	getAddress(): Promise<string>;
	getPublicKey(): Promise<string>;
	getChainId(): Promise<string>;
	getState(): Promise<WalletState>;
	//
	waitForTx(txId: string): Promise<void>;
	waitForTx<T>(txId: string, waitForTx?: () => Promise<Maybe<T>>): Promise<void>;
	// business
	deposit(amount: BigNumber, inviteCode: string): Promise<string>;
	getBalance(address: string): Promise<BigNumber>;
}
