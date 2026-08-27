// Enhanced error messages with solution options

export interface ErrorMessage {
  title: string;
  description: string;
  solutions: string[];
  helpLink?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // File Type Errors
  'invalid_file_type': {
    title: 'Invalid File Type',
    description: 'The file you uploaded is not in a supported format.',
    solutions: [
      'Convert your file to XLSX format using Excel or Google Sheets',
      'Save your file with a .xlsx extension',
      'Ensure you\'re uploading an Excel workbook, not a CSV or other format'
    ],
    helpLink: 'https://socratics.notion.site/Financial-Model-Upload-Cleanse-Categorize-19f3c45d6b8481fb9abdfa2798c13232'
  },

  'file_too_large': {
    title: 'File Size Exceeds Limit',
    description: 'Your file is larger than the maximum allowed size.',
    solutions: [
      'Compress your Excel file by removing unnecessary worksheets',
      'Split large files into smaller workbooks',
      'Remove formatting and images to reduce file size',
      'Use Excel\'s "Save As" with compression options'
    ],
    helpLink: 'https://socratics.notion.site/Financial-Model-Upload-Cleanse-Categorize-19f3c45d6b8481fb9abdfa2798c13232'
  },

  'invalid_file_name': {
    title: 'Invalid File Name',
    description: 'Your file name contains characters that are not allowed.',
    solutions: [
      'Use only letters, numbers, spaces, hyphens, and underscores',
      'Avoid special characters like: < > : " / \\ | ? *',
      'Keep file names under 255 characters',
      'Don\'t use system reserved names like CON, PRN, AUX'
    ]
  },

  'file_empty': {
    title: 'File is Empty',
    description: 'The uploaded file contains no data.',
    solutions: [
      'Ensure your Excel file contains financial data',
      'Check that worksheets are not empty',
      'Verify that cells contain actual values, not just formatting',
      'Try opening the file in Excel to confirm it has content'
    ]
  },

  'invalid_xlsx_structure': {
    title: 'Invalid XLSX File Structure',
    description: 'The Excel file appears to be corrupted or in an unsupported format.',
    solutions: [
      'Open the file in Excel and save it as a new .xlsx file',
      'Try saving the file in Excel 2016 or later format',
      'Check if the file was created by a compatible spreadsheet application',
      'Avoid files saved from online converters or mobile apps'
    ],
    helpLink: 'https://socratics.notion.site/Financial-Model-Upload-Cleanse-Categorize-19f3c45d6b8481fb9abdfa2798c13232'
  },

  'invalid_pdf_structure': {
    title: 'Invalid PDF File Structure',
    description: 'The PDF file appears to be corrupted or password-protected.',
    solutions: [
      'Ensure the PDF is not password-protected',
      'Try opening and re-saving the PDF in a PDF reader',
      'Convert the PDF to Excel format if possible',
      'Check if the PDF was created from a scanned document'
    ]
  },

  'duplicate_file': {
    title: 'File Already Uploaded',
    description: 'This exact file has been uploaded before.',
    solutions: [
      'Upload a different file with updated data',
      'Modify your existing file and save it with a new name',
      'Check if you need to update the existing document instead'
    ]
  },

  'rate_limit_exceeded': {
    title: 'Too Many Upload Attempts',
    description: 'You\'ve exceeded the upload rate limit. Please wait before trying again.',
    solutions: [
      'Wait 60 seconds before attempting another upload',
      'Ensure your file meets all requirements before uploading',
      'Check your internet connection for stability'
    ]
  },

  'upload_failed': {
    title: 'Upload Failed',
    description: 'The file upload was unsuccessful. This may be due to a network issue or server problem.',
    solutions: [
      'Check your internet connection',
      'Try uploading the file again',
      'Ensure the file meets all size and format requirements',
      'Contact support if the problem persists'
    ]
  },

