import type { WalletType } from '$lib/shared/enums/wallet';
import { WalletProviderErrorCode } from './enums';
import { ProviderError } from './providerError';

export class ConnectionError extends ProviderError {
	constructor(
		walletType: WalletType,
		message: string,
		code: WalletProviderErrorCode = WalletProviderErrorCode.ConnectionError
	) {
		super(walletType, message, code);
	}
}

export class InvalidNetworkError extends ConnectionError {
	public constructor(walletType: WalletType, message: string) {
		super(walletType, message, WalletProviderErrorCode.NetworkNotSupported);
	}
}

export class NetworkNotFoundError extends ConnectionError {
	public constructor(walletType: WalletType, message: string) {
		super(walletType, message, WalletProviderErrorCode.NetworkNotFound);
	}
}
