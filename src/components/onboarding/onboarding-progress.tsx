import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { OnboardingUploadState, OnboardingChatState } from '@/types/onboarding/chat';
import { Project } from '@/types/project';
import { 
  Upload, 
  FileText, 
  Building, 
  Check 
} from '@phosphor-icons/react';

interface OnboardingProgressProps {
  uploadState: OnboardingUploadState;
  chatState: OnboardingChatState;
  project: Project | null;
  pastStates: OnboardingChatState[];
}

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  weight: number;
  isCompleted: boolean;
  isActive: boolean;
  isFileProcessing?: boolean;
  isBusinessData?: boolean;
  icon: React.ComponentType<any>;
}

const getUploadStateRank = (state: OnboardingUploadState): number => {
  switch (state) {
    case OnboardingUploadState.UPLOADED:
      return 1;
    case OnboardingUploadState.PROCESSING_DATA:
    case OnboardingUploadState.PROCESSING_FAILED:
      return 2;
    case OnboardingUploadState.PROCESSING_FINANCIALS:
      return 3;
    case OnboardingUploadState.GENERATING_SUMMARY_ROLLUPS:
      return 4;
    case OnboardingUploadState.FINANCIAL_MODEL_READY:
      return 5;
    case OnboardingUploadState.INITIAL:
    case OnboardingUploadState.NO_VALID_DOCUMENTS:
    default:
      return 0;
  }
};

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  uploadState,
  chatState,
  project,
  pastStates,
}) => {
  const uploadStateRank = useMemo(
    () => getUploadStateRank(uploadState),
    [uploadState]
  );
  const fileProcessingComplete =
    uploadState === OnboardingUploadState.FINANCIAL_MODEL_READY;

  const steps = useMemo((): OnboardingStep[] => {
    const chatComplete = chatState === OnboardingChatState.FINANCIAL_MODEL_COMPLETE;
    const readyStepCompleted = fileProcessingComplete && chatComplete;
    const readyStepActive = fileProcessingComplete && !readyStepCompleted;

    return [
      {
        id: 'upload',
        label: 'Upload',
        description: 'Upload your financial statements',
        weight: 20,
        isCompleted: uploadStateRank >= 2,
        isActive: chatState === OnboardingChatState.UPLOAD_FILES && uploadStateRank < 2,
        isFileProcessing: false,
        icon: Upload,
      },
      {
        id: 'processing',
        label: 'Processing',
        description: 'AI analyzes your documents',
        weight: 30,
        isCompleted: fileProcessingComplete,
        isActive:
          uploadState === OnboardingUploadState.PROCESSING_DATA ||
          uploadState === OnboardingUploadState.PROCESSING_FINANCIALS ||
          uploadState === OnboardingUploadState.GENERATING_SUMMARY_ROLLUPS,
        isFileProcessing: true,
        icon: FileText,
      },
      {
        id: 'ready',
        label: 'Model is ready',
        description: 'Your model is ready to use',
        weight: 25,
        isCompleted: readyStepCompleted,
        isActive: readyStepActive,
        isFileProcessing: false,
        icon: Check,
      },
    ];
  }, [uploadState, chatState, uploadStateRank, fileProcessingComplete]);

  const [displayProgress, setDisplayProgress] = React.useState(0);
  const [stateStartTime, setStateStartTime] = React.useState<number>(Date.now());
  const [previousProgress, setPreviousProgress] = React.useState(0);

  // Track when upload state changes to reset timer for smooth interpolation
  React.useEffect(() => {
    setStateStartTime(Date.now());
    const baseProgress = (() => {
      if (fileProcessingComplete) return 100;
      const completedWeight = steps
        .filter((step) => step.isCompleted)
        .reduce((sum, step) => sum + step.weight, 0);
      return completedWeight;
    })();
    setPreviousProgress(baseProgress);
  }, [uploadState, fileProcessingComplete, steps]);

  const progress = useMemo(() => {
    if (fileProcessingComplete) {
      return 100;
    }

    const completedWeight = steps
      .filter((step) => step.isCompleted)
      .reduce((sum, step) => sum + step.weight, 0);

    const activeStep = steps.find((step) => step.isActive);

    const getActiveStepFraction = (step: OnboardingStep): number => {
      switch (step.id) {
        case "upload":
          return uploadState === OnboardingUploadState.UPLOADED ? 0.5 : 0;
        case "processing":
          if (uploadState === OnboardingUploadState.PROCESSING_DATA) return 0.33;
          if (uploadState === OnboardingUploadState.PROCESSING_FINANCIALS)
            return 0.66;
          if (uploadState === OnboardingUploadState.GENERATING_SUMMARY_ROLLUPS)
            return 0.95;
          return 0;
        case "ready":
          return 0.5;
        default:
          return 0;
      }
    };

    const partialProgress = activeStep
      ? activeStep.weight * getActiveStepFraction(activeStep)
      : 0;

    // Cap progress below 100 until the model is definitively ready
    const targetProgress = Math.min(99, completedWeight + partialProgress);

    return targetProgress;
  }, [steps, uploadState, fileProcessingComplete]);

  // Smooth continuous progress animation
  React.useEffect(() => {
    if (progress === 100) {
      // Small delay before showing 100% to let users see completion
      const timer = setTimeout(() => {
        setDisplayProgress(100);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // Animate progress smoothly from previous value to target
    const duration = 2000; // 2 seconds to reach target
    const startTime = Date.now();
    const startProgress = previousProgress;
    const targetProgress = progress;

    // Only animate if there's a meaningful difference
    if (Math.abs(targetProgress - startProgress) < 0.1) {
      setDisplayProgress(targetProgress);
      return;
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      // Ease-out function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);
      const currentProgress = startProgress + (targetProgress - startProgress) * easeOut;
      
      setDisplayProgress(currentProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      } else {
        setPreviousProgress(targetProgress);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [progress, previousProgress]);

  const getStepStatus = (step: OnboardingStep) => {
    if (step.isCompleted) return 'completed';
    if (step.isActive) return 'active';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '';
      case 'active': return '';
      default: return '';
    }
  };

  const getIconColor = (status: string, isDisabled: boolean) => {
    if (isDisabled) return 'grey.400';
    switch (status) {
      case 'completed': return 'success.main';
      case 'active': return 'primary.main';
      default: return 'grey.500';
    }
  };

  const getIconOpacity = (status: string, isDisabled: boolean) => {
    if (isDisabled) return 0.4;
    switch (status) {
      case 'completed': return 1;
      case 'active': return 1;
      default: return 0.6;
    }
  };

  const getCurrentStatusText = () => {
    if (
      uploadState === OnboardingUploadState.FINANCIAL_MODEL_READY &&
      chatState === OnboardingChatState.FINANCIAL_MODEL_COMPLETE
    ) {
      return " Onboarding complete! Your financial model is ready.";
    }

    if (uploadState === OnboardingUploadState.INITIAL) {
      return " Please upload your financial statements to begin.";
    }

    return " Processing in progress... Please wait while we prepare your financial model.";
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant="Text4Regular"
            sx={{ 
              fontFamily: "Satoshi Variable",
              color: "text.primary"
            }}
          >
            Building a Model
          </Typography>
          <Typography 
            variant="Text4Regular"
            sx={{ 
              fontFamily: "Satoshi Variable",
              color: "text.primary"
            }}
          >
            {Math.round(displayProgress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={displayProgress} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
            }
          }} 
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const isDisabled = !step.isCompleted && !step.isActive;
          const IconComponent = step.icon;
          
          return (
            <Box 
              key={step.id}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                p: 1.25,
                opacity: isDisabled ? 0.8 : 1,
                transition: 'opacity 0.2s ease-in-out',
              }}
            >
              {/* Icon */}
              <Box 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: status === 'completed' ? 'grey.800' : 
                                 status === 'active' ? 'primary.main' : 'grey.300',
                  color: status === 'completed' || status === 'active' ? 'white' : 'grey.700',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <IconComponent 
                  size={18} 
                  weight={status === 'completed' ? 'fill' : 'regular'}
                />
              </Box>


              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={isDisabled ? 'text.secondary' : 'text.primary'}
                  >
                    {step.label}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>


    </Box>
  );
};

export default OnboardingProgress; 
