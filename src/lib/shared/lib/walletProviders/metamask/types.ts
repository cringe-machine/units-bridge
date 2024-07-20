import type { Maybe } from '@sweet-monads/maybe';

import type { MetamaskMethod } from './enums';

export interface IMetaMaskWalletProvider {
	switchChain(chainId: string): Promise<void>;
}

export type MetamaskAddChainParams = {
	chainId: string;
	chainName: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	rpcUrls: string[];
	blockExplorerUrls: string[];
};

export type MetamaskWalletGetBalanceParams = {
	tokenId: Maybe<string>;
	address: string;
};

export type MetamaskMethodParamsByName = {
	[MetamaskMethod.ethRequestAccounts]: null;
	[MetamaskMethod.ethChainId]: null;
	[MetamaskMethod.ethGetBalance]: MetamaskWalletGetBalanceParams;
	[MetamaskMethod.walletSwitchEthereumChain]: string;
	[MetamaskMethod.walletAddEthereumChain]: MetamaskAddChainParams;
};
