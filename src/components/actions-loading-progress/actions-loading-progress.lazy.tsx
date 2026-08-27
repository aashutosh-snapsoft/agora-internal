import React, { lazy, Suspense } from "react";

const LazyActionsLoadingProgress = lazy(
	() => import("./actions-loading-progress")
);

const ActionsLoadingProgress = (
	props: JSX.IntrinsicAttributes & { children?: React.ReactNode }
) => (
	<Suspense fallback={null}>
		<LazyActionsLoadingProgress {...props} loading_text="Loading..." />
	</Suspense>
);

export default ActionsLoadingProgress;
