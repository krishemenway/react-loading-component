import { Loadable, LoadState } from "./index";

test("Should set success state with data", () => {
	const loadable = new Loadable<string>("Default Error Message");
	loadable.Succeeded("Something");

	expect(loadable.Data.Value.State).toBe(LoadState.Loaded);
	expect(loadable.Data.Value.ErrorMessage).toBe("");
	expect(loadable.Data.Value.SuccessData).toBe("Something");
});
