import { AppError } from '../../lib/appError';

export class Web3TimeoutError extends AppError {
	constructor(message: string) {
		super('Web3TimeoutError', message);
	}
}
