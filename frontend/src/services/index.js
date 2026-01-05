/**
 * Services Index
 * Central export point for all application services
 */

// SharePoint Integration Services
export { default as sharePoint2013DataService } from './sharepoint2013-data-service';
export { SharePoint2013DataService } from './sharepoint2013-data-service';

export { default as hybridStorageProvider } from './hybrid-storage-provider';
export { HybridStorageProvider } from './hybrid-storage-provider';

// Re-export for convenience
export const StorageProvider = hybridStorageProvider;
