"use client";

import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect } from "react";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";

const GuestGuard: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const { authenticatedUser, loading } = useAppSelector(userSelector);
  const isAuthenticated = Boolean(authenticatedUser);

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) router.replace("/dashboard");
  }, [loading, isAuthenticated, router]);

  return <>{children}</>;
};

export default GuestGuard;
