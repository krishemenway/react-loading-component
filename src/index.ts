import * as React from "react";
import { Observable, ReadOnlyObservable } from "@residualeffect/reactor";

export function useObservable<T>(observable: ReadOnlyObservable<T>): T {
	const [, triggerReact] = React.useReducer((x: number) => x + 1, 0);
	React.useLayoutEffect(() => observable.Subscribe(triggerReact), [observable]);
	return observable.Value;
}

export enum LoadState {
	NotStarted,
	Loading,
	Loaded,
	Failed,
	Unloaded,
}

interface Dictionary<T> {
	[key: string]: T;
}

export function FindLoadingStateCountsByState(datas: LoadableData<unknown>[]): Dictionary<number> {
	const initialStateCounts: Dictionary<number> = Object.keys(LoadState).reduce((loadStateCounts, loadState) => { loadStateCounts[loadState] = 0; return loadStateCounts; }, {} as Dictionary<number>);
	return datas.reduce((loadStateCounts, loadableData) => { loadStateCounts[loadableData.State]++; return loadStateCounts; }, initialStateCounts);
}

const LoadStatePriorityOrder = [LoadState.Failed, LoadState.Loading, LoadState.NotStarted, LoadState.Unloaded, LoadState.Loaded];

export function DefaultDetermineLoadState(datas: LoadableData<unknown>[]): LoadState {
	const loadingStateCountsByState = FindLoadingStateCountsByState(datas);
	return LoadStatePriorityOrder.find(((state) => loadingStateCountsByState[state] > 0)) ?? LoadState.NotStarted;
}

export interface LoadableData<TSuccessData> {
	readonly SuccessData: TSuccessData | null;
	readonly ErrorMessage: string;
	readonly State: LoadState;
}

export class Loadable<TSuccessData> {
	constructor(defaultError: string) {
		this._data = new Observable(Loadable.NotStartedData);
		this._defaultError = defaultError;
	}

	public Start(): Loadable<TSuccessData> {
		this._data.Value = Loadable.LoadingData;
		return this;
	}

	public Succeeded(successData: TSuccessData): void {
		this._data.Value = { SuccessData: successData, State: LoadState.Loaded, ErrorMessage: "" };
	}

	public Failed(errorMessage: string): void {
		this._data.Value = { SuccessData: null, State: LoadState.Failed, ErrorMessage: errorMessage ?? this._defaultError };
	}

	public Reset(): void {
		this._data.Value = Loadable.UnloadedData;
	}

	public CanMakeRequest(): boolean {
		return this.Data.Value.State !== LoadState.Loading;
	}

	public get Data(): ReadOnlyObservable<LoadableData<TSuccessData>> { return this._data; }

	private static NotStartedData = { SuccessData: null, State: LoadState.NotStarted, ErrorMessage: "" };
	private static LoadingData = { SuccessData: null, State: LoadState.Loading, ErrorMessage: "" };
	private static UnloadedData = { SuccessData: null, State: LoadState.Unloaded, ErrorMessage: "" };

	private _defaultError: string;

	private _data: Observable<LoadableData<TSuccessData>>;
}

export interface BaseLoadingComponentProps {
	loadingComponent: JSX.Element,
	errorComponent: (errors: string[]) => JSX.Element,
	notStartedComponent?: JSX.Element;
	unloadedComponent?: JSX.Element;
	determineLoadState?: () => LoadState;
}

export function isLoading(loadable: Loadable<unknown>): boolean {
	return useObservable(loadable.Data).State === LoadState.Loading;
}

export function Loading<A>(props: { loadables: [Loadable<A>], successComponent: (a: A) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B>(props: { loadables: [Loadable<A>, Loadable<B>], successComponent: (a: A, b: B) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C>(props: { loadables: [Loadable<A>, Loadable<B>, Loadable<C>], successComponent: (a: A, b: B, c: C) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C, D>(props: { loadables: [Loadable<A>, Loadable<B>, Loadable<C>, Loadable<D>], successComponent: (a: A, b: B, c: C, d: D) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C, D, E>(props: { loadables: [Loadable<A>, Loadable<B>, Loadable<C>, Loadable<D>, Loadable<E>], successComponent: (a: A, b: B, c: C, d: D, e: E) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
export function Loading<A, B, C, D, E, F>(props: { loadables: [Loadable<A>, Loadable<B>, Loadable<C>, Loadable<D>, Loadable<E>, Loadable<F>], successComponent: (a: A, b: B, c: C, d: D, e: E, f: F) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;

export function Loading(props: { loadables: Loadable<unknown>[], successComponent: (...inputValues: unknown[]) => JSX.Element, } & BaseLoadingComponentProps): JSX.Element {
	const loadableDatas = props.loadables.map((loadable) => useObservable(loadable.Data));
	const loadState = (props.determineLoadState ?? DefaultDetermineLoadState)(loadableDatas);

	switch (loadState) {
		case LoadState.Failed:
			return props.errorComponent(loadableDatas.map((data) => data.ErrorMessage).filter(message => message !== null));
		case LoadState.Loaded:
			return props.successComponent(...loadableDatas.map((data) => data.SuccessData));
		case LoadState.NotStarted:
			return props.notStartedComponent ?? props.loadingComponent;
		case LoadState.Unloaded:
			return props.unloadedComponent ?? props.notStartedComponent ?? props.loadingComponent;
		case LoadState.Loading:
		default:
			return props.loadingComponent;
	}
}
