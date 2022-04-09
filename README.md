# react-loading-component

React component that acts like a switch statement for picking which component to render depending on the state (Loading, Failed, Received) of a long-running tasks like web requests. In addition, it provides a method in which to put multiple different receivers of data into one component to capture each of the errors or successful responses and provide them into the React component that requires the object of that type.

* Less time making sure the response has a value or not
* Easy to read code representing the UX during different stages of Loading.

![Node.js CI](https://github.com/krishemenway/react-loading-component/workflows/Node.js%20CI/badge.svg?branch=main)

# Installation

Installation can be accomplished using npm:

`npm install @krishemenway/react-loading-component`

# Getting Started

Check out the example below for usage of the Loading component in combination with the Receiver\<T\> class. Note that multiple receivers can be provided into one Loading component and will be handed off to the whenReceived function in the same order and with the proper types. In addition, all values provided to the whenReceived function will be ensured to be not null so you do not need to worry about that responsibility.

When calling the Start function on the Receiver class, a Promise\<T\> can be provided that when resolved will hydrate the Receiver's data with the resolved object and move the state to received. If the optional Promise\<T\> is not provided, then the Receiver\<T\> will stay in the Loading state until the Received, Failed, or Reset functions are executed.

The Start function will not be allowed to be executed again (and the optional promise will not be created if provided) if the Receiver\<T\> is already in the Loading state.

```tsx
import * as React from "react";
import { Observable } from "@residualeffect/reactor";
import { useObservable } from "@residualeffect/rereactor";
import { Receiver, Loading } from "./index";

export const View: React.FC = () => {
	const service = React.useMemo(() => new ProfileEditor().LoadProfile(), []);
	
	return (
		<div>
			<h1>Edit Your Profile:</h1>

			<Loading
				receivers={[service.Profile]}
				whenReceived={(data) => <EditProfile data={data} />}
				whenError={(errors) => <ProfileErrors errors={errors} />}
				whenLoading={<ProfileLoading />}
				whenNotStarted={<ProfileLoading />}
			/>
		</div>
	);
};

class ProfileEditor {
	constructor() {
		this.Profile = new Receiver<ProfileResponse>("There was an issue downloading the profile data. Try Again later.");
	}

	public LoadProfile(): ProfileEditor {
		this.Profile.Start(() => fetch("/SomeEndpoint").then((response) => response.json()));
		return this;
	}

	public Profile: Receiver<ProfileResponse>;
}

interface ProfileResponse {
	Name: string;
	Email: string;
}
```

# License

react-loading-component is freely distributable under the terms of the [MIT License](LICENSE).
