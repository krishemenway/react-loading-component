import type { Loadable } from ".";

export class Http {
	/**
	 * @param url Url path for get request.
	 * @param loadable Loadable object that will used to track the status and result of this request.
	 * @param transformFunc Optional conversion function if you want something more complex than the response object stored.
	 * @template TResponse Describes the type for the json response
	 */
	public static get<TResponse, TLoadableData = TResponse>(url: string, loadable: Loadable<TLoadableData>, transformFunc?: (response: TResponse) => TLoadableData): Promise<TResponse> {
		return new Promise<TResponse>((onFulfilled, onRejected) => {
			if (!loadable.CanMakeRequest()) {
				return;
			}

			loadable.Start();

			fetch(url)
				.then((response) => {
					if (!response.ok) {
						throw new Error(`Received response status code: ${response.status}`);
					}

					return response.json();
				})
				.then((jsonResponse: TResponse) => {
					loadable.Succeeded(transformFunc === undefined ? jsonResponse as unknown as TLoadableData : transformFunc(jsonResponse));
					onFulfilled(jsonResponse);
				}, (reason: { message: string }) => {
					loadable.Failed(reason.message);
					onRejected(reason);
				});
		});
	}

	/**
	 * @param url Url path for get request
	 * @param request Request object to be JSON.stringified for the post body.
	 * @param loadable Loadable object that will used to track the status and result of this request.
	 * @template TRequest Describes the type for the json request
	 * @template TResponse Describes the type for the json response
	 */
	public static post<TRequest, TResponse>(url: string, request: TRequest, loadable: Loadable<TResponse>): Promise<TResponse> {
		return new Promise<TResponse>((onFulfilled, onRejected) => {
			if (!loadable.CanMakeRequest()) {
				return;
			}

			loadable.Start();

			fetch(url, { 
				body: JSON.stringify(request),
				method: "post",
				headers: { "Content-Type": "application/json" },
			})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Received response status code: ${response.status}`);
				}

				return response.json();
			})
			.then((jsonResponse) => {
				loadable.Succeeded(jsonResponse);
				onFulfilled(jsonResponse as TResponse);
			}, (reason: { message: string }) => {
				loadable.Failed(reason.message);
				onRejected(reason);
			});
		});
	}
}
