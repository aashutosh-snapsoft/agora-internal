export interface ValidationDetailModalProps {
	open: boolean;
	onClose: () => void;
	validationType: 'warning' | 'error' | 'missing' | 'success';
	title: string;
	description: string;
	deltaValue?: string;
	periodLabel?: string;
	lineItemName?: string;
	reportedValue?: string;
	calculatedValue?: string;
}

export interface ValidationDetailData {
	type: 'warning' | 'error' | 'missing' | 'success';
	title: string;
	description: string;
	deltaValue?: string;
	periodLabel?: string;
	lineItemName?: string;
	reportedValue?: string;
	calculatedValue?: string;
}