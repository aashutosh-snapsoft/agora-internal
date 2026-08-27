// import {
// 	OnboardingChatQuestionState,
// 	OnboardingChatState,
// 	Question,
// } from "@/types/onboarding/main";

// export const documentProcessingQuestions: Question[] = [
// 	{
// 		id: OnboardingChatState.UPLOADING,
// 		state: OnboardingChatQuestionState.BUSINESS_SECTOR,
// 		prompt:
// 			"While that’s processing. Tell us about this business.\nWhat sector are you in?",
// 		options: [
// 			{ label: "Energy", next: OnboardingChatState.PROCESSING },
// 			{ label: "Materials", next: OnboardingChatState.PROCESSING },
// 			{ label: "Industrials", next: OnboardingChatState.PROCESSING },
// 			{ label: "Consumer Discretionary", next: OnboardingChatState.PROCESSING },
// 			{ label: "Consumer Staples", next: OnboardingChatState.PROCESSING },
// 			{ label: "Health Care", next: OnboardingChatState.PROCESSING },
// 			{ label: "Financial", next: OnboardingChatState.PROCESSING },
// 			{ label: "Utilities", next: OnboardingChatState.PROCESSING },
// 			{ label: "Communication Services", next: OnboardingChatState.PROCESSING },
// 			{ label: "Real Estate", next: OnboardingChatState.PROCESSING },
// 			{ label: "Information Technology", next: OnboardingChatState.PROCESSING },
// 		],
// 	},
// 	{
// 		id: OnboardingChatState.PROCESSING,
// 		state: OnboardingChatQuestionState.BUSINESS_REVENUE_MODEL,
// 		prompt: "What is this business’ revenue model?",
// 		options: [
// 			{ label: "Subscription", next: OnboardingChatState.UPLOADED },
// 			{ label: "Markup", next: OnboardingChatState.UPLOADED },
// 			{ label: "Ad-Based", next: OnboardingChatState.UPLOADED },
// 			{ label: "Donation", next: OnboardingChatState.UPLOADED },
// 			{ label: "Affiliate", next: OnboardingChatState.UPLOADED },
// 			{ label: "Arbitrage", next: OnboardingChatState.UPLOADED },
// 			{ label: "Commission", next: OnboardingChatState.UPLOADED },
// 			{ label: "Data Sales", next: OnboardingChatState.UPLOADED },
// 			{ label: "Channel Sales", next: OnboardingChatState.UPLOADED },
// 			{ label: "Web / Direct Sales", next: OnboardingChatState.UPLOADED },
// 			{ label: "Other", next: OnboardingChatState.UPLOADED },
// 		],
// 	},
// ];

// export const questionFlow: Question[] = [
// 	{
// 		id: OnboardingChatState.INITIAL,
// 		state: OnboardingChatQuestionState.BUSINESS_TYPE_PUBLIC_OR_PRIVATE,
// 		prompt: "Let’s build a financial model.\nWhat type of project is this?",
// 		options: [
// 			{ label: "Raising Equity", next: OnboardingChatState.PROJECT_TYPE },
// 			{ label: "Raising Debt", next: OnboardingChatState.PROJECT_TYPE },
// 			{ label: "M&A", next: OnboardingChatState.PROJECT_TYPE },
// 			{ label: "Restructuring", next: OnboardingChatState.PROJECT_TYPE },
// 			{ label: "Strategy", next: OnboardingChatState.PROJECT_TYPE },
// 		],
// 	},
// 	{
// 		id: OnboardingChatState.PROJECT_TYPE,
// 		state: OnboardingChatQuestionState.BUSINESS_TYPE_PUBLIC_OR_PRIVATE,
// 		prompt: "What type of company?",
// 		options: [
// 			{ label: "Private", next: OnboardingChatState.UPLOAD },
// 			{ label: "Public", next: OnboardingChatState.UPLOAD },
// 		],
// 	},
// 	{
// 		id: OnboardingChatState.UPLOAD,
// 		prompt: "",
// 		options: [{ label: "", next: OnboardingChatState.UPLOADING }],
// 	},
// 	...documentProcessingQuestions,
// ];

// const dummyText = `
// The file you uploaded contained 3 years of financial statements from 2021 to 2023.

// Based on this data, I built a forecast for the next 5 years using the following historical company averages:\n
// \u2022 Annual growth rate: 11%
// \u2022 Tax rate: 25%
// \u2022 Interest Rate: 4%

// You may ask a question about this data or select one of these starting areas.
// `;
// export const projectQuestionFlow: Question[] = [
// 	{
// 		id: OnboardingChatState.INITIAL,
// 		prompt: dummyText,
// 		options: [],
// 	},
// ];
