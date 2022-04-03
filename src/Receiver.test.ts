import { Receiver } from "./Receiver";
import { ReceiveState } from "./ReceiveState";

test("Should set success state with data", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Succeeded("Received");

	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Received);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("");
	expect(receiver.Data.Value.SuccessData).toStrictEqual("Received");
});

test("Should set fail state with message", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Failed("Failure");

	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("Failure");
	expect(receiver.Data.Value.SuccessData).toStrictEqual(null);
});

test("Should set unloaded state when reset", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Succeeded("Received");
	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Received);

	receiver.Reset();
	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Unloaded);
});

test("Should set pending when provided promise to Start is outstanding", async () => {
	const promise = new Promise<string>((_1, _2) => { });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(promise);
	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Pending);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("");
	expect(receiver.Data.Value.SuccessData).toStrictEqual(null);
});

test("Should set succeeded when provided promise to Start resolves", async () => {
	const promise = new Promise<string>((onResolved, _2) => { onResolved("Received"); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(promise);
	await promise;

	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Received);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("");
	expect(receiver.Data.Value.SuccessData).toStrictEqual("Received");
});

test("Should set failed when provided promise to Start rejects", async () => {
	const promise = new Promise<string>((_1, onRejected) => { onRejected(new Error("Failed")); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(promise);
	await new Promise(process.nextTick);

	expect(receiver.Data.Value.SuccessData).toStrictEqual(null);
	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("Failed");
});

test("Should set failed when provided promise to Start throws an error", async () => {
	const promise = new Promise<string>((_1, _2) => { throw new Error("Failed"); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(promise);
	await new Promise(process.nextTick);

	expect(receiver.Data.Value.State).toStrictEqual(ReceiveState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("Failed");
	expect(receiver.Data.Value.SuccessData).toStrictEqual(null);
});
