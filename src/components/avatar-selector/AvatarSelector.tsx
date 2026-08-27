import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Avatar,
    IconButton,
    Box,
    Typography,
    Button
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Check, X } from '@phosphor-icons/react';
import { DEFAULT_AVATARS } from '@/lib/utils/avatar';

interface AvatarSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect?: (avatarUrl: string) => void;
    onSave?: (avatarUrl: string) => Promise<void>;
    currentAvatar?: string;
    showSaveButton?: boolean;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
    open,
    onClose,
    onSelect,
    onSave,
    currentAvatar,
    showSaveButton = false
}) => {
    const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || DEFAULT_AVATARS.placeholder);
    const [isSaving, setIsSaving] = useState(false);

    // Update selectedAvatar when currentAvatar prop changes
    React.useEffect(() => {
        if (currentAvatar) {
            setSelectedAvatar(currentAvatar);
        }
    }, [currentAvatar]);

    const allAvatars = [
        { url: "/static/avatar/avatar_00.svg", label: "00" },
        { url: "/static/avatar/avatar_01.svg", label: "01" },
        { url: "/static/avatar/avatar_02.svg", label: "02" },
        { url: "/static/avatar/avatar_03.svg", label: "03" },
        { url: "/static/avatar/avatar_neutral.svg", label: "neutral" },
    ];

    const handleAvatarClick = (avatarUrl: string) => {
        setSelectedAvatar(avatarUrl);
    };





    const handleSave = async () => {
        if (onSave) {
            setIsSaving(true);
            try {
                await onSave(selectedAvatar);
                if (onSelect) {
                    onSelect(selectedAvatar);
                }
                onClose();
            } catch (error) {
                console.error('Failed to save avatar:', error);
                // You could add error handling here (toast notification, etc.)
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            {/* <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Choose Your Avatar</Typography>
          <IconButton onClick={onClose} size="small">
            <X />
          </IconButton>
        </Box>
      </DialogTitle> */}

            <DialogContent>
                <Grid container spacing={2}>
                    {allAvatars.map((avatar) => (
                        <Grid size={{ xs: 3, sm: 2 }} key={avatar.url}>
                            <Box
                                sx={{
                                    cursor: 'pointer',
                                    border: selectedAvatar === avatar.url ? '3px solid #333333' : '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    p: 1,
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: '#333333',
                                        transform: 'scale(1.05)'
                                    }
                                }}
                                onClick={() => handleAvatarClick(avatar.url)}
                            >
                                <Avatar
                                    src={avatar.url}
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        mx: 'auto'
                                    }}
                                />

                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Box display="flex" justifyContent="flex-start" gap={2} mt={3}>
                    {onSave && (
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Typography
                                variant="body1"
                                fontWeight={500}
                                sx={{ fontSize: "14px" }}
                            >
                            {isSaving ? 'Saving...' : 'Save'}
                            </Typography>
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            color: 'text.secondary',
                            borderColor: 'grey.300',
                            '&:hover': {
                                borderColor: 'grey.400',
                                backgroundColor: 'grey.50'
                            }
                        }}
                    >
                        <Typography
                            variant="body1"
                            fontWeight={500}
                            sx={{ fontSize: "14px" }}
                        >
                            Cancel
                        </Typography>
                        {/* Cancel */}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default AvatarSelector;
