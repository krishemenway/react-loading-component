import { Observable, ReadOnlyObservable } from "@residualeffect/reactor";
import { ReceiveState } from "./ReceiveState";

export interface ReceiverData<TReceivedData> {
	readonly ReceivedData: TReceivedData | null;
	readonly ErrorMessage: string;
	readonly State: ReceiveState;
}

export class Receiver<TReceivedData> {
	constructor(defaultError: string) {
		this.WritableData = new Observable(Receiver.NotStarted);
		this.DefaultError = defaultError;
	}

	/**
	 * Mark receiver as pending. When promise is provided, will set to the appropriate received or failed state.
	 * @param promise Optional argument for easy integration with tasks ran within a promise.
	 * @returns This receiver. To help with creating Receiver and Starting in one line.
	 */
	public Start(promise: () => Promise<TReceivedData>): Receiver<TReceivedData> {
		if (!this.CanStart()) {
			return this;
		}

		this.WritableData.Value = Receiver.Pending;

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
		this.WritableData.Value = { ReceivedData: data, State: ReceiveState.Received, ErrorMessage: "" };
	}

	/**
	 * Set failed state with provided message.
	 * @param error The failure message why the request failed.
	 */
	public Failed(error?: string): void {
		this.WritableData.Value = { ReceivedData: null, State: ReceiveState.Failed, ErrorMessage: error ?? this.DefaultError };
	}

	/**
	 * Reset back to unloaded state. Ensure unloadComponent is provided to <Loading /> component.
	 */
	public Reset(): void {
		this.WritableData.Value = Receiver.Unloaded;
	}

	/**
	 * Checks to see if the receiver is capable of starting right now.
	 * @returns Whether this receiver can start based on the current state.
	 */
	public CanStart(): boolean {
		return this.Data.Value.State !== ReceiveState.Pending;
	}

	/** Access to receiver data including State, Error and ReceivedData */
	public get Data(): ReadOnlyObservable<ReceiverData<TReceivedData>> { return this.WritableData; }

	private static NotStarted = { ReceivedData: null, State: ReceiveState.NotStarted, ErrorMessage: "" };
	private static Pending = { ReceivedData: null, State: ReceiveState.Pending, ErrorMessage: "" };
	private static Unloaded = { ReceivedData: null, State: ReceiveState.Unloaded, ErrorMessage: "" };

	private DefaultError: string;
	private WritableData: Observable<ReceiverData<TReceivedData>>;
}
