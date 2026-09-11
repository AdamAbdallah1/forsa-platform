export const isAdminAccount = (account) => {
  if (!account) return false;

  return account.role === "admin";
};

export const isVerifiedUser = (user) => {
  if (!user) return false;

  return (
    user.providerData.some(
      (provider) => provider.providerId === "google.com"
    ) || user.emailVerified === true
  );
};

/*
 * A newly registered seeker still needs onboarding until their Firestore
 * account carries the profile fields that onboarding persists (skills and
 * lookingFor). isNewRegistration is written only by registerUser and
 * loginWithGoogle, so pre-feature accounts are never treated as new.
 */
export const needsOnboarding = (account) => {
  if (!account) return false;
  if (account.accountType !== "finder") return false;

  const hasProfileFields =
    Array.isArray(account.skills) && account.skills.length > 0 &&
    Array.isArray(account.lookingFor) && account.lookingFor.length > 0;

  if (hasProfileFields) return false;

  return account.isNewRegistration === true;
};

/*
 * The single canonical post-authentication destination.
 *
 * Resolves a resolved account (AuthContext, fully loaded) to one existing
 * application route. Admin wins over onboarding; hiring wins over onboarding;
 * a completed seeker lands on /explore; a newly registered seeker that still
 * needs a profile lands on /onboarding.
 */
export const getPostAuthDestination = (account) => {
  if (!account) {
    return "/explore";
  }

  if (isAdminAccount(account)) {
    return "/admin-review";
  }

  if (account.accountType === "hiring") {
    return "/dashboard";
  }

  if (needsOnboarding(account)) {
    return "/onboarding";
  }

  return "/explore";
};