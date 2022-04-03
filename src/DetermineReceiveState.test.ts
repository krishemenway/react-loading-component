import { DetermineReceiveState } from "./DetermineReceiveState";
import { Receiver } from "./Receiver";
import { ReceiveState } from "./ReceiveState";

let notStartedReceiver: Receiver<string>;
let pendingReceiver: Receiver<string>;
let receivedReceiver: Receiver<string>;
let failedReceiver: Receiver<string>;
let unloadedReceiver: Receiver<string>;

beforeEach(() => {
	notStartedReceiver = new Receiver<string>("Error");
	pendingReceiver = new Receiver<string>("Error").Start();

	receivedReceiver = new Receiver<string>("Error");
	receivedReceiver.Received("Done");

	failedReceiver = new Receiver<string>("Error");
	failedReceiver.Failed("Fail");

	unloadedReceiver = new Receiver<string>("Error");
	unloadedReceiver.Reset();
});

describe("DetermineReceiveState.Default", () => {
	test("Should choose failure state when any of the receivers have failed.", () => {
		const thenState = DetermineReceiveState.Default([
			notStartedReceiver.Data.Value,
			pendingReceiver.Data.Value,
			receivedReceiver.Data.Value,
			failedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(ReceiveState.Failed);
	});

	test("Should choose pending state when any of the receivers are pending and nothing has failed.", () => {
		const thenState = DetermineReceiveState.Default([
			notStartedReceiver.Data.Value,
			pendingReceiver.Data.Value,
			receivedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(ReceiveState.Pending);
	});

	test("Should choose not started state when any of the receivers are pending and nothing has failed or pending.", () => {
		const thenState = DetermineReceiveState.Default([
			notStartedReceiver.Data.Value,
			receivedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(ReceiveState.NotStarted);
	});

	test("Should choose unloaded state when any of the receivers are unloaded without any pending, failed, or not started.", () => {
		const thenState = DetermineReceiveState.Default([
			receivedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(ReceiveState.Unloaded);
	});

	test("Should choose received state when all of the receivers are completed.", () => {
		const thenState = DetermineReceiveState.Default([
			receivedReceiver.Data.Value,
			receivedReceiver.Data.Value,
			receivedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(ReceiveState.Received);
	});
});

describe("DetermineReceiveState.FindCountsByState", () => {

	test("Should add up all receivers and group them by state", () => {
		const thenCountsByState = DetermineReceiveState.FindCountsByState([
			notStartedReceiver.Data.Value,
			notStartedReceiver.Data.Value,
			pendingReceiver.Data.Value,
			receivedReceiver.Data.Value,
			receivedReceiver.Data.Value,
			receivedReceiver.Data.Value,
			failedReceiver.Data.Value,
			failedReceiver.Data.Value,
			failedReceiver.Data.Value,
			failedReceiver.Data.Value,
			failedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenCountsByState[ReceiveState.NotStarted]).toStrictEqual(2);
		expect(thenCountsByState[ReceiveState.Pending]).toStrictEqual(1);
		expect(thenCountsByState[ReceiveState.Received]).toStrictEqual(3);
		expect(thenCountsByState[ReceiveState.Failed]).toStrictEqual(5);
		expect(thenCountsByState[ReceiveState.Unloaded]).toStrictEqual(1);
	});

	test("Should ensure counts are zero when receivers are missing", () => {
		const thenCountsByState = DetermineReceiveState.FindCountsByState([]);

		expect(thenCountsByState[ReceiveState.NotStarted]).toStrictEqual(0);
		expect(thenCountsByState[ReceiveState.Pending]).toStrictEqual(0);
		expect(thenCountsByState[ReceiveState.Received]).toStrictEqual(0);
		expect(thenCountsByState[ReceiveState.Failed]).toStrictEqual(0);
		expect(thenCountsByState[ReceiveState.Unloaded]).toStrictEqual(0);
	});
});
