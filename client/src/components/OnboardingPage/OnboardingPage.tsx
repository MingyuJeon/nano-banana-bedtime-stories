import React from "react";
import StickyScrollOnboarding from "./StickyScrollOnboarding";

interface OnboardingPageProps {
  onComplete: () => void;
}

function OnboardingPage({ onComplete }: OnboardingPageProps) {
  return <StickyScrollOnboarding onComplete={onComplete} />;
}

export default OnboardingPage;