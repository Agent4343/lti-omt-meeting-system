/**
 * Services Index
 * Central export point for all application services
 */

// SharePoint Integration Services
export { default as sharePoint2013DataService } from './sharepoint2013-data-service';
export { SharePoint2013DataService } from './sharepoint2013-data-service';

// SharePoint Document Library Storage (simpler than Lists)
export { default as sharePointDocumentStorage } from './sharepoint-document-storage';
export { SharePointDocumentStorage } from './sharepoint-document-storage';

// Hybrid Storage Provider (combines SharePoint + localStorage)
// Imported rather than re-exported directly, because `export { default as x }`
// creates no local binding for x to alias below.
import hybridStorageProvider from './hybrid-storage-provider';

export { hybridStorageProvider };
export { HybridStorageProvider } from './hybrid-storage-provider';

// Re-export for convenience - main storage provider to use
export const StorageProvider = hybridStorageProvider;
