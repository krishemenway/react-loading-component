import * as React from "react";
import { useObservable } from "@residualeffect/rereactor";
import { ReceiveState } from "./ReceiveState";
import type { Receiver, ReceiverData } from "./Receiver";

export function FindCountsByState(receivers: ReceiverData<unknown>[]): Record<string, number> {
	const counts: Record<string, number> = Object.keys(ReceiveState).reduce((receiveStateCount, state) => { receiveStateCount[state] = 0; return receiveStateCount; }, {} as Record<string, number>);
	return receivers.reduce((current, receiverData) => { current[receiverData.State]++; return current; }, counts);
}

const StatePriorityOrder = [ReceiveState.Failed, ReceiveState.Pending, ReceiveState.NotStarted, ReceiveState.Unloaded, ReceiveState.Received];

export function DefaultDetermineReceiveState(receivers: ReceiverData<unknown>[]): ReceiveState {
	const countsByState = FindCountsByState(receivers);
	return StatePriorityOrder.find(((state) => countsByState[state] > 0)) ?? ReceiveState.NotStarted;
}

export interface BaseLoadingComponentProps {
	minimumRenderThreshold?: number;
	pendingComponent: JSX.Element,
	notStartedComponent: JSX.Element;

	errorComponent: (errors: string[]) => JSX.Element,
	unloadedComponent?: JSX.Element;

	determineReceiveState?: () => ReceiveState;
}

export function isPending(receiver: Receiver<unknown>): boolean {
	return useObservable(receiver.Data).State === ReceiveState.Pending;
}

function LoadingComponent<A>(props: { receivers: [Receiver<A>], successComponent: (a: A) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B>(props: { receivers: [Receiver<A>, Receiver<B>], successComponent: (a: A, b: B) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>], successComponent: (a: A, b: B, c: C) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>], successComponent: (a: A, b: B, c: C, d: D) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D, E>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>], successComponent: (a: A, b: B, c: C, d: D, e: E) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;
function LoadingComponent<A, B, C, D, E, F>(props: { receivers: [Receiver<A>, Receiver<B>, Receiver<C>, Receiver<D>, Receiver<E>, Receiver<F>], successComponent: (a: A, b: B, c: C, d: D, e: E, f: F) => JSX.Element } & BaseLoadingComponentProps): JSX.Element;

function LoadingComponent(props: { receivers: Receiver<unknown>[], successComponent: (...inputValues: unknown[]) => JSX.Element, } & BaseLoadingComponentProps): JSX.Element {
	const [hasPassedThreshold, setHasPassedThreshold] = React.useState(false);
	const receiverData = props.receivers.map((r) => useObservable(r.Data));
	const receiveState = (props.determineReceiveState ?? DefaultDetermineReceiveState)(receiverData);

	React.useLayoutEffect(() => {
		if (props.minimumRenderThreshold === undefined) {
			setHasPassedThreshold(true);
			return () => undefined;
		}

		if (receiveState === ReceiveState.Unloaded) {
			setHasPassedThreshold(false);
		} else if (receiveState === ReceiveState.Failed || receiveState === ReceiveState.Received) {
			setHasPassedThreshold(true);
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
			return props.successComponent(...receiverData.map((data) => data.SuccessData));
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
