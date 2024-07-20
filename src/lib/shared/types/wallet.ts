import type { ChainKind } from '$lib/shared/enums/chainKind';
import type { WalletType } from '$lib/shared/enums/wallet';

import type { Address, ChainId } from './common';

type DisconnectedWalletState = {
	isConnected: false;
};

export type CommonWalletState = {
	address: Address;
	chainId: ChainId;
	chainKind: ChainKind;
	walletType: WalletType;
};

export type ConnectedWalletState = {
	isConnected: true;
} & CommonWalletState;

export type WalletState = DisconnectedWalletState | ConnectedWalletState;

export type ConnectionError = {
	code: number;
	message: string;
};
