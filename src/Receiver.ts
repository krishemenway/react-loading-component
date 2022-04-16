import { Computed, Observable, ReadOnlyObservable } from "@residualeffect/reactor";
import { LoadState } from "./LoadState";

export interface ReceiverData<TReceivedData> {
	readonly ReceivedData: TReceivedData | null;
	readonly ErrorMessage: string;
	readonly State: LoadState;
}

/** Object used for managing the state and resulting consequences of a long-running task. */
export class Receiver<TReceivedData> {
	constructor(defaultError: string) {
		this.DefaultError = defaultError;

		this.WritableData = new Observable(Receiver.NotStarted);
		this.IsBusy = new Computed(() => this.WritableData.Value.State === LoadState.Loading);
	}

	/**
	 * Mark receiver as loading. When promise is provided, will set to the appropriate received or failed state when promise is resolved.
	 * @param promise Optional argument for easy integration with tasks ran within a promise.
	 * @returns This receiver. To help with creating Receiver and Starting in one line.
	 */
	public Start(promise?: () => Promise<TReceivedData>): Receiver<TReceivedData> {
		if (this.IsBusy.Value) {
			return this;
		}

		this.WritableData.Value = Receiver.Loading;

		if (promise !== undefined) {
			promise()
				.then((value) => { this.Received(value); }, (reason: Error) => { this.Failed(reason.message); })
				.catch((reason: Error) => { this.Failed(reason.message); });
		}

		return this;
	}

	/**
	 * Set received state with provided received data.
	 * @param data Received data.
	 */
	public Received(data: TReceivedData): void {
		this.WritableData.Value = { ReceivedData: data, State: LoadState.Received, ErrorMessage: "" };
	}

	/**
	 * Set failed state with provided message.
	 * @param error The failure message why the request failed.
	 */
	public Failed(error?: string): void {
		this.WritableData.Value = { ReceivedData: null, State: LoadState.Failed, ErrorMessage: error !== undefined && error.length > 0 ? error : this.DefaultError };
	}

	/**
	 * Reset back to unloaded state. Ensure unloadComponent is provided to <Loading /> component.
	 * Useful when wanting to free an especially large response object.
	 */
	public Reset(): void {
		this.WritableData.Value = Receiver.Unloaded;
	}

	/** Access to receiver data including State, Error and ReceivedData */
	public get Data(): ReadOnlyObservable<ReceiverData<TReceivedData>> { return this.WritableData; }
	public IsBusy: Computed<boolean>;
	public DefaultError: string;

	private static NotStarted = { ReceivedData: null, State: LoadState.NotStarted, ErrorMessage: "" };
	private static Loading = { ReceivedData: null, State: LoadState.Loading, ErrorMessage: "" };
	private static Unloaded = { ReceivedData: null, State: LoadState.Unloaded, ErrorMessage: "" };

	private WritableData: Observable<ReceiverData<TReceivedData>>;
}
