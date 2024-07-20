import type { Maybe } from '@sweet-monads/maybe';

import type { WalletType } from '$lib/shared/enums/wallet';

import { WalletProviderErrorCode } from '../errors/enums';
import { ProviderError } from '../errors/providerError';

export async function waitForTxPolling<T>(
	txId: string,
	waitForTx: () => Promise<Maybe<T>>,
	walletType: WalletType
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const POLLING_INTERVAL = 5000;
		const TOTAL_ATTEMPTS_COUNT = 5;
		let attempts = TOTAL_ATTEMPTS_COUNT;
		let timer: NodeJS.Timeout;

		const getTransactionReceipt = async () => {
			if (timer) clearTimeout(timer);

			try {
				const confirmedTx = await waitForTx();

				if (confirmedTx.isNone() && attempts > 0) {
					attempts -= 1;
					timer = setTimeout(getTransactionReceipt, POLLING_INTERVAL);
				} else {
					if (confirmedTx.isNone()) {
						throw new ProviderError(
							walletType,
							`Wait for tx ${txId} timeout`,
							WalletProviderErrorCode.WaitForTxTimeoutError
						);
					} else {
						resolve(confirmedTx.unwrap());
					}
				}
			} catch (err: unknown) {
				if (attempts > 0) {
					attempts -= 1;
					timer = setTimeout(getTransactionReceipt, POLLING_INTERVAL);
				} else {
					reject(
						new ProviderError(
							walletType,
							`Wait for tx ${txId} timeout`,
							WalletProviderErrorCode.WaitForTxTimeoutError
						)
					);
				}
			}
		};

		timer = setTimeout(getTransactionReceipt, POLLING_INTERVAL);
	});
}
