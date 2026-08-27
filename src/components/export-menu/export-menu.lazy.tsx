import React, { lazy, Suspense } from "react";
import { ExportMenuProps } from "./export-menu.types";

const LazyExportMenuButton = lazy(() => import("./export-menu"));

const ExportMenuButton = (
	props: JSX.IntrinsicAttributes & {
		children?: React.ReactNode;
	} & ExportMenuProps
) => (
	<Suspense fallback={null}>
		<LazyExportMenuButton {...props} />
	</Suspense>
);

export default ExportMenuButton;
