import React, { lazy, Suspense } from "react";

const LazyUploadDocumentLoadingCompletionContent = lazy(
	() => import("./upload-document-loading-completion-content")
);

const UploadDocumentLoadingCompletionContent = (
	props: JSX.IntrinsicAttributes & { children?: React.ReactNode }
) => (
	<Suspense fallback={null}>
		<LazyUploadDocumentLoadingCompletionContent
			{...props}
			isLoading={true}
			isLoadingSuccessfull={false}
		/>
	</Suspense>
);

export default UploadDocumentLoadingCompletionContent;
