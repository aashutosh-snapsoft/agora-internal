import type { Meta, StoryObj } from '@storybook/nextjs';
import ValidationDetailModal from './validation-detail-modal';

const meta: Meta<typeof ValidationDetailModal> = {
	title: 'Components/ValidationDetailModal',
	component: ValidationDetailModal,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		validationType: {
			control: { type: 'select' },
			options: ['warning', 'error', 'missing', 'success'],
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Warning: Story = {
	args: {
		open: true,
		validationType: 'warning',
		title: 'Consistency Check',
		description: 'Reported 4,408,032 does not match calculated 4,408,154 (Δ -122) on 2022 A.',
		deltaValue: '122',
		periodLabel: '2022 A',
		lineItemName: 'Gross Profit',
		reportedValue: '4,408,032',
		calculatedValue: '4,408,154',
		onClose: () => console.log('Modal closed'),
	},
};

export const Error: Story = {
	args: {
		open: true,
		validationType: 'error',
		title: 'Validation Check',
		description: 'Reported 5,234,567 does not match calculated 4,000,000 (Δ 1,234,567) on 2022 A.',
		deltaValue: '1,234,567',
		periodLabel: '2022 A',
		lineItemName: 'Total Assets',
		reportedValue: '5,234,567',
		calculatedValue: '4,000,000',
		onClose: () => console.log('Modal closed'),
	},
};

export const Missing: Story = {
	args: {
		open: true,
		validationType: 'missing',
		title: 'Consistency Check',
		description: 'Data is missing from input: We ingested the raw data successfully and aggregated into summary rollups, but we could not find the raw data in the ingested raw line items.',
		periodLabel: '2023 A',
		lineItemName: 'Total Assets',
		reportedValue: '',
		calculatedValue: '2,500,000',
		onClose: () => console.log('Modal closed'),
	},
};

export const Success: Story = {
	args: {
		open: true,
		validationType: 'success',
		title: 'Validation Check',
		description: 'All validation checks passed successfully. The reported data matches the calculated values.',
		periodLabel: '2024 A',
		lineItemName: 'Net Revenues',
		reportedValue: '10,500,000',
		calculatedValue: '10,500,000',
		deltaValue: '0',
		onClose: () => console.log('Modal closed'),
	},
};