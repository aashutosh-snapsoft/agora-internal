import React, { lazy, Suspense } from "react";
import { ValidationDetailModalProps } from "./validation-detail-modal.types";

const LazyValidationDetailModal = lazy(() => import("./validation-detail-modal"));

const ValidationDetailModal = (props: ValidationDetailModalProps) => (
	<Suspense fallback={null}>
		<LazyValidationDetailModal {...props} />
	</Suspense>
);

export default ValidationDetailModal;