import { CustomError } from 'ts-custom-error';

export interface IAppError {
	tag: string;
	message: string;
}

export abstract class AppError extends CustomError implements IAppError {
	public tag: string;

	public constructor(tag: string, message: string) {
		super(message);

		this.tag = tag;
	}
}
