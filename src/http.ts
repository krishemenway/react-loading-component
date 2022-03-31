import type { Loadable } from ".";

export class Http {
	/**
	 * @param url Url path for get request
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
				.then((jsonResponse) => {
					loadable.Succeeded(transformFunc === undefined ? jsonResponse : transformFunc(jsonResponse));
					onFulfilled(jsonResponse as TResponse);
				}, (reason) => {
					loadable.Failed(reason.message);
					onRejected(reason);
				});
		});
	}

	/**
	 * @param url Url path for get request
	 * @param request Request for the post body
	 * @param loadable Loadable to track progress of request
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
			}, (reason) => {
				loadable.Failed(reason);
				onRejected(reason);
			});
		});
	}
}