  'validation_failed': {
    title: 'File Validation Failed',
    description: 'The uploaded file did not pass our validation checks.',
    solutions: [
      'Review the specific error messages above',
      'Ensure your file contains the required financial statements',
      'Check that worksheet names match the requirements',
      'Verify that your data spans multiple time periods'
    ],
    helpLink: 'https://socratics.notion.site/Financial-Model-Upload-Cleanse-Categorize-19f3c45d6b8481fb9abdfa2798c13232'
  },

  'no_financial_statements': {
    title: 'No Financial Statements Found',
    description: 'The uploaded file does not contain the required financial statements.',
    solutions: [
      'Ensure your Excel file contains Income Statement and Balance Sheet worksheets',
      'Name your worksheets exactly: "Income Statement" and "Balance Sheet"',
      'Include multiple years of data in your statements',
      'Make sure the data is in a tabular format with clear headers'
    ],
    helpLink: 'https://socratics.notion.site/Financial-Model-Upload-Cleanse-Categorize-19f3c45d6b8481fb9abdfa2798c13232'
  },

  'processing_failed': {
    title: 'File Processing Failed',
    description: 'We encountered an error while processing your financial statements.',
    solutions: [
      'Check that your data is properly formatted in tables',
      'Ensure column headers are clear and descriptive',
      'Remove any merged cells or complex formatting',
      'Try simplifying your spreadsheet structure'
    ],
    helpLink: 'https://socratics.notion.site/Financial-Model-Upload-Cleanse-Categorize-19f3c45d6b8481fb9abdfa2798c13232'
  }
};

// Helper function to get error message by key
export const getErrorMessage = (key: string): ErrorMessage => {
  return ERROR_MESSAGES[key] || {
    title: 'Unknown Error',
    description: 'An unexpected error occurred.',
    solutions: [
      'Please try again',
      'Contact support if the problem persists'
    ]
  };
};

// Helper function to extract error key from error message
export const extractErrorKey = (errorMessage: string): string => {
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('invalid file type') || lowerMessage.includes('unsupported format') || lowerMessage.includes('not supported')) {
    return 'invalid_file_type';
  }
  if (lowerMessage.includes('too large') || lowerMessage.includes('size exceeds') || lowerMessage.includes('maximum size')) {
    return 'file_too_large';
  }
  if (lowerMessage.includes('invalid characters') || lowerMessage.includes('file name') || lowerMessage.includes('reserved')) {
    return 'invalid_file_name';
  }
  if (lowerMessage.includes('empty')) {
    return 'file_empty';
  }
  if (lowerMessage.includes('xlsx') && lowerMessage.includes('structure')) {
    return 'invalid_xlsx_structure';
  }
  if (lowerMessage.includes('pdf') && lowerMessage.includes('structure')) {
    return 'invalid_pdf_structure';
  }
  if (lowerMessage.includes('already uploaded') || lowerMessage.includes('duplicate')) {
    return 'duplicate_file';
  }
  if (lowerMessage.includes('too many upload') || lowerMessage.includes('rate limit') || lowerMessage.includes('wait')) {
    return 'rate_limit_exceeded';
  }
  if (lowerMessage.includes('upload failed') || lowerMessage.includes('failed to upload')) {
    return 'upload_failed';
  }
  if (lowerMessage.includes('no financial statements') || lowerMessage.includes('financial statements were not found')) {
    return 'no_financial_statements';
  }
  if (lowerMessage.includes('processing failed') || lowerMessage.includes('error processing')) {
    return 'processing_failed';
  }
  if (lowerMessage.includes('validation failed') || lowerMessage.includes('did not pass validation')) {
    return 'validation_failed';
  }
  
  return 'upload_failed'; // default fallback
};

// Helper function to format error message for display
export const formatErrorForDisplay = (errorMessage: string): ErrorMessage => {
  const errorKey = extractErrorKey(errorMessage);
  return getErrorMessage(errorKey);
}; 