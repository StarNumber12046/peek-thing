// app/providers.js
"use client";
import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { env } from "~/env";
import { useAuth, useUser } from "@clerk/nextjs";

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    person_profiles: "always", // or 'always' to create profiles for anonymous users as well
  });
}
export function PostHogClerkWrapper({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const userInfo = useUser();
  useEffect(() => {
    if (userInfo.user) {
      posthog.identify(userInfo.user.id, {
        email: userInfo.user.emailAddresses[0]?.emailAddress,
        username: userInfo.user.username,
        name: userInfo.user.fullName,
      });
    } else if (!auth.isSignedIn) posthog.reset();
  }, [userInfo, auth]);
  return children;
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogClerkWrapper>{children}</PostHogClerkWrapper>
    </PostHogProvider>
  );
}
