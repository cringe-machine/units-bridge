import { ProviderRpcErrorCode } from './enums';

export const PROVIDER_RPC_ERRORS: Record<ProviderRpcErrorCode, string> = {
	[ProviderRpcErrorCode.UserRejectedRequest]: 'User rejected the request.',
	[ProviderRpcErrorCode.Unauthorized]:
		'Requested method and/or account has not been authorized by the user.',
	[ProviderRpcErrorCode.UnsupportedMethod]: 'Provider does not support the requested method.',
	[ProviderRpcErrorCode.Disconnected]: 'Provider is disconnected from all chains.',
	[ProviderRpcErrorCode.ChainDisconnected]: 'Provider is not connected to the requested chain.'
};
