import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { updateUserProfile, fetchAuthenticatedUser } from '@/store/users/user-thunks';
import { userSelector } from '@/store/users/user-selectors';
import { getBestAvatarUrl } from '@/lib/utils/avatar';

/**
 * Custom hook for centralized avatar management across all components
 * Ensures real-time synchronization between ProfilePopover, profile page, and other components
 */
export const useAvatarManager = () => {
  const dispatch = useAppDispatch();
  const { authenticatedUser } = useAppSelector(userSelector);
  
  // Centralized avatar state
  const [currentAvatar, setCurrentAvatar] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasLocalChange, setHasLocalChange] = useState(false);

  // Initialize avatar state when user data is available
  useEffect(() => {
    if (authenticatedUser?.image_url) {
      const bestAvatar = authenticatedUser?.image_url || "";
      setCurrentAvatar(bestAvatar);
    }
  }, [authenticatedUser?.image_url]);

  // Save avatar to database and update all components
  const saveAvatar = useCallback(async (newAvatarUrl: string) => {
    if (!authenticatedUser?.id) {
      console.error('No authenticated user found');
      return;
    }
    setIsUpdating(true);
    setHasLocalChange(true); // Mark that we have a local change
    
    try {
      // Update local state IMMEDIATELY for instant UI update
      setCurrentAvatar(newAvatarUrl);
      
      // Save to database
      await dispatch(updateUserProfile({
        userId: authenticatedUser.id,
        userData: { image_url: newAvatarUrl }
      })).unwrap();
      
      // Clear the local change flag before refetching so the useEffect can update
      setHasLocalChange(false);
      
      // Refetch user data to update the Redux state
      await dispatch(fetchAuthenticatedUser({ forceRefresh: true })).unwrap();
      
      return true;
    } catch (error) {
      console.error('Failed to save avatar:', error);
      // Revert to previous avatar on error
      setCurrentAvatar(authenticatedUser?.image_url || "");
      setHasLocalChange(false); // Clear local change flag on error
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, authenticatedUser?.id, authenticatedUser?.image_url]);

  // Update avatar state when user data changes, but prioritize local changes
  useEffect(() => {
    // Only update if we don't have a local avatar change pending
    if (!isUpdating && !hasLocalChange) {
      const bestAvatar = authenticatedUser?.image_url || "";
      setCurrentAvatar(bestAvatar);
    } else if (hasLocalChange) {
      console.info('useAvatarManager - Skipping update due to local change');
    }
  }, [authenticatedUser?.image_url, isUpdating, hasLocalChange]);

  // Get the best available avatar URL
  const getAvatarUrl = useCallback(() => {
    const bestUrl = getBestAvatarUrl(currentAvatar, undefined);
    return bestUrl;
  }, [currentAvatar]);

  // Get avatar for specific component with fallback
  const getComponentAvatar = useCallback((componentId: string) => {
    return {
      url: getAvatarUrl(),
      isUpdating,
      saveAvatar,
      currentAvatar
    };
  }, [getAvatarUrl, isUpdating, saveAvatar, currentAvatar]);

  // Function to manually clear local change flag (useful for syncing with database)
  const clearLocalChange = useCallback(() => {
    setHasLocalChange(false);
  }, []);

  return {
    currentAvatar,
    isUpdating,
    saveAvatar,
    getAvatarUrl,
    getComponentAvatar,
    clearLocalChange,
    hasLocalChange
  };
};
