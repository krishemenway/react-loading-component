import { Observable, ReadOnlyObservable } from "@residualeffect/reactor";
import { ReceiveState } from "./ReceiveState";

export interface ReceiverData<TSuccessData> {
	readonly SuccessData: TSuccessData | null;
	readonly ErrorMessage: string;
	readonly State: ReceiveState;
}

export class Receiver<TSuccessData> {
	constructor(defaultError: string) {
		this._data = new Observable(Receiver.NotStarted);
		this._defaultError = defaultError;
	}

	public Start(promise?: Promise<TSuccessData>): Receiver<TSuccessData> {
		if (!this.CanStart()) {
			return this;
		}

		this._data.Value = Receiver.Pending;

		if (promise !== undefined) {
			promise
				.then((value) => { this.Succeeded(value); }, (reason: Error) => { this.Failed(reason.message); })
				.catch((reason: Error) => { this.Failed(reason.message); });
		}

		return this;
	}

	public Succeeded(data: TSuccessData): void {
		this._data.Value = { SuccessData: data, State: ReceiveState.Received, ErrorMessage: "" };
	}

	public Failed(error?: string): void {
		this._data.Value = { SuccessData: null, State: ReceiveState.Failed, ErrorMessage: error ?? this._defaultError };
	}

	public Reset(): void {
		this._data.Value = Receiver.Unloaded;
	}

	public CanStart(): boolean {
		return this.Data.Value.State !== ReceiveState.Pending;
	}

	public get Data(): ReadOnlyObservable<ReceiverData<TSuccessData>> { return this._data; }

	private static NotStarted = { SuccessData: null, State: ReceiveState.NotStarted, ErrorMessage: "" };
	private static Pending = { SuccessData: null, State: ReceiveState.Pending, ErrorMessage: "" };
	private static Unloaded = { SuccessData: null, State: ReceiveState.Unloaded, ErrorMessage: "" };

	private _defaultError: string;

	private _data: Observable<ReceiverData<TSuccessData>>;
}
