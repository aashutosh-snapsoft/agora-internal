import React from 'react';
import { Box, Typography, Alert, Link, List, ListItem, ListItemIcon } from '@mui/material';
import { Warning, CheckCircle, Lightbulb } from '@phosphor-icons/react';
import { formatErrorForDisplay, ErrorMessage } from '@/lib/utils/errorMessages';

interface EnhancedErrorDisplayProps {
  errorMessage: string;
  sx?: any;
}

const EnhancedErrorDisplay: React.FC<EnhancedErrorDisplayProps> = ({ 
  errorMessage, 
  sx = {} 
}) => {
  const errorInfo = formatErrorForDisplay(errorMessage);

  return (
    <Alert 
      severity="error" 
      icon={false}
      sx={{ 
        mt: 2,
        '& .MuiAlert-message': {
          width: '100%',
          fontSize: '14px',
          lineHeight: 1.4
        },
        ...sx
      }}
    >
      <Box sx={{ width: '100%' }}>
        {/* Error Title and Description */}
        <Typography 
          variant="Text5Bold" 
          color="error.main" 
          sx={{ mb: 2, fontSize: '16px' }}
        >
          {errorInfo.title}
          <br />
          <span style={{ fontWeight: 'normal', fontSize: '14px' }}>
            {errorInfo.description}
          </span>
        </Typography>
        
        {/* Solutions Section */}
        {errorInfo.solutions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <List dense sx={{ py: 0, pl: 0 }}>
              {errorInfo.solutions.map((solution, index) => (
                <ListItem 
                  key={index} 
                  sx={{ 
                    py: 0.5, 
                    px: 0,
                    alignItems: 'baseline',
                    '&:before': {
                      content: '"•"',
                      color: 'error.main',
                      fontWeight: 'bold',
                      marginRight: 1,
                      fontSize: '16px',
                      lineHeight: 1.4,
                      display: 'inline-block',
                      verticalAlign: 'baseline'
                    }
                  }}
                >
                  <Typography 
                    variant="Text6Medium" 
                    color="error.main" 
                    sx={{ fontSize: '13px', lineHeight: 1.4 }}
                  >
                    {solution}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {/* Help Link */}
        {errorInfo.helpLink && (
          <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'grey.200' }}>
            <Link 
              href={errorInfo.helpLink} 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 0.5,
                color: 'text.primary',
                textDecoration: 'underline',
                fontSize: '13px',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              <Typography variant="Text6Medium" sx={{ fontSize: '13px' }}>
                View detailed formatting guide
              </Typography>
            </Link>
          </Box>
        )}
      </Box>
    </Alert>
  );
};

export default EnhancedErrorDisplay; 