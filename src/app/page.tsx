import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isFeatureEnabled } from "@/lib/feature-flags";
import LandingPage from "@/components/marketing/LandingPage";

export const metadata = {
  title: "Asset Tracker - Modern Asset Management for Teams",
  description:
    "Track, manage, and optimize your organization's assets, licenses, and consumables with Asset Tracker.",
};

export default async function Home() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Ignore auth errors (e.g. stale JWT) — treat as unauthenticated
  }

  if (session?.user) {
    redirect("/dashboard");
  }

  // Self-hosted mode: skip landing page, go straight to login
  if (isFeatureEnabled("selfHosted")) {
    redirect("/login");
  }

  return <LandingPage />;
}
