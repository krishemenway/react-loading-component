import * as React from "react";
import { Observable } from "@residualeffect/reactor";
import { useObservable } from "@residualeffect/rereactor";
import { Loading, Receiver } from "./index";
import { Http } from "./http";

// This example illustrates how you can build a UI that switches between rendering Success/Loading/Error components
// depending on whether the request to "/SomeEndpoint" is still loading, succeeds, or fails. At the finish, it displays a component
// that allows you edit the value that was received from the server. Note, you never have to deal with cases where this value is empty
// because the data has not been loaded yet--the <Loading /> component provides the guarantee that the loaded data is there and ready.

export const View: React.FC = () => {
	const service = React.useMemo(() => new ProfileEditor(), []);
	
	return (
		<div>
			<h1>Loading Example:</h1>

			<Loading
				receivers={[service.Dashboard]}
				successComponent={(data) => <EditDashboard data={data} />}
				loadingComponent={<DashboardLoading />}
				errorComponent={(errors) => <DashboardErrors errors={errors} />}
			/>
		</div>
	);
};

class ProfileData {
	constructor(response: ProfileResponse) {
		this.Name = new Observable(response.Name);
	}

	public Save(): void {
		// this is where you would do whatever saving that needs done using the Observables that have been updated.
	}

	public Name: Observable<string>;
}

interface ProfileResponse {
	Name: string;
}

class ProfileEditor {
	constructor() {
		this.Dashboard = new Receiver<ProfileData>("There was an issue downloading the dashboard data. Try Again later.");
		this.LoadDashboard();
	}

	public LoadDashboard(): void {
		this.Dashboard.Start(Http.get<ProfileResponse, ProfileData>("/SomeEndpoint", (response) => new ProfileData(response)));
	}

	public Dashboard: Receiver<ProfileData>;
}

const DashboardLoading: React.FC = () => <div>Loading ...</div>;
const DashboardErrors: React.FC<{ errors: string[] }> = (props) => <div>{props.errors.map((e) => <div>{e}</div>)}</div>;

const EditDashboard: React.FC<{ data: ProfileData }> = (props) => {
	const name = useObservable(props.data.Name);

	return (
		<>
			<label>
				Name:
				<input
					type="text"
					onChange={(evt) => props.data.Name.Value = evt.currentTarget.value}
					value={name}
				/>
			</label>
		</>
	)
};
