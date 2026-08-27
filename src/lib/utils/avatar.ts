/**
 * Utility functions for handling avatar URLs safely
 */

/**
 * Checks if a URL is a Gravatar URL and should be blocked
 */
export const isGravatarUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.includes('gravatar.com') || url.includes('s.gravatar.com');
};

/**
 * Gets a safe avatar URL, blocking Gravatar URLs and providing fallbacks
 */
export const getSafeAvatarUrl = (
  auth0Picture: string | null | undefined,
  fallbackUrl: string = "/static/avatar/avatar_neutral.svg",
  useRandomFallback: boolean = false
): string => {
  if (!auth0Picture || isGravatarUrl(auth0Picture)) {
    return useRandomFallback ? getRandomAvatar() : fallbackUrl;
  }
  return auth0Picture;
};

/**
 * Gets the best available avatar, prioritizing saved database avatars over Auth0 pictures
 */
export const getBestAvatarUrl = (
  savedAvatar: string | null | undefined,
  auth0Picture: string | null | undefined,
  fallbackUrl: string = "/static/avatar/avatar_neutral.svg"
): string => {
  
  // First priority: saved avatar from database
  if (savedAvatar && !isGravatarUrl(savedAvatar)) {
    return savedAvatar;
  }
  
  // Second priority: Auth0 picture (if not Gravatar)
  if (auth0Picture && !isGravatarUrl(auth0Picture)) {
    return auth0Picture;
  }
  
  // Fallback: default avatar
  return fallbackUrl;
};

/**
 * Default avatar options
 */
export const DEFAULT_AVATARS = {
  male: "/static/avatar/avatar_02.svg",
  female: "/static/avatar/avatar_00.svg",
  neutral: "/static/avatar/avatar_neutral.svg",
  placeholder: "/static/avatar/avatar_neutral.svg"
};

/**
 * Get a random avatar from the available options
 */
export const getRandomAvatar = (): string => {
  const avatars = [
    "/static/avatar/avatar_00.svg",
    "/static/avatar/avatar_01.svg",
    "/static/avatar/avatar_02.svg",
    "/static/avatar/avatar_03.svg",
    "/static/avatar/avatar_neutral.svg",
  ];
  
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
};
