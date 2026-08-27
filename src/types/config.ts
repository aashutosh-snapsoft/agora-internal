export type AppConfig = {
	/**
	 * The base URL of the Agora application.
	 */
	url: string;
	/**
	 * The base URL of the Logos API.
	 */
	logos_url: string;
	/**
	 * The base URL of the Hasura GraphQL API.
	 */
	graphqlUrl: string;
	/**
	 * The Auth0 configuration.
 */
auth0: {
  domain: string;
  clientId: string;
  audience: string;
};
/**
 * The Google Analytics measurement ID.
 */
	gaMeasurementId: string;
	/**
	 * The Amplitude API key.
	 */
	amplitudeApiKey: string;
	/**
	 * Build identifier embedded at build time for version checks.
	 */
	buildId: string;
};
