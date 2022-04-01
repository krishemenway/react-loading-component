import { Observable, ReadOnlyObservable } from "@residualeffect/reactor";
import { useObservable } from "@residualeffect/rereactor";

export enum LoadState {
	NotStarted,
	Pending,
	Loaded,
	Failed,
	Unloaded,
}

interface Dictionary<T> {
	[key: string]: T;
}

export function FindLoadingStateCountsByState(datas: ReceiverData<unknown>[]): Dictionary<number> {
	const initialStateCounts: Dictionary<number> = Object.keys(LoadState).reduce((loadStateCounts, loadState) => { loadStateCounts[loadState] = 0; return loadStateCounts; }, {} as Dictionary<number>);
	return datas.reduce((loadStateCounts, loadableData) => { loadStateCounts[loadableData.State]++; return loadStateCounts; }, initialStateCounts);
}

const LoadStatePriorityOrder = [LoadState.Failed, LoadState.Pending, LoadState.NotStarted, LoadState.Unloaded, LoadState.Loaded];

export function DefaultDetermineLoadState(datas: ReceiverData<unknown>[]): LoadState {
	const loadingStateCountsByState = FindLoadingStateCountsByState(datas);
	return LoadStatePriorityOrder.find(((state) => loadingStateCountsByState[state] > 0)) ?? LoadState.NotStarted;
}

export interface ReceiverData<TSuccessData> {
	readonly SuccessData: TSuccessData | null;
	readonly ErrorMessage: string;
	readonly State: LoadState;
}

export class Receiver<TSuccessData> {
	constructor(defaultError: string) {
		this._data = new Observable(Receiver.NotStartedData);
		this._defaultError = defaultError;
	}

	public Start(promise?: Promise<TSuccessData>): Receiver<TSuccessData> {
		if (!this.CanStart()) {
			return this;
		}

		this._data.Value = Receiver.LoadingData;

		if (promise !== undefined) {
			promise
				.then((value) => { this.Succeeded(value); }, (reason: Error) => { this.Failed(reason.message); })
				.catch((reason: Error) => { this.Failed(reason.message); });
		}

		return this;
	}

	public Succeeded(successData: TSuccessData): void {
		this._data.Value = { SuccessData: successData, State: LoadState.Loaded, ErrorMessage: "" };
	}

	public Failed(errorMessage?: string): void {
		this._data.Value = { SuccessData: null, State: LoadState.Failed, ErrorMessage: errorMessage ?? this._defaultError };
	}

	public Reset(): void {
		this._data.Value = Receiver.UnloadedData;
	}

	public CanStart(): boolean {
		return this.Data.Value.State !== LoadState.Pending;
	}

	public get Data(): ReadOnlyObservable<ReceiverData<TSuccessData>> { return this._data; }

	private static NotStartedData = { SuccessData: null, State: LoadState.NotStarted, ErrorMessage: "" };
	private static LoadingData = { SuccessData: null, State: LoadState.Pending, ErrorMessage: "" };
	private static UnloadedData = { SuccessData: null, State: LoadState.Unloaded, ErrorMessage: "" };

	private _defaultError: string;

	private _data: Observable<ReceiverData<TSuccessData>>;
}

export interface BaseLoadingComponentProps {
	loadingComponent: JSX.Element,
	errorComponent: (errors: string[]) => JSX.Element,
	notStartedComponent?: JSX.Element;
	unloadedComponent?: JSX.Element;
	determineLoadState?: () => LoadState;
}

export function isPending(loadable: Receiver<unknown>): boolean {
	return useObservable(loadable.Data).State === LoadState.Pending;
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
		case LoadState.Failed:
			return props.errorComponent(receiverData.map((data) => data.ErrorMessage).filter(message => (message?.length ?? 0) > 0));
		case LoadState.Loaded:
			return props.successComponent(...receiverData.map((data) => data.SuccessData));
		case LoadState.NotStarted:
			return props.notStartedComponent ?? props.loadingComponent;
		case LoadState.Unloaded:
			return props.unloadedComponent ?? props.notStartedComponent ?? props.loadingComponent;
		case LoadState.Pending:
		default:
			return props.loadingComponent;
	}
}
