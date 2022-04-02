import { Observable, ReadOnlyObservable } from "@residualeffect/reactor";
import { useObservable } from "@residualeffect/rereactor";

export enum ReceiveState {
	NotStarted,
	Pending,
	Received,
	Failed,
	Unloaded,
}

export function FindCountsByState(receivers: ReceiverData<unknown>[]): Record<string, number> {
	const counts: Record<string, number> = Object.keys(ReceiveState).reduce((receiveStateCount, state) => { receiveStateCount[state] = 0; return receiveStateCount; }, {} as Record<string, number>);
	return receivers.reduce((current, receiverData) => { current[receiverData.State]++; return current; }, counts);
}

const StatePriorityOrder = [ReceiveState.Failed, ReceiveState.Pending, ReceiveState.NotStarted, ReceiveState.Unloaded, ReceiveState.Received];

export function DefaultDetermineLoadState(receivers: ReceiverData<unknown>[]): ReceiveState {
	const countsByState = FindCountsByState(receivers);
	return StatePriorityOrder.find(((state) => countsByState[state] > 0)) ?? ReceiveState.NotStarted;
}

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

export interface BaseLoadingComponentProps {
	pendingComponent: JSX.Element,
	errorComponent: (errors: string[]) => JSX.Element,
	notStartedComponent: JSX.Element;
	unloadedComponent?: JSX.Element;
	determineLoadState?: () => ReceiveState;
}

export function isPending(receiver: Receiver<unknown>): boolean {
	return useObservable(receiver.Data).State === ReceiveState.Pending;
}

export function Loading<A>(props: { receivers: [Receiver<A>], successComponent: (a: A) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B>(props: { receivers: [Receiver<A>, Receiver<B>], successComponent: (a: A, b: B) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>], successComponent: (a: A, b: B, c: C) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C, D>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>], successComponent: (a: A, b: B, c: C, d: D) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C, D, E>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>], successComponent: (a: A, b: B, c: C, d: D, e: E) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C, D, E, F>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>, Receiver<F>], successComponent: (a: A, b: B, c: C, d: D, e: E, f: F) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;

export function Loading(props: { receivers: Receiver<unknown>[], successComponent: (...inputValues: unknown[]) => JSX.Element, } & BaseLoadingComponentProps): JSX.Element {
	const receiverData = props.receivers.map((r) => useObservable(r.Data));
	const loadState = (props.determineLoadState ?? DefaultDetermineLoadState)(receiverData);

	switch (loadState) {
		case ReceiveState.Failed:
			return props.errorComponent(receiverData.map((data) => data.ErrorMessage).filter(message => (message?.length ?? 0) > 0));
		case ReceiveState.Received:
			return props.successComponent(...receiverData.map((data) => data.SuccessData));
		case ReceiveState.NotStarted:
			return props.notStartedComponent;
		case ReceiveState.Unloaded:
			return props.unloadedComponent ?? props.notStartedComponent;
		case ReceiveState.Pending:
		default:
			return props.pendingComponent;
	}
}
