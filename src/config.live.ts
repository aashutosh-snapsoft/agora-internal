import { AppConfig } from "./types/config";

export const config: AppConfig = {
	url: process.env.NEXT_PUBLIC_URL ?? "",
	logos_url: process.env.NEXT_PUBLIC_LOGOS_URL ?? "",
	graphqlUrl: "PLACEHOLDER_GRAPHQL_URL",
	auth0: {
		domain: "PLACEHOLDER_AUTH0_DOMAIN",
		clientId: "PLACEHOLDER_AUTH0_CLIENT_ID",
		audience: "PLACEHOLDER_AUTH0_AUDIENCE",
	},
	gaMeasurementId: "PLACEHOLDER_GA_MEASUREMENT_ID",
	amplitudeApiKey: "PLACEHOLDER_AMPLITUDE_API_KEY",
	buildId: "PLACEHOLDER_BUILD_ID",
};
