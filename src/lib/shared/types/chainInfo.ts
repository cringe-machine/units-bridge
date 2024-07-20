import { ChainKind } from '../enums/chainKind';
import type { ChainId, TokenSymbol } from './common';

type BaseChainInfo = {
	name: string;
	nativeTokenSymbol: TokenSymbol;
	nativeTokenDecimals: number;
	chainId: ChainId;
	minDepositAmount: number;
};

export type WavesChainInfo = BaseChainInfo & {
	kind: ChainKind.Waves;
};

export type EvmChainInfo = BaseChainInfo & {
	kind: ChainKind.EVM;
};

export type ChainInfo = WavesChainInfo | EvmChainInfo;
