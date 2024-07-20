import detectEthereumProvider from '@metamask/detect-provider';
import BigNumber from '@waves/bignumber';
import Web3 from 'web3';
import type { HttpProvider, TransactionReceipt } from 'web3-core';
import { fromNullable, just, none } from '@sweet-monads/maybe';

import type { ChainInfo } from '$lib/shared/types/chainInfo';
import type { WalletState } from '$lib/shared/types/wallet';
import { WalletType } from '$lib/shared/enums/wallet';
import { ChainKind } from '$lib/shared/enums/chainKind';

import type { IMetaMaskWalletProvider, MetamaskAddChainParams } from './types';
import type { IWalletProvider } from '../types';
import { MetamaskMethod } from './enums';
// import { UnitsRetrodropContract } from '../../contracts/unitsRetrodrop';
import { NetworkNotFoundError } from '../errors/connectionError';
import { WalletProviderErrorCode } from '../errors/enums';
import { ProviderError } from '../errors/providerError';
import { waitForTxPolling } from './waitForTxPolling';

export type Config = {
	chainName: string;
	publicChainId: string;
	chains: ChainInfo[];
};

const NETWORK_NOT_FOUND_ERROR_CODE = 4902;
const DEFAULT_DEPOSIT_GAS_ESTIMATION = 1e6;

export const isAvailable = async (): Promise<boolean> => (await detectEthereumProvider()) !== null;

export class MetaMaskWalletProvider implements IWalletProvider, IMetaMaskWalletProvider {
	public static WALLET_TYPE: Extract<WalletType, WalletType.Metamask> = WalletType.Metamask;

	private baseChainId: string;
	private currentChainId: string;
	private userAddress: string;
	private provider: Ethereum.TEthereumApi;
	private web3;

	private unitsRetrodropContract: UnitsRetrodropContract;

	private constructor(
		provider: Ethereum.TEthereumApi,
		chainId: string,
		userAddress: string,
		unitsRetrodropContractAddress: string
	) {
		this.provider = provider;
		this.baseChainId = chainId;
		this.currentChainId = chainId;
		this.userAddress = userAddress;

		this.web3 = new Web3(provider as unknown as HttpProvider);

		this.unitsRetrodropContract = new UnitsRetrodropContract(
			unitsRetrodropContractAddress,
			this.provider
		);

		this.provider.on('connect', () => {
			this.connectCallback && this.connectCallback();
		});
		this.provider.on('chainChanged', (chainId: string) => {
			this.currentChainId = chainId;
			this.changeCallback && this.changeCallback();
			MetaMaskWalletProvider.validateChainId(this.baseChainId, chainId);
		});
		this.provider.on('accountsChanged', (accounts: string[]) => {
			if (accounts.length === 0) {
				this.disconnectCallback && this.disconnectCallback();
			} else {
				this.userAddress = accounts[0];
				this.changeCallback && this.changeCallback();
			}
		});
		this.provider.on('disconnect', () => {
			this.disconnectCallback && this.disconnectCallback();
		});
	}

	private connectCallback: (() => void) | undefined;
	private changeCallback: (() => void) | undefined;
	private disconnectCallback: (() => void) | undefined;

	static async create(
		baseChainId: string,
		unitsRetrodropContractAddress: string
	): Promise<MetaMaskWalletProvider> {
		const provider = (await detectEthereumProvider()) as Ethereum.TEthereumApi;
		if (provider === null)
			throw new ProviderError(
				MetaMaskWalletProvider.WALLET_TYPE,
				'Metamask is not installed',
				WalletProviderErrorCode.WalletIsNotInstalled
			);

		await provider.request({ method: MetamaskMethod.ethRequestAccounts });

		const address = await window.ethereum.selectedAddress;
		const chainId = await provider.request<string>({ method: MetamaskMethod.ethChainId });

		MetaMaskWalletProvider.validateChainId(baseChainId, chainId);

		return new MetaMaskWalletProvider(provider, chainId, address, unitsRetrodropContractAddress);
	}

	static validateChainId(expectedChainId: string, actualChainId: string): void {
		if (expectedChainId !== actualChainId) {
			throw new ProviderError(
				MetaMaskWalletProvider.WALLET_TYPE,
				`Unexpected chainId ${actualChainId}, expected – ${expectedChainId}`,
				WalletProviderErrorCode.UnexpectedChain
			);
		}
	}

