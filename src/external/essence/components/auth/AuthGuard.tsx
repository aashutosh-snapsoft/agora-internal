"use client";

import { FC, PropsWithChildren, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
import { LoadingScreen } from "@/components/loading-screen";

const AuthGuard: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const { authenticatedUser, loading } = useAppSelector(userSelector);
  const isAuthenticated = Boolean(authenticatedUser);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.replace("/welcome");
    else setIsLoggedIn(true);
  }, [loading, isAuthenticated, router]);

  if (!authenticatedUser) return <LoadingScreen />;
  if (isLoggedIn) return <>{children}</>;

  return <LoadingScreen />;
};

export default AuthGuard;
