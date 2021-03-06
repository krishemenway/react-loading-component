import { Receiver } from "./Receiver";
import { LoadState } from "./LoadState";

test("Should set success state with data", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Received("Received");

	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Received);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("");
	expect(receiver.Data.Value.ReceivedData).toStrictEqual("Received");
});

test("Should set fail state with message", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Failed("Failure");

	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("Failure");
	expect(receiver.Data.Value.ReceivedData).toStrictEqual(null);
});

test("Should set unloaded state when reset", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Received("Received");
	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Received);

	receiver.Reset();
	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Unloaded);
});

test("Should not set loading when provided promise to Start is outstanding", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Start();
	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Loading);
	expect(receiver.IsBusy.Value).toStrictEqual(true);

	const promise = jest.fn();
	receiver.Start(promise);

	expect(promise).toBeCalledTimes(0);
	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Loading);
});

test("Should set loading when provided promise to Start is outstanding", () => {
	const promise = new Promise<string>(() => undefined);
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(() => promise);
	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Loading);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("");
	expect(receiver.Data.Value.ReceivedData).toStrictEqual(null);
});

test("Should set succeeded when provided promise to Start resolves", async () => {
	const promise = new Promise<string>((onResolved) => { onResolved("Received"); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(() => promise);
	await new Promise((resolve) => process.nextTick(resolve));

	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Received);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("");
	expect(receiver.Data.Value.ReceivedData).toStrictEqual("Received");
});

test("Should set failed when provided promise to Start rejects", async () => {
	const promise = new Promise<string>((_1, onRejected) => { onRejected(new Error("Failed")); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(() => promise);
	await new Promise((resolve) => process.nextTick(resolve));

	expect(receiver.Data.Value.ReceivedData).toStrictEqual(null);
	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("Failed");
});

test("Should set failed when provided promise to Start throws an error", async () => {
	const promise = new Promise<string>(() => { throw new Error("Failed"); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(() => promise);
	await new Promise((resolve) => process.nextTick(resolve));

	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Failed);
	expect(receiver.Data.Value.ErrorMessage).toStrictEqual("Failed");
	expect(receiver.Data.Value.ReceivedData).toStrictEqual(null);
});

test("Should stay unloaded when started request that will succeed but reset before finished", async () => {
	const promise = new Promise<string>((onResolved) => { onResolved("Received"); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(() => promise);
	receiver.Reset();
	await new Promise((resolve) => process.nextTick(resolve));

	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Unloaded);
});

test("Should stay unloaded when started request that will fail but reset before finished", async () => {
	const promise = new Promise<string>(() => { throw new Error("Failed"); });
	const receiver = new Receiver<string>("Default Error Message");

	receiver.Start(() => promise);
	receiver.Reset();
	await new Promise((resolve) => process.nextTick(resolve));

	expect(receiver.Data.Value.State).toStrictEqual(LoadState.Unloaded);
});
