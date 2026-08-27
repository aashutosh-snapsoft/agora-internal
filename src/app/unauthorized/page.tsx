"use client";

// app/unauthorized/page.tsx
import RequiresTenantPage from "@/components/RequiresTenant";

export default function UnauthorizedPage() {
	return <RequiresTenantPage />;
}
