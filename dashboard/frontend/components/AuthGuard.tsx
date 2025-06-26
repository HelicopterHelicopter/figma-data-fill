"use client";

import { useEffect, useState } from "react";
import { authService, User } from "@/lib/auth";
import LoginPage from "./LoginPage";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const authenticated = authService.isAuthenticated();
    const currentUser = authService.getUser();

    setIsAuthenticated(authenticated);
    setUser(currentUser);
  };

  // Still checking authentication status
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // User is not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
