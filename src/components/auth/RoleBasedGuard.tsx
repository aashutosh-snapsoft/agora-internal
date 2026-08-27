"use client";

import { PropsWithChildren } from "react";
// CUSTOM DEFINED HOOK
import { useAppSelector } from "@/store/store";
import { selectCurrentRole } from "@/store/auth/auth-selector";
// CUSTOM COMPONENTS


// ==============================================================
interface Props extends PropsWithChildren {
  roles: string[];
}
// ==============================================================

const RoleBasedGuard = ({ children, roles }: Props) => {
  const currentRole = useAppSelector(selectCurrentRole);

  if (currentRole && roles.includes(currentRole))
    return <>{children}</>;

  return (<>
      <p>You are not authorized to access this page.</p>
    </>
  );
};

export default RoleBasedGuard;
