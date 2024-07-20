import type BigNumber from '@waves/bignumber';

export type TransactionReceipt = {
	transactionHash: string;
	transactionIndex: number;
	blockHash: string;
	blockNumber: number;
	contractAddress: string;
	cumulativeGasUsed: number;
	gasUsed: number;
	events: object;
};

export type DepositEstimateGasParams = Omit<{ amount: BigNumber; inviteCode: string }, 'symbol'>;

export interface ITokenContract {
	allowance(owner: string, spender: string): Promise<BigNumber>;
	approve(sender: string, spender: string, amount: BigNumber): Promise<void>;
	balanceOf(sender: string): Promise<BigNumber>;
}

export interface IWavesCoinBridgeContract {
	deposit(inviteCode: string): Promise<string>;
}
