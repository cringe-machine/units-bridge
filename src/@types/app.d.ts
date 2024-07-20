// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

interface Window {
	ethereum: Ethereum.TEthereumApi;
}

declare let ethereum: Ethereum.TEthereumApi;

declare namespace Ethereum {
	type TEthereumApi = {
		selectedAddress;
		request<T>(arg: EthereumRequestArguments): T;
		removeAllListeners(event: string | symbol);
		on(eventName: string | symbol, listener: (...args) => void);
		chainId: string;
	};
}

interface MouseEvent extends MouseEvent {
	sourceCapabilities?: {
		firesTouchEvents: boolean;
	};
}
