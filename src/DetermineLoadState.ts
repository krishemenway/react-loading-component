import type { ReceiverData } from "./Receiver";
import { LoadState } from "./LoadState";

export class DetermineLoadState {
	public static Default(receivers: ReceiverData<unknown>[]): LoadState {
		const countsByState = this.FindCountsByState(receivers);
		return this.DefaultPriorityOrder.find(((state) => countsByState[state] > 0)) ?? LoadState.NotStarted;
	}

	public static FindCountsByState(receivers: ReceiverData<unknown>[]): Record<string, number> {
		const counts: Record<string, number> = Object.keys(LoadState).reduce((receiveStateCount, state) => { receiveStateCount[state] = 0; return receiveStateCount; }, {} as Record<string, number>);
		return receivers.reduce((current, receiverData) => { current[receiverData.State]++; return current; }, counts);
	}

	public static DefaultPriorityOrder = [LoadState.Failed, LoadState.Loading, LoadState.NotStarted, LoadState.Unloaded, LoadState.Received];
}
