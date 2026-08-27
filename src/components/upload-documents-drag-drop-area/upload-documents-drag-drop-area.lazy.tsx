import React, { lazy, Suspense } from "react";

const LazyUploadDocumentsDragDropArea = lazy(
	() => import("./upload-documents-drag-drop-area")
);

const UploadDocumentsDragDropArea = (
	props: JSX.IntrinsicAttributes & { children?: React.ReactNode }
) => (
	<Suspense fallback={null}>
		<LazyUploadDocumentsDragDropArea
			{...props}
			getInputProps={() => {}}
			getRootProps={() => {}}
		/>
	</Suspense>
);

export default UploadDocumentsDragDropArea;
