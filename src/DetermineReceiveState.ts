import type { ReceiverData } from "./Receiver";
import { ReceiveState } from "./ReceiveState";

export class DetermineReceiveState {
	public static Default(receivers: ReceiverData<unknown>[]): ReceiveState {
		const countsByState = this.FindCountsByState(receivers);
		return this.DefaultPriorityOrder.find(((state) => countsByState[state] > 0)) ?? ReceiveState.NotStarted;
	}

	public static FindCountsByState(receivers: ReceiverData<unknown>[]): Record<string, number> {
		const counts: Record<string, number> = Object.keys(ReceiveState).reduce((receiveStateCount, state) => { receiveStateCount[state] = 0; return receiveStateCount; }, {} as Record<string, number>);
		return receivers.reduce((current, receiverData) => { current[receiverData.State]++; return current; }, counts);
	}

	public static DefaultPriorityOrder = [ReceiveState.Failed, ReceiveState.Pending, ReceiveState.NotStarted, ReceiveState.Unloaded, ReceiveState.Received];
}
