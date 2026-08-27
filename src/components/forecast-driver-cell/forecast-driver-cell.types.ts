import { PropsWithChildren } from "react";

export interface ForecastDriverCellProps extends PropsWithChildren {
	className?: string;
	state: "driver" | "plug" | "calculated" | "assumption-needed";
}
