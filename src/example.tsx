import * as React from "react";
import { Observable } from "@residualeffect/reactor";
import { useObservable } from "@residualeffect/rereactor";
import { Http } from "./Http";
import { Receiver, Loading } from "./index";

// This example illustrates how you can build a UI that switches between rendering Success/Loading/Error components
// depending on whether the request to "/SomeEndpoint" is still loading, succeeds, or fails. At the finish, it displays a component
// that allows you edit the value that was received from the server. Note, you never have to deal with cases where this value is empty
// because the data has not been loaded yet--the <Loading /> component provides the guarantee that the loaded data is there and ready.

export const View: React.FC = () => {
	const service = React.useMemo(() => new ProfileEditor(), []);
	
	return (
		<div>
			<h1>Edit Your Profile:</h1>

			<Loading
				receivers={[service.Profile]}
				notStartedComponent={<ProfileLoading />}
				pendingComponent={<ProfileLoading />}
				successComponent={(data) => <EditProfile data={data} />}
				errorComponent={(errors) => <ProfileErrors errors={errors} />}
			/>
		</div>
	);
};

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

		Http.post("/Save", request).then(() => { this.IsSaving.Value = false; });
	}

	public Name: Observable<string>;
	public Email: Observable<string>;

	public IsSaving: Observable<boolean>;
}

interface ProfileResponse {
	Name: string;
	Email: string;
}

class ProfileEditor {
	constructor() {
		this.Profile = new Receiver<EditableProfile>("There was an issue downloading the profile data. Try Again later.");
		this.LoadProfile();
	}

	public LoadProfile(): void {
		this.Profile.Start(Http.get<ProfileResponse, EditableProfile>("/SomeEndpoint", (response) => new EditableProfile(response)));
	}

	public Profile: Receiver<EditableProfile>;
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
