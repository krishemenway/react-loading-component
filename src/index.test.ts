import { Receiver, ReceiveState } from "./index";

let onResolve: (value: string) => void;
let onReject: (reason?: any) => void;
let promise: Promise<string>;

beforeEach(() => {
	promise = new Promise((resolve, reject) => {
		onResolve = resolve;
		onReject = reject;
	});
});

test("Should set success state with data", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Succeeded("Received");

	expect(receiver.Data.Value.State).toBe(ReceiveState.Received);
	expect(receiver.Data.Value.ErrorMessage).toBe("");
	expect(receiver.Data.Value.SuccessData).toBe("Received");
});

test("Should set fail state with message", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Failed("Failure");

	expect(receiver.Data.Value.State).toBe(ReceiveState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toBe("Failure");
	expect(receiver.Data.Value.SuccessData).toBe(null);
});

test("Should set unloaded state when reset", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Succeeded("Received");
	expect(receiver.Data.Value.State).toBe(ReceiveState.Received);

	receiver.Reset();
	expect(receiver.Data.Value.State).toBe(ReceiveState.Unloaded);
});

test("Should set succeeded when provided promise to Start resolves", () => {
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(promise);
	expect(receiver.Data.Value.State).toBe(ReceiveState.Pending);
	expect(receiver.Data.Value.ErrorMessage).toBe("");
	expect(receiver.Data.Value.SuccessData).toBe(null);

	onResolve("Received");

	expect(receiver.Data.Value.State).toBe(ReceiveState.Received);
	expect(receiver.Data.Value.ErrorMessage).toBe("");
	expect(receiver.Data.Value.SuccessData).toBe("Received");
});

test("Should set failed when provided promise to Start rejects", () => {
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(promise);
	expect(receiver.Data.Value.State).toBe(ReceiveState.Pending);
	expect(receiver.Data.Value.ErrorMessage).toBe("");
	expect(receiver.Data.Value.SuccessData).toBe(null);

	onReject("Failed");

	expect(receiver.Data.Value.State).toBe(ReceiveState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toBe("Failed");
	expect(receiver.Data.Value.SuccessData).toBe(null);
});
