import React, { lazy, Suspense } from "react";
import { TemplateNameProps } from "./templatename.types";

const LazyTemplateName = lazy(() => import("./templatename"));

const TemplateName = (
	props: JSX.IntrinsicAttributes & {
		children?: React.ReactNode;
	} & TemplateNameProps
) => (
	<Suspense fallback={null}>
		<LazyTemplateName {...props} />
	</Suspense>
);

export default TemplateName;
