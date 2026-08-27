import { Document } from "@/types/documents";
import React, { lazy, Suspense } from "react";

const LazyDocumentsListBody = lazy(() => import("./documents-list-body"));

const DocumentsListBody = (
	props: JSX.IntrinsicAttributes & { children?: React.ReactNode }
) => (
	<Suspense fallback={null}>
		<LazyDocumentsListBody
			setAnchorEl={function (value: null | HTMLElement): void {
				throw new Error("Function not implemented.");
			}}
			setSelectedDocuemnt={function (value: Document): void {
				throw new Error("Function not implemented.");
			}}
			documents={[]}
			{...props}
		/>
	</Suspense>
);

export default DocumentsListBody;
