import { FinancialModelComponentType } from "@/types/fm-component";
import { projectSelector } from "@/store/projects/project-selectors";
import { useAppSelector } from "@/store/store";
import { Build } from "@/types/content";
import { useMemo } from "react";

interface IUseBuildId {
	(fm_component_type: FinancialModelComponentType): string | null;
}

const useBuildId: IUseBuildId = (fm_component_type) => {
	const { project } = useAppSelector(projectSelector);
	return useMemo(() => {
		let buildId: string | null = null;
		let build: Build | null = null;

		if (project?.income_statement) {
			build =
				fm_component_type === "income-statement"
					? project?.income_statement?.builds?.[0]
					: fm_component_type === "balance-sheet"
					? (project?.balance_sheet?.builds?.[0] as Build)
					: null;
			buildId = build?.id || null;
		}

		return buildId;
	}, [fm_component_type, project]);
};

export default useBuildId;
