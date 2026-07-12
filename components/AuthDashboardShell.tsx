"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import DashboardShell from "./DashboardShell";

const AuthDashboardShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>
        <DashboardShell>{children}</DashboardShell>
      </SignedIn>
      <SignedOut>{children}</SignedOut>
    </>
  );
};

export default AuthDashboardShell;
