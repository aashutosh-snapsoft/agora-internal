/**
 * This is the User data model, as defined in the PostgreSQL database / Hasura.
 */
export type User = {
	id: string;
	external_id: string;
	first_name: string;
	last_name: string;
	image_url: string;
	email: string;
	phone: string;
	organization: string;
	department: string;
	country: string;
	state: string;
	address: string;
	zip_code: string;
	title: string;
	created_at: string;
	tenant_id: string;
	tenant: {
		display_label: string;
	};
};
