export interface BulkImportResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  message: string;
}
