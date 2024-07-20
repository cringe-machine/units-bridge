import BigNumber from '@waves/bignumber';
import bs58 from 'bs58';
import type { InvokeScriptTransaction } from '@waves/ts-types';
import { ProviderKeeper } from '@waves/provider-keeper';
import { Signer, type Provider, type SignedTx } from '@waves/signer';
import { invokeScript, waitForTx } from '@waves/waves-transactions';
import { balance } from '@waves/waves-transactions/dist/nodeInteraction';
import { fromNullable } from '@sweet-monads/maybe';

import type { WalletState } from '$lib/shared/types/wallet';
import { ChainKind } from '$lib/shared/enums/chainKind';
import { WalletType } from '$lib/shared/enums/wallet';

import { WalletProviderErrorCode } from '../errors/enums';
import { ProviderError } from '../errors/providerError';
import type { IWalletProvider } from '../types';
import type { Config, IWavesSigner, KeeperWalletState } from './types';

const INVOKE_TX_FEE = 5e5;

export class KeeperWalletProvider implements IWalletProvider, IWavesSigner {
	static WALLET_TYPE: Extract<WalletType, WalletType.Keeper> = WalletType.Keeper;

	walletState: KeeperWalletState;

	private nodeUrl: string;
	private baseChainId: string;
	private dApp: string;

	private _signer!: Signer;
	get signer() {
		return this._signer;
	}

	set signer(newSigner: Signer) {
		this._signer = newSigner;
	}

	private _provider!: Provider;
	get provider() {
		return this._provider;
	}

	set provider(newProvider: Provider) {
		this._provider = newProvider;
	}

	private _keeper!: WavesKeeper.TWavesKeeperApi;
	get keeper() {
		return this._keeper;
	}

	set keeper(newKeeper: WavesKeeper.TWavesKeeperApi) {
		this._keeper = newKeeper;
	}

	constructor(
		chainId: string,
		config: Config,
		provider: Provider,
		keeper: WavesKeeper.TWavesKeeperApi,
		walletState: KeeperWalletState
	) {
		this.nodeUrl = config.nodeUrl;
		this.baseChainId = chainId;
		this.provider = provider;
		this.keeper = keeper;
		this.walletState = walletState;

		this.dApp = config.contractAddress;

		this.signer = new Signer({
			NODE_URL: config.nodeUrl
		});

		this.signer.setProvider(provider);

		if (typeof this.connectCallback === 'function') {
			this.connectCallback();
		}

		keeper.on('update', (state: WavesKeeper.IPublicStateResponse) => {
			if (!state.initialized || state.locked) {
				if (typeof this.disconnectCallback === 'function') {
					this.disconnectCallback();
				}
				return;
			}

			this.walletState = KeeperWalletProvider.createWalletState(state);

			KeeperWalletProvider.validateChainId(this.baseChainId, state.network.code);

			if (typeof this.changeCallback === 'function') {
				this.changeCallback();
			}
		});
	}

	static async create(baseChainId: string, cfg: Config): Promise<KeeperWalletProvider> {
		const keeper = window.KeeperWallet;
		const _keeper = fromNullable(keeper);

		if (_keeper.isNone())
			throw new ProviderError(
				KeeperWalletProvider.WALLET_TYPE,
				'Keeper Wallet is not installed',
				WalletProviderErrorCode.WalletIsNotInstalled
			);

		const publicState = await _keeper.unwrap().publicState();

		KeeperWalletProvider.validateChainId(baseChainId, publicState.network.code);

		const provider = new ProviderKeeper();

		return new KeeperWalletProvider(
			baseChainId,
			cfg,
			provider,
			keeper,
			KeeperWalletProvider.createWalletState(publicState)
		);
	}

	static validateChainId(expectedChainId: string, actualChainId: string): void {
		if (expectedChainId !== actualChainId) {
			throw new ProviderError(
				KeeperWalletProvider.WALLET_TYPE,
				`Unexpected chainId ${actualChainId}, expected – ${expectedChainId}`,
				WalletProviderErrorCode.UnexpectedChain
			);
		}
	}

	connectCallback: (() => void) | undefined;
	changeCallback: (() => void) | undefined;
	disconnectCallback: (() => void) | undefined;

	getType(): WalletType {
		return KeeperWalletProvider.WALLET_TYPE;
	}

	async disconnect() {
		this.connectCallback = undefined;
		this.changeCallback = undefined;
		this.disconnectCallback = undefined;
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
		return this.walletState.account.address;
	}

