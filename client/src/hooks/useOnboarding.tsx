import { useState, useEffect } from "react";

interface UseOnboardingReturn {
  shouldShowOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed or skipped onboarding
    const completed = localStorage.getItem('ekrili_onboarding_completed');
    const skipped = localStorage.getItem('ekrili_onboarding_skipped');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    // Only show onboarding for authenticated users who haven't completed it
    if (isAuthenticated === 'true' && !completed && !skipped) {
      // Small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        setShouldShowOnboarding(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = () => {
    // Clear any previous onboarding state
    localStorage.removeItem('ekrili_onboarding_completed');
    localStorage.removeItem('ekrili_onboarding_skipped');
    setShouldShowOnboarding(true);
  };

  const completeOnboarding = () => {
    localStorage.setItem('ekrili_onboarding_completed', 'true');
    setShouldShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('ekrili_onboarding_skipped', 'true');
    setShouldShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('ekrili_onboarding_completed');
    localStorage.removeItem('ekrili_onboarding_skipped');
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
};