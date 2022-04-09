import * as React from "react";
import { useObservable } from "@residualeffect/rereactor";
import { LoadState } from "./LoadState";
import type { Receiver } from "./Receiver";
import { DetermineLoadState } from "./DetermineLoadState";

export interface BaseLoadingComponentProps {
	minimumRenderThreshold?: number;

	whenLoading: JSX.Element,
	whenNotStarted: JSX.Element;

	whenError: (errors: string[]) => JSX.Element,
	whenUnloaded?: JSX.Element;

	determineLoadState?: () => LoadState;
}

/**
 * Used for subscribing to a receiver to check for it is busy. Good for disabling buttons.
 * @param receiver Receiver to observe for state changes.
 * @returns If the receiver is busy loading data.
 */
export function isBusy(receiver: Receiver<unknown>): boolean {
	return useObservable(receiver.IsBusy);
}

function LoadingComponent<A>(props: { receivers: [Receiver<A>], whenReceived: (a: A) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B>(props: { receivers: [Receiver<A>, Receiver<B>], whenReceived: (a: A, b: B) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>], whenReceived: (a: A, b: B, c: C) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>], whenReceived: (a: A, b: B, c: C, d: D) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D, E>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>], whenReceived: (a: A, b: B, c: C, d: D, e: E) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D, E, F>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>, Receiver<F>], whenReceived: (a: A, b: B, c: C, d: D, e: E, f: F) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;

function LoadingComponent(props: { receivers: Receiver<unknown>[], whenReceived: (...inputValues: unknown[]) => JSX.Element, } & BaseLoadingComponentProps): JSX.Element {
	const [hasPassedThreshold, setHasPassedThreshold] = React.useState(false);
	const receiverData = props.receivers.map((r) => useObservable(r.Data));
	const receiveState = (props.determineLoadState ?? DetermineLoadState.Default)(receiverData);

	React.useLayoutEffect(() => {
		if (props.minimumRenderThreshold === undefined || receiveState === LoadState.Failed || receiveState === LoadState.Received) {
			setHasPassedThreshold(true);
		} else if (receiveState === LoadState.Unloaded) {
			setHasPassedThreshold(false);
		} else if (receiveState === LoadState.Loading) {
			const newHandle = window.setTimeout(() => { setHasPassedThreshold(true); }, props.minimumRenderThreshold)
			return () => window.clearTimeout(newHandle);
		}

		return () => undefined;
	}, [receiveState]);

	switch (receiveState) {
		case LoadState.Failed:
			return props.whenError(receiverData.map((data) => data.ErrorMessage).filter(message => (message?.length ?? 0) > 0));
		case LoadState.Received:
			return props.whenReceived(...receiverData.map((data) => data.ReceivedData));
		case LoadState.NotStarted:
			return hasPassedThreshold ? props.whenNotStarted : <></>;
		case LoadState.Unloaded:
			return props.whenUnloaded ?? props.whenNotStarted;
		case LoadState.Loading:
		default:
			return hasPassedThreshold ? props.whenLoading : <></>;
	}
}

export const Loading = LoadingComponent;
