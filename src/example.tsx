import * as React from "react";
import { Observable } from "@residualeffect/reactor";
import { useObservable } from "@residualeffect/rereactor";
import { Receiver, Loading } from "./index";

// This example illustrates how you can build a UI that switches between rendering Received/Error/Loading components
// depending on whether the request to "/SomeEndpoint" succeeds, fails, or is still loading.

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
		this.Profile = new Receiver<EditableProfile>("There was an issue downloading the profile data. Try Again later.");
	}

	public LoadProfile(): ProfileEditor {
		// Informs the profile receiver to mark as loading and update the receiver to include the resulting promised object
		// when the promise resolves. Rejection from the promise will result in the Receiver being marked Failed with the provided error reason.
		this.Profile.Start(() => fetch("/SomeEndpoint").then((response) => response.json()).then((jsonResponse: ProfileResponse) => new EditableProfile(jsonResponse)));
		return this;
	}

	public Profile: Receiver<EditableProfile>;
}

interface SaveRequest {
	Name: string;
	Email: string;
}

class EditableProfile {
	constructor(currentProfile: ProfileResponse) {
		this.Name = new Observable(currentProfile.Name);
		this.Email = new Observable(currentProfile.Email);
		this.IsSaving = new Observable(false);
	}

	public Save(): void {
		this.IsSaving.Value = true;

		const request: SaveRequest = {
			Name: this.Name.Value,
			Email: this.Email.Value,
		};

		const fetchRequest: RequestInit = {
			body: JSON.stringify(request),
			method: "post",
			headers: { "Content-Type": "application/json" },
		};

		fetch("/Save", fetchRequest).then(() => { this.IsSaving.Value = false; });
	}

	public Name: Observable<string>;
	public Email: Observable<string>;

	public IsSaving: Observable<boolean>;
}

interface ProfileResponse {
	Name: string;
	Email: string;
}

const ProfileLoading: React.FC = () => <div>Loading ...</div>;
const ProfileErrors: React.FC<{ errors: string[] }> = (props) => <div>{props.errors.map((e) => <div>{e}</div>)}</div>;

const EditProfile: React.FC<{ data: EditableProfile }> = (props) => {
	const name = useObservable(props.data.Name);
	const isSaving = useObservable(props.data.IsSaving);

	return (
		<form onSubmit={(_) => { props.data.Save(); }}>
			<label>
				Name:
				<input
					type="text"
					onChange={(evt) => props.data.Name.Value = evt.currentTarget.value}
					value={name}
				/>
			</label>

			<label>
				Email:
				<input
					type="text"
					onChange={(evt) => props.data.Email.Value = evt.currentTarget.value}
					value={name}
				/>
			</label>

			<button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</button>
		</form>
	)
};
