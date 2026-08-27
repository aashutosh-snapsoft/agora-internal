import { HasuraService } from "@/services/hasura.service";

let hasuraInstance: HasuraService | null = null;

export const createHasuraService = (role: string, token: string) => {
	hasuraInstance = HasuraService.createWithBearer({
		role: role,
		getAccessToken: () => Promise.resolve(token),
		logout: () => {},
	});
	return hasuraInstance;
};

export const getHasuraService = () => {
	if (!hasuraInstance) {
		return null;
	}
	return hasuraInstance;
};
