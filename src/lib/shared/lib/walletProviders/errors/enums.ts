export enum WalletProviderErrorCode {
	ConfirmTxError,
	WalletIsNotInstalled,
	WalletIsLocked,
	UserUnauthorized,
	NetworkNotSupported,
	NetworkNotFound,
	DAppAddressError,
	TokenNotSupported,
	ContractInitializationError,
	Web3TransactionTimeout,
	WaitForTxTimeoutError,
	ConnectionError,
	UserRejected,
	TransferError,
	SignTxTimeout,
	UnknownError,
	UnexpectedChain
}

// https://eips.ethereum.org/EIPS/eip-1193#errors
export enum ProviderRpcErrorCode {
	UserRejectedRequest = 4001,
	Unauthorized = 4100,
	UnsupportedMethod = 4200,
	Disconnected = 4900,
	ChainDisconnected = 4901
}

// https://eips.ethereum.org/EIPS/eip-1474#error-codes
export enum RpcErrorCode {
	ParseError = -32700,
	InvalidRequest = -32600,
	MethodNotFound = -32601,
	InvalidParams = -32602,
	InternalError = -32603,
	InvalidInput = -32000,
	ResourceNotFound = -32001,
	ResourceUnavailable = -32002,
	TransactionRejected = -32003,
	MethodNotSupported = -32004,
	LimitExceeded = -32005,
	JsonRpcVersionNotSupported = -32006
}

export type ProviderErrorCode = WalletProviderErrorCode | ProviderRpcErrorCode | RpcErrorCode;
