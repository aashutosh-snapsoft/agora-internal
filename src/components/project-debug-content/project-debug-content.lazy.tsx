import React, { lazy, Suspense } from "react";
import { ProjectDebugContentProps } from "./project-debug-content.types";

const LazyProjectDebugContent = lazy(() => import("./project-debug-content"));

const ProjectDebugContent = (
	props: JSX.IntrinsicAttributes & {
		children?: React.ReactNode;
	} & ProjectDebugContentProps
) => (
	<Suspense fallback={null}>
		<LazyProjectDebugContent {...props} />
	</Suspense>
);

export default ProjectDebugContent;
