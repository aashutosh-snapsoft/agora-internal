import { Claim } from "@/types/claim";

export interface ReasoningListProps {
	className?: string;
	claims?: Claim[];
	projectId: string;
	isLoading?: boolean;
}
