import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { api, setAuthTokenProvider } from "@/lib/api";

/**
 * Bridges Clerk auth into the API client:
 *  - Registers a token provider so every fetch sends a fresh JWT.
 *  - Syncs the signed-in user into the backend DB exactly once per session.
 *
 * Render this once inside <SignedIn> (after <ClerkProvider>).
 */
export function AuthBridge() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setAuthTokenProvider(() => getToken());
    } else {
      setAuthTokenProvider(null);
      syncedRef.current = false;
    }

    return () => {
      // On unmount, leave the provider in place — the component lives for the
      // whole signed-in session, so this only fires on full teardown.
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || syncedRef.current) return;
    syncedRef.current = true;

    api.syncUser().catch((err) => {
      console.warn("User sync failed:", err);
      // Allow a retry on the next mount if it failed.
      syncedRef.current = false;
    });
  }, [isLoaded, isSignedIn]);

  return null;
}
