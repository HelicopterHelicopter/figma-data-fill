"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { authService } from "@/lib/auth";
import { RefreshCw } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.initializeGoogleAuth();

      // Render the Google Sign-In button
      setTimeout(() => {
        authService.renderSignInButton("google-signin-button");
      }, 100);
    } catch (error) {
      console.error("Failed to initialize Google Auth:", error);
      setError("Failed to load Google Sign-In. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    initializeAuth();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Data Fill Plugin Dashboard
          </CardTitle>
          <p className="text-gray-600">
            Sign in to manage your Figma plugin datasets
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading authentication...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Sign in with your Google account to continue
                </p>
                <div
                  id="google-signin-button"
                  className="flex justify-center"
                />
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>
                  By signing in, you agree to use this dashboard to manage mock
                  data for your Figma Data Fill plugin.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
