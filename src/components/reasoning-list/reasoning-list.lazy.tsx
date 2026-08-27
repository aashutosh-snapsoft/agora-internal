import React, { lazy, Suspense } from "react";
import { ReasoningListProps } from "./reasoning-list.types";

const LazyReasoningList = lazy(() => import("./reasoning-list"));

const ReasoningList = (
	props: JSX.IntrinsicAttributes & {
		children?: React.ReactNode;
	} & ReasoningListProps
) => (
	<Suspense fallback={null}>
		<LazyReasoningList {...props} />
	</Suspense>
);

export default ReasoningList;