	getType(): WalletType {
		return MetaMaskWalletProvider.WALLET_TYPE;
	}

	disconnect(): Promise<void> {
		window.ethereum.removeAllListeners('connect');
		window.ethereum.removeAllListeners('chainChanged');
		window.ethereum.removeAllListeners('accountsChanged');
		window.ethereum.removeAllListeners('disconnect');
		this.connectCallback = undefined;
		this.changeCallback = undefined;
		this.disconnectCallback = undefined;
		return Promise.resolve();
	}

	onConnect(callback: () => void) {
		this.connectCallback = callback;
	}

	onChange(callback: () => void) {
		this.changeCallback = callback;
	}

	onDisconnect(callback: () => void) {
		this.disconnectCallback = callback;
	}

	async getAddress(): Promise<string> {
		return this.userAddress;
	}

	async getPublicKey(): Promise<string> {
		throw new Error('getPublicKey is not implemented');
	}

	async getChainId(): Promise<string> {
		return this.currentChainId;
	}

	async getProvider(): Promise<Ethereum.TEthereumApi> {
		return this.provider;
	}

	async getState(): Promise<WalletState> {
		const address = await this.getAddress();
		const chainId = await this.getChainId();

		return {
			isConnected: true,
			address,
			chainId,
			chainKind: ChainKind.EVM,
			walletType: MetaMaskWalletProvider.WALLET_TYPE
		};
	}

	async switchChain(chainId: string): Promise<void> {
		try {
			return await this.provider.request({
				method: MetamaskMethod.walletSwitchEthereumChain,
				params: [{ chainId }]
			});
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.code === NETWORK_NOT_FOUND_ERROR_CODE) {
				throw new NetworkNotFoundError(
					MetaMaskWalletProvider.WALLET_TYPE,
					'Network should be added in your MetaMask before switching to it'
				);
			} else {
				throw error;
			}
		}
	}

	async addChain(chainParams: MetamaskAddChainParams): Promise<void> {
		return await this.provider.request({
			method: MetamaskMethod.walletAddEthereumChain,
			params: [chainParams]
		});
	}

	async deposit(amount: BigNumber, inviteCode: string): Promise<string> {
		return await this.unitsRetrodropContract.deposit(this.userAddress, { amount, inviteCode });
	}

	async getBalance(address: string): Promise<BigNumber> {
		const hexBalance = await this.provider.request<string>({
			method: MetamaskMethod.ethGetBalance,
			params: [address]
		});
		const balance = new BigNumber(hexBalance);
		//
		let depositEstimate = DEFAULT_DEPOSIT_GAS_ESTIMATION;
		try {
			depositEstimate = await this.unitsRetrodropContract.depositEstimateGas(this.userAddress, {
				amount: new BigNumber(1e9),
				inviteCode: ''
			});
		} catch (e) {
			console.error('failed to estimate gas for deposit', e);
		}
		const gasPrice = await this.unitsRetrodropContract.getGasPrice();
		const depositCostGwei = new BigNumber(depositEstimate)
			.div(10 ** 9)
			.mul(gasPrice)
			.mul(1.2)
			.mul(10 ** 9);
		const b = balance.sub(depositCostGwei);
		if (b.lt(0)) {
			return new BigNumber(0);
		} else {
			return b;
		}
	}

	async waitForTx(txId: string): Promise<void> {
		try {
			await waitForTxPolling<TransactionReceipt>(
				txId,
				async () => {
					const confirmedTx = await this.web3.eth.getTransactionReceipt(txId);

					return fromNullable(confirmedTx.blockNumber).fold(
						() => none(),
						() => just(confirmedTx)
					);
				},
				MetaMaskWalletProvider.WALLET_TYPE
			);
			return;
		} catch (err: unknown) {
			console.error(err);

			if (err instanceof ProviderError) {
				throw err;
			}

			if (err instanceof Error) {
				throw new ProviderError(
					MetaMaskWalletProvider.WALLET_TYPE,
					`Wait for tx ${txId} timeout`,
					WalletProviderErrorCode.WaitForTxTimeoutError
				);
			}

			throw new ProviderError(
				MetaMaskWalletProvider.WALLET_TYPE,
				`Wait for tx ${txId} timeout (${JSON.stringify(err)})`,
				WalletProviderErrorCode.UnknownError
			);
		}
	}
}
