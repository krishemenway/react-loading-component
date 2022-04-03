import * as React from "react";
import { useObservable } from "@residualeffect/rereactor";
import { ReceiveState } from "./ReceiveState";
import type { Receiver } from "./Receiver";
import { DetermineReceiveState } from "./DetermineReceiveState";

export interface BaseLoadingComponentProps {
	minimumRenderThreshold?: number;
	pendingComponent: JSX.Element,
	notStartedComponent: JSX.Element;

	errorComponent: (errors: string[]) => JSX.Element,
	unloadedComponent?: JSX.Element;

	determineReceiveState?: () => ReceiveState;
}

/**
 * Used for subscribing to a receiver to check for it is pending. Good for disabling buttons.
 * @param receiver Receiver to observe for state changes.
 * @returns If the receiver is pending data.
 */
export function isPending(receiver: Receiver<unknown>): boolean {
	return useObservable(receiver.Data).State === ReceiveState.Pending;
}

function LoadingComponent<A>(props: { receivers: [Receiver<A>], receivedComponent: (a: A) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B>(props: { receivers: [Receiver<A>, Receiver<B>], receivedComponent: (a: A, b: B) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>], receivedComponent: (a: A, b: B, c: C) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>], receivedComponent: (a: A, b: B, c: C, d: D) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D, E>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>], receivedComponent: (a: A, b: B, c: C, d: D, e: E) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D, E, F>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>, Receiver<F>], receivedComponent: (a: A, b: B, c: C, d: D, e: E, f: F) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;

function LoadingComponent(props: { receivers: Receiver<unknown>[], receivedComponent: (...inputValues: unknown[]) => JSX.Element, } & BaseLoadingComponentProps): JSX.Element {
	const [hasPassedThreshold, setHasPassedThreshold] = React.useState(false);
	const receiverData = props.receivers.map((r) => useObservable(r.Data));
	const receiveState = (props.determineReceiveState ?? DetermineReceiveState.Default)(receiverData);

	React.useLayoutEffect(() => {
		if (props.minimumRenderThreshold === undefined || receiveState === ReceiveState.Failed || receiveState === ReceiveState.Received) {
			setHasPassedThreshold(true);
		} else if (receiveState === ReceiveState.Unloaded) {
			setHasPassedThreshold(false);
		} else if (receiveState === ReceiveState.Pending) {
			const newHandle = window.setTimeout(() => { setHasPassedThreshold(true); }, props.minimumRenderThreshold)
			return () => window.clearTimeout(newHandle);
		}

		return () => undefined;
	}, [receiveState]);

	switch (receiveState) {
		case ReceiveState.Failed:
			return props.errorComponent(receiverData.map((data) => data.ErrorMessage).filter(message => (message?.length ?? 0) > 0));
		case ReceiveState.Received:
			return props.receivedComponent(...receiverData.map((data) => data.ReceivedData));
		case ReceiveState.NotStarted:
			return hasPassedThreshold ? props.notStartedComponent : <></>;
		case ReceiveState.Unloaded:
			return props.unloadedComponent ?? props.notStartedComponent;
		case ReceiveState.Pending:
		default:
			return hasPassedThreshold ? props.pendingComponent : <></>;
	}
}

export const Loading = LoadingComponent;
