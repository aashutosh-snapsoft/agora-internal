import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { updateUserProfile } from '@/store/users/user-thunks';
import { userSelector } from '@/store/users/user-selectors';
import { getBestAvatarUrl } from '@/lib/utils/avatar';

interface AvatarContextType {
  currentAvatar: string;
  isUpdating: boolean;
  hasLocalChange: boolean;
  saveAvatar: (newAvatarUrl: string) => Promise<boolean>;
  getAvatarUrl: () => string;
  clearLocalChange: () => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

interface AvatarProviderProps {
  children: ReactNode;
}

export const AvatarProvider: React.FC<AvatarProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { authenticatedUser } = useAppSelector(userSelector);
  
  // Shared avatar state across all components
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
      return false;
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
      
      // Keep the local change flag active to prevent override from Redux state
      // The local state is already updated with the new avatar
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
      console.warn('AvatarContext - Skipping update due to local change');
    }
  }, [authenticatedUser?.image_url, isUpdating, hasLocalChange]);

  // Get the best available avatar URL
  const getAvatarUrl = useCallback(() => {
    const bestUrl = getBestAvatarUrl(currentAvatar, undefined);
    return bestUrl;
  }, [currentAvatar]);

  // Function to manually clear local change flag
  const clearLocalChange = useCallback(() => {
    setHasLocalChange(false);
  }, []);

  const value: AvatarContextType = {
    currentAvatar,
    isUpdating,
    hasLocalChange,
    saveAvatar,
    getAvatarUrl,
    clearLocalChange
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatarContext = (): AvatarContextType => {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error('useAvatarContext must be used within an AvatarProvider');
  }
  return context;
};
