import { Receiver, LoadState } from "./index";

test("Should set success state with data", () => {
	const receiver = new Receiver<string>("Default Error Message");
	receiver.Succeeded("Something");

	expect(receiver.Data.Value.State).toBe(LoadState.Loaded);
	expect(receiver.Data.Value.ErrorMessage).toBe("");
	expect(receiver.Data.Value.SuccessData).toBe("Something");
});
