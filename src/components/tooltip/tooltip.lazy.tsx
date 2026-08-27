import React, { lazy, Suspense } from "react";

const LazyTooltip = lazy(() => import("./tooltip"));

const Tooltip = (
	props: JSX.IntrinsicAttributes & { title: any; children?: React.ReactNode }
) => (
	<Suspense fallback={null}>
		<LazyTooltip {...props} title={"Tooltip"}>
			<span>Smart Layer</span>
		</LazyTooltip>
	</Suspense>
);

export default Tooltip;
