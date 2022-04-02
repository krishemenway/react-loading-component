export class Http {
	/**
	 * @param url Url path for get request.
	 * @param transformFunc Optional conversion function if you want something more complex than the response object stored.
	 * @template TResponse Describes the type for the json response
	 */
	public static get<TResponse, TTransformedData = TResponse>(url: string, transformFunc?: (response: TResponse) => TTransformedData): Promise<TTransformedData> {
		return new Promise<TTransformedData>((onFulfilled, onRejected) => {
			fetch(url)
				.then((response) => {
					if (!response.ok) {
						throw new Error(`Received response status code: ${response.status}`);
					}

					return response.json();
				})
				.then((jsonResponse: TResponse) => {
					onFulfilled(transformFunc === undefined ? jsonResponse as unknown as TTransformedData : transformFunc(jsonResponse));
				}, (reason: Error) => {
					onRejected(reason);
				});
		});
	}

	/**
	 * @param url Url path for get request
	 * @param request Request object to be JSON.stringified for the post body.
	 * @param transformFunc Optional conversion function if you want something more complex than the response object stored.
	 * @template TRequest Describes the type for the json request
	 * @template TResponse Describes the type for the json response
	 */
	public static post<TRequest, TResponse, TLoadableData>(url: string, request: TRequest, transformFunc?: (response: TResponse) => TLoadableData): Promise<TLoadableData> {
		return new Promise<TLoadableData>((onFulfilled, onRejected) => {
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
			.then((jsonResponse: TResponse) => {
				onFulfilled(transformFunc === undefined ? jsonResponse as unknown as TLoadableData : transformFunc(jsonResponse));
			}, (reason: Error) => {
				onRejected(reason);
			});
		});
	}
}
