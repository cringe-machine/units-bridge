import { RpcErrorCode } from './enums';

export const RPC_ERRORS: Record<RpcErrorCode, string> = {
	[RpcErrorCode.ParseError]: 'Invalid JSON',
	[RpcErrorCode.InvalidRequest]: 'JSON is not a valid request object',
	[RpcErrorCode.MethodNotFound]: 'Method does not exist',
	[RpcErrorCode.InvalidParams]: 'Invalid method parameters',
	[RpcErrorCode.InternalError]: 'Internal JSON-RPC error',
	[RpcErrorCode.InvalidInput]: 'Missing or invalid parameters',
	[RpcErrorCode.ResourceNotFound]: 'Requested resource not found',
	[RpcErrorCode.ResourceUnavailable]: 'Requested resource not available',
	[RpcErrorCode.TransactionRejected]: 'Transaction creation failed',
	[RpcErrorCode.MethodNotSupported]: 'Method is not implemented',
	[RpcErrorCode.LimitExceeded]: 'Request exceeds defined limit',
	[RpcErrorCode.JsonRpcVersionNotSupported]: 'Version of JSON-RPC protocol is not supported'
};
