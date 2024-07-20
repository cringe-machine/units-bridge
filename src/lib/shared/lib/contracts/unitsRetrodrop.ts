import type BigNumber from '@waves/bignumber';
import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';

import UNITS_RETRODROP_ABI from '$lib/shared/abi/unitsRetrodrop.abi.json';

import type { DepositEstimateGasParams, TransactionReceipt } from './types';
import { Web3TimeoutError } from './web3TimeoutError';

export class UnitsBridgeContract {
	private web3: Web3;
	private contract: Contract;
	private contractAddress: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private provider: any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor(contractAddress: string, provider: any) {
		this.provider = provider;
		this.web3 = new Web3(provider);
		this.contractAddress = contractAddress;
		this.contract = new this.web3.eth.Contract(
			UNITS_RETRODROP_ABI as AbiItem[],
			this.contractAddress
		);
	}

	async depositEstimateGas(
		_sender: string,
		{ amount, inviteCode }: DepositEstimateGasParams
	): Promise<number> {
		return await this.contract.methods.deposit(inviteCode).estimateGas({
			value: amount.toString()
		});
	}

	async getGasPrice(): Promise<number> {
		return this.provider.request({ method: 'eth_gasPrice' });
	}

	async deposit(
		senderAddress: string,
		{ amount, inviteCode }: { amount: BigNumber; inviteCode: string }
	): Promise<string> {
		try {
			const estimateGas = await this.depositEstimateGas(senderAddress, {
				amount,
				inviteCode
			});

			// GAS PRICE
			const gasPrice = await this.getGasPrice();

			const response: TransactionReceipt = await this.contract.methods.deposit(inviteCode).send({
				from: senderAddress,
				value: amount.toString(),
				gas: estimateGas,
				gasPrice
			});
			return response.transactionHash;
		} catch (err: unknown) {
			console.error(err);
			if (err instanceof Error) {
				if (err.message.includes('Transaction was not mined within default time range')) {
					throw new Web3TimeoutError(err.message);
				} else {
					throw new Web3TimeoutError(`Broadcast "deposit transaction" failed: ${err.message}`);
				}
			} else {
				throw err;
			}
		}
	}
}
