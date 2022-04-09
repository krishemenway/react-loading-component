import { DetermineLoadState } from "./DetermineLoadState";
import { Receiver } from "./Receiver";
import { LoadState } from "./LoadState";

let notStartedReceiver: Receiver<string>;
let loadingReceiver: Receiver<string>;
let receivedReceiver: Receiver<string>;
let failedReceiver: Receiver<string>;
let unloadedReceiver: Receiver<string>;

beforeEach(() => {
	notStartedReceiver = new Receiver<string>("Error");
	loadingReceiver = new Receiver<string>("Error").Start();

	receivedReceiver = new Receiver<string>("Error");
	receivedReceiver.Received("Done");

	failedReceiver = new Receiver<string>("Error");
	failedReceiver.Failed("Fail");

	unloadedReceiver = new Receiver<string>("Error");
	unloadedReceiver.Reset();
});

describe("DetermineLoadState.Default", () => {
	test("Should choose failure state when any of the receivers have failed.", () => {
		const thenState = DetermineLoadState.Default([
			notStartedReceiver.Data.Value,
			loadingReceiver.Data.Value,
			receivedReceiver.Data.Value,
			failedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(LoadState.Failed);
	});

	test("Should choose loading state when any of the receivers are loading and nothing has failed.", () => {
		const thenState = DetermineLoadState.Default([
			notStartedReceiver.Data.Value,
			loadingReceiver.Data.Value,
			receivedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(LoadState.Loading);
	});

	test("Should choose not started state when any of the receivers are loading and nothing has failed or loading.", () => {
		const thenState = DetermineLoadState.Default([
			notStartedReceiver.Data.Value,
			receivedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(LoadState.NotStarted);
	});

	test("Should choose unloaded state when any of the receivers are unloaded without any loading, failed, or not started.", () => {
		const thenState = DetermineLoadState.Default([
			receivedReceiver.Data.Value,
			unloadedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(LoadState.Unloaded);
	});

	test("Should choose received state when all of the receivers are completed.", () => {
		const thenState = DetermineLoadState.Default([
			receivedReceiver.Data.Value,
			receivedReceiver.Data.Value,
			receivedReceiver.Data.Value,
		]);

		expect(thenState).toStrictEqual(LoadState.Received);
	});
});

describe("DetermineLoadState.FindCountsByState", () => {

	test("Should add up all receivers and group them by state", () => {
		const thenCountsByState = DetermineLoadState.FindCountsByState([
			notStartedReceiver.Data.Value,
			notStartedReceiver.Data.Value,
			loadingReceiver.Data.Value,
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

		expect(thenCountsByState[LoadState.NotStarted]).toStrictEqual(2);
		expect(thenCountsByState[LoadState.Loading]).toStrictEqual(1);
		expect(thenCountsByState[LoadState.Received]).toStrictEqual(3);
		expect(thenCountsByState[LoadState.Failed]).toStrictEqual(5);
		expect(thenCountsByState[LoadState.Unloaded]).toStrictEqual(1);
	});

	test("Should ensure counts are zero when receivers are missing", () => {
		const thenCountsByState = DetermineLoadState.FindCountsByState([]);

		expect(thenCountsByState[LoadState.NotStarted]).toStrictEqual(0);
		expect(thenCountsByState[LoadState.Loading]).toStrictEqual(0);
		expect(thenCountsByState[LoadState.Received]).toStrictEqual(0);
		expect(thenCountsByState[LoadState.Failed]).toStrictEqual(0);
		expect(thenCountsByState[LoadState.Unloaded]).toStrictEqual(0);
	});
});