	async getPublicKey(): Promise<string> {
		return this.walletState.account.publicKey;
	}

	async getChainId(): Promise<string> {
		return this.walletState.account.chainId;
	}

	async getState(): Promise<WalletState> {
		const address = await this.getAddress();
		const chainId = await this.getChainId();
		const walletType = KeeperWalletProvider.WALLET_TYPE;

		return { isConnected: true, address, chainId, chainKind: ChainKind.Waves, walletType };
	}

	async deposit(amount: BigNumber, inviteCode: string): Promise<string> {
		const senderPublicKey = await this.getPublicKey();

		const tx = invokeScript({
			dApp: this.dApp,
			call: {
				function: 'depositWaves',
				args: [
					{
						type: 'string',
						value: inviteCode
					}
				]
			},
			chainId: this.baseChainId,
			payment: [{ amount: amount.toNumber(), assetId: null }],
			senderPublicKey
		});

		const signedTx = await this.signInvoke(tx);
		const txHash = await this.broadcastInvoke(signedTx);

		return txHash;
	}

	// returns address balance w/ tx fee substraction
	async getBalance(address: string): Promise<BigNumber> {
		const userBalance = await balance(address, this.nodeUrl);
		const b = new BigNumber(userBalance).sub(INVOKE_TX_FEE);
		if (b.lt(0)) {
			return new BigNumber(0);
		} else {
			return b;
		}
	}

	public async waitForTx(txId: string): Promise<void> {
		try {
			const response = await waitForTx(txId, {
				apiBase: this.nodeUrl,
				timeout: 15000
			});

			const status = response.applicationStatus;

			if (status === 'succeeded') {
				return;
			} else {
				throw new ProviderError(
					KeeperWalletProvider.WALLET_TYPE,
					`Wait for tx ${txId} timeout (${status})`,
					WalletProviderErrorCode.ConfirmTxError
				);
			}
		} catch (err: unknown) {
			console.error(err);
			if (err instanceof ProviderError) {
				throw err;
			}

			if (err instanceof Error) {
				throw new ProviderError(
					KeeperWalletProvider.WALLET_TYPE,
					`Wait for tx ${txId} timeout`,
					WalletProviderErrorCode.WaitForTxTimeoutError
				);
			}

			throw new ProviderError(
				KeeperWalletProvider.WALLET_TYPE,
				`Wait for tx ${txId} timeout (${JSON.stringify(err)})`,
				WalletProviderErrorCode.UnknownError
			);
		}
	}

	static async waitForUnlock(): Promise<WalletType> {
		const keeper = fromNullable(window.KeeperWallet);

		if (keeper.isNone())
			throw new ProviderError(
				KeeperWalletProvider.WALLET_TYPE,
				'Keeper Wallet is not installed',
				WalletProviderErrorCode.WalletIsNotInstalled
			);

		let wasResolved = false;

		const promise = new Promise<void>((resolve) => {
			keeper.unwrap().on('update', (state) => {
				if (wasResolved) return;

				if (!state.locked) {
					wasResolved = true;
					resolve();
				}
			});
		});

		await promise;

		return KeeperWalletProvider.WALLET_TYPE;
	}

	static createWalletState({
		locked,
		account
	}: WavesKeeper.IPublicStateResponse): KeeperWalletState {
		if (locked) {
			throw new ProviderError(
				KeeperWalletProvider.WALLET_TYPE,
				'Please login to Keeper Wallet extension',
				WalletProviderErrorCode.WalletIsLocked
			);
		}

		if (account === null) {
			throw new ProviderError(
				KeeperWalletProvider.WALLET_TYPE,
				'User should be authorized',
				WalletProviderErrorCode.UserUnauthorized
			);
		}
		const { address, publicKey } = account;

		const chainId = KeeperWalletProvider.getChainIdFromAddress(address);

		return {
			locked,
			account: {
				address,
				publicKey,
				chainId
			}
		};
	}

	/// IWavesSigner

	async signInvoke(tx: InvokeScriptTransaction): Promise<SignedTx<InvokeScriptTransaction>> {
		const [signedTx] = await this.signer.invoke(tx).sign();
		return signedTx;
	}

	async broadcastInvoke(signedTx: SignedTx<InvokeScriptTransaction>): Promise<string> {
		const broadcastedTx = await this.signer.broadcast(signedTx);
		return broadcastedTx.id;
	}

	static getChainIdFromAddress(address: string): string {
		const addressDecoded = bs58.decode(address)[1];
		return String.fromCharCode(addressDecoded);
	}
}
