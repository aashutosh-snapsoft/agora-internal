import { callGtag } from "@/lib/gtag";

export class GA4Service {
	static trackEvent(event: string, params: Record<string, any>) {
		// Proxy through callGtag so the tracker can be missing without crashing.
		callGtag("event", event, params);
	}

	static setUserProperty(property: string, value: string) {
		// Same guard for user properties in case GA hasn't loaded yet.
		callGtag("set", {
			user_properties: {
				[property]: value,
			},
		});
	}
}
