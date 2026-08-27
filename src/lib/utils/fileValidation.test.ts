import { 
  validateFileType, 
  validateFileSize, 
  validateFileName, 
  validateFileContent,
  formatFileSize,
  getFileExtension,
  getMaxFileSize,
  FILE_SIZE_LIMITS,
  VALID_EXTENSIONS
} from './fileValidation';

// Mock File object for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('File Validation Utilities', () => {
  describe('validateFileType', () => {
    it('should validate correct file types', () => {
      const xlsxFile = createMockFile('test.xlsx', 1000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');
      const txtFile = createMockFile('test.txt', 1000, 'text/plain');
      
      expect(validateFileType(xlsxFile)).toBe(true);
      expect(validateFileType(pdfFile)).toBe(true);
      expect(validateFileType(txtFile)).toBe(true);
    });

    it('should reject invalid file types', () => {
      const invalidFile = createMockFile('test.exe', 1000, 'application/x-executable');
      expect(validateFileType(invalidFile)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should validate file sizes within limits', () => {
      const smallXlsx = createMockFile('test.xlsx', 1024 * 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); // 1MB
      const smallPdf = createMockFile('test.pdf', 1024 * 1024, 'application/pdf'); // 1MB
      
      expect(validateFileSize(smallXlsx)).toBe(true);
      expect(validateFileSize(smallPdf)).toBe(true);
    });

    it('should reject files exceeding size limits', () => {
      const largeXlsx = createMockFile('test.xlsx', 100 * 1024 * 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); // 100MB
      const largePdf = createMockFile('test.pdf', 50 * 1024 * 1024, 'application/pdf'); // 50MB
      
      expect(validateFileSize(largeXlsx)).toBe(false);
      expect(validateFileSize(largePdf)).toBe(false);
    });
  });

  describe('validateFileName', () => {
    it('should validate correct file names', () => {
      expect(validateFileName('valid-file.xlsx')).toEqual({ isValid: true });
      expect(validateFileName('my document.pdf')).toEqual({ isValid: true });
      expect(validateFileName('data_2023.csv')).toEqual({ isValid: true });
    });

    it('should reject file names with invalid characters', () => {
      expect(validateFileName('file<>.xlsx')).toEqual({ 
        isValid: false, 
        error: 'File name contains invalid characters' 
      });
      expect(validateFileName('file|.pdf')).toEqual({ 
        isValid: false, 
        error: 'File name contains invalid characters' 
      });
    });

    it('should reject reserved file names', () => {
      expect(validateFileName('CON.xlsx')).toEqual({ 
        isValid: false, 
        error: 'File name is reserved by the system' 
      });
      expect(validateFileName('PRN.pdf')).toEqual({ 
        isValid: false, 
        error: 'File name is reserved by the system' 
      });
    });

    it('should reject overly long file names', () => {
      const longName = 'a'.repeat(256) + '.xlsx';
      expect(validateFileName(longName)).toEqual({ 
        isValid: false, 
        error: 'File name is too long (max 255 characters)' 
      });
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.xlsx')).toBe('.xlsx');
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('data.csv')).toBe('.csv');
    });
  });

  describe('getMaxFileSize', () => {
    it('should return correct max file sizes', () => {
      expect(getMaxFileSize('test.xlsx')).toBe(FILE_SIZE_LIMITS['.xlsx']);
      expect(getMaxFileSize('document.pdf')).toBe(FILE_SIZE_LIMITS['.pdf']);
      expect(getMaxFileSize('unknown.xyz')).toBe(FILE_SIZE_LIMITS.default);
    });
  });

  describe('validateFileContent', () => {
    it('should reject empty files', async () => {
      const emptyFile = createMockFile('empty.xlsx', 0, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const result = await validateFileContent(emptyFile);
      expect(result).toEqual({ isValid: false, error: 'File is empty' });
    });

    it('should validate non-empty files', async () => {
      const validFile = createMockFile('test.xlsx', 1000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const result = await validateFileContent(validFile);
      // The mock file won't have proper magic numbers, so we expect it to fail validation
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid XLSX file structure');
    });
  });
}); 