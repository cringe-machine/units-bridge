import type { WalletType } from '$lib/shared/enums/wallet';
import { AppError } from '$lib/shared/lib/appError';

import type { ProviderErrorCode } from './enums';

export interface IProviderError {
	code: ProviderErrorCode;
	walletType: WalletType;
}

export class ProviderError extends AppError implements IProviderError {
	public code: ProviderErrorCode;
	public walletType: WalletType;

	constructor(walletType: WalletType, message: string, code: ProviderErrorCode) {
		super('ProviderError', message);

		this.walletType = walletType;
		this.code = code;
	}
}
