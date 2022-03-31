import * as React from "react";
import { Observable } from "@residualeffect/reactor";
import { Loading, Loadable, useObservable } from "./index";
import { Http } from "./http";

// This example illustrates how you can build a UI that switches between rendering Success/Loading/Error components
// depending on whether the request to "/SomeEndpoint" is still loading, succeeds, or fails. 

export const View: React.FC = () => {
	const service = React.useMemo(() => new DashboardService(), []);
	
	return (
		<div>
			<h1>Loading Example:</h1>

			<Loading
				loadables={[service.DashboardData]}
				successComponent={(data) => <EditDashboard data={data} />}
				loadingComponent={<DashboardLoading />}
				errorComponent={(errors) => <DashboardErrors errors={errors} />}
			/>
		</div>
	);
};

class DashboardData {
	constructor(response: DashboardResponse) {
		this.Name = new Observable(response.Name);
	}

	public Name: Observable<string>;
}

interface DashboardResponse {
	Name: string;
}

class DashboardService {
	constructor() {
		this.DashboardData = new Loadable<DashboardData>("There was an issue downloading the dashboard data. Try Again later.");
		this.LoadDashboard();
	}

	public LoadDashboard(): void {
		this.DashboardData.Start(Http.get<DashboardResponse, DashboardData>("/SomeEndpoint", (response) => new DashboardData(response)));
	}

	public DashboardData: Loadable<DashboardData>;
}

const DashboardLoading: React.FC = () => <div>Loading ...</div>;
const DashboardErrors: React.FC<{ errors: string[] }> = (props) => <div>{props.errors.map((e) => <div>{e}</div>)}</div>;

const EditDashboard: React.FC<{ data: DashboardData }> = (props) => {
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
