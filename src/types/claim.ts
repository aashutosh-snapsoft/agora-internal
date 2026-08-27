export interface Claim {
	id: string;
	key: string;
	num_value: number;
	str_value: string;
	states: ClaimState[];
	source: string;
	issuer_id: string;
	period_id: string;
	line_item_id: string;
	context_id: string;
	created_at: string;
}

export interface ClaimState {
	id: string;
	state: string;
	created_at: string;
}
