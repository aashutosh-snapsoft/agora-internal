import { AppConfig } from "./types/config";

// Debug environment variables

export const config: AppConfig = {
	url: process.env.NEXT_PUBLIC_URL ?? "",
	logos_url: process.env.NEXT_PUBLIC_LOGOS_URL ?? "",
	graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "",
	auth0: {
		domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? "",
		clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ?? "",
		audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "",
	},
	gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
	amplitudeApiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "",
	buildId:
		process.env.NEXT_PUBLIC_BUILD_ID ??
		process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
		"",
};
