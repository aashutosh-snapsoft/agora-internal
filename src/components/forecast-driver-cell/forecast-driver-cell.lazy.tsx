import React, { lazy, Suspense } from "react";
import { ForecastDriverCellProps } from "./forecast-driver-cell.types";

const LazyForecastDriverCell = lazy(() => import("./forecast-driver-cell"));

const ForecastDriverCell = (
	props: JSX.IntrinsicAttributes & {
		children?: React.ReactNode;
	} & ForecastDriverCellProps
) => (
	<Suspense fallback={null}>
		<LazyForecastDriverCell {...props} />
	</Suspense>
);

export default ForecastDriverCell;
