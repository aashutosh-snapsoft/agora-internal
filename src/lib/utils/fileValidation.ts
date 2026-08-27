// File validation utilities for enhanced upload protection

export const VALID_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'application/pdf': '.pdf',
  'text/csv': '.csv',
  'text/plain': '.txt'
} as const;

export const VALID_EXTENSIONS = ['.xlsx', '.xls', '.pdf', '.csv', '.txt'] as const;

export const FILE_SIZE_LIMITS = {
  '.xlsx': 50 * 1024 * 1024, // 50MB for Excel files
  '.xls': 20 * 1024 * 1024,  // 20MB for old Excel files
  '.pdf': 25 * 1024 * 1024,  // 25MB for PDF files
  '.csv': 10 * 1024 * 1024,  // 10MB for CSV files
  '.txt': 5 * 1024 * 1024,   // 5MB for text files
  'default': 10 * 1024 * 1024 // 10MB default
} as const;

export const UPLOAD_RATE_LIMIT = {
  maxUploadsPerMinute: 5,
  maxConcurrentUploads: 2,
  cooldownPeriod: 60000 // 1 minute
} as const;

// File type validation with magic number checks
export const validateFileType = (file: File): boolean => {
  // Check MIME type
  const isValidMimeType = Object.keys(VALID_FILE_TYPES).includes(file.type);
  
  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidExtension = VALID_EXTENSIONS.includes(fileExtension as any);
  
  return isValidMimeType && isValidExtension;
};

// File content validation to detect corrupted files
export const validateFileContent = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // Check if file is empty
    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }
    
    const arrayBuffer = await file.slice(0, 8).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check for corrupted Excel files
    if (file.name.toLowerCase().endsWith('.xlsx')) {
      const zipSignature = [0x50, 0x4B, 0x03, 0x04]; // ZIP signature
      const isValidZip = zipSignature.every((byte, i) => uint8Array[i] === byte);
      if (!isValidZip) {
        return { isValid: false, error: 'Invalid XLSX file structure' };
      }
    }
    
    if (file.name.toLowerCase().endsWith('.xls')) {
      const oleSignature = [0xD0, 0xCF, 0x11, 0xE0]; // OLE signature
      const isValidOle = oleSignature.every((byte, i) => uint8Array[i] === byte);
      if (!isValidOle) {
        return { isValid: false, error: 'Invalid XLS file structure' };
      }
    }
    
    // Check for corrupted PDF files
    if (file.name.toLowerCase().endsWith('.pdf')) {
      const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
      const isValidPdf = pdfSignature.every((byte, i) => uint8Array[i] === byte);
      if (!isValidPdf) {
        return { isValid: false, error: 'Invalid PDF file structure' };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Unable to validate file content' };
  }
};

// File size validation with extension-specific limits
export const validateFileSize = (file: File): boolean => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const maxSize = FILE_SIZE_LIMITS[extension as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
  return file.size <= maxSize;
};

// File name validation
export const validateFileName = (fileName: string): { isValid: boolean; error?: string } => {
    // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(fileName)) {
    return { isValid: false, error: 'File name contains invalid characters' };
  }
  
  // Check for control characters
  for (let i = 0; i < fileName.length; i++) {
    const charCode = fileName.charCodeAt(i);
    if (charCode < 32) {
      return { isValid: false, error: 'File name contains invalid characters' };
    }
  }
  
  // Check for reserved names
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 
    'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 
    'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  const nameWithoutExtension = fileName.split('.')[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExtension)) {
    return { isValid: false, error: 'File name is reserved by the system' };
  }
  
  // Check length
  if (fileName.length > 255) {
    return { isValid: false, error: 'File name is too long (max 255 characters)' };
  }
  
  return { isValid: true };
};

// File integrity check using checksums
export const calculateFileChecksum = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Rate limiting for uploads
export class UploadRateLimiter {
  private uploadCount = 0;
  private lastUploadTime = 0;
  private activeUploads = 0;
  
  canUpload(): boolean {
    const now = Date.now();
    if (now - this.lastUploadTime > UPLOAD_RATE_LIMIT.cooldownPeriod) {
      this.uploadCount = 0;
    }
    
    return this.uploadCount < UPLOAD_RATE_LIMIT.maxUploadsPerMinute && 
           this.activeUploads < UPLOAD_RATE_LIMIT.maxConcurrentUploads;
  }
  
  startUpload(): void {
    this.uploadCount++;
    this.lastUploadTime = Date.now();
    this.activeUploads++;
  }
  
  endUpload(): void {
    this.activeUploads = Math.max(0, this.activeUploads - 1);
  }
  
  getTimeUntilNextUpload(): number {
    const now = Date.now();
    const timeSinceLastUpload = now - this.lastUploadTime;
    return Math.max(0, UPLOAD_RATE_LIMIT.cooldownPeriod - timeSinceLastUpload);
  }
}

// Duplicate file detection using checksums
export class DuplicateFileDetector {
  private uploadedChecksums = new Set<string>();
  
  async isDuplicate(file: File): Promise<boolean> {
    const checksum = await calculateFileChecksum(file);
    return this.uploadedChecksums.has(checksum);
  }
  
  async addFile(file: File): Promise<void> {
    const checksum = await calculateFileChecksum(file);
    this.uploadedChecksums.add(checksum);
  }
  
  clear(): void {
    this.uploadedChecksums.clear();
  }
}

// Comprehensive file validation
export const validateFileProgressively = async (
  file: File, 
  duplicateDetector: DuplicateFileDetector
): Promise<{ isValid: boolean; error?: string }> => {
  // Step 1: Basic validation
  const nameValidation = validateFileName(file.name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }
  
  // Step 2: Size validation
  if (!validateFileSize(file)) {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const maxSize = FILE_SIZE_LIMITS[extension as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
    return { 
      isValid: false, 
      error: `File size exceeds limit. Maximum size for ${extension} files is ${formatFileSize(maxSize)}` 
    };
  }
  
  // Step 3: Type validation
  if (!validateFileType(file)) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return { 
      isValid: false, 
      error: `Invalid file type. File extension "${fileExtension}" is not supported. Please upload XLSX, XLS, PDF, CSV, or TXT files only.` 
    };
  }
  
  // Step 4: Content validation (async)
  const contentValidation = await validateFileContent(file);
  if (!contentValidation.isValid) {
    return contentValidation;
  }
  
  // Step 5: Duplicate check (async)
  const isDuplicate = await duplicateDetector.isDuplicate(file);
  if (isDuplicate) {
    return { isValid: false, error: 'This file has already been uploaded' };
  }
  
  return { isValid: true };
};

// Utility function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
  return '.' + filename.split('.').pop()?.toLowerCase();
};

// Get max file size for a given extension
export const getMaxFileSize = (filename: string): number => {
  const extension = getFileExtension(filename);
  return FILE_SIZE_LIMITS[extension as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default;
}; 