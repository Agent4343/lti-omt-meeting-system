import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Plugin auto-attaches to jsPDF instance
import { APP_CONFIG } from './constants';

/**
 * Enhanced PDF Export Utility for LTI OMT Meeting System
 * Addresses common PDF generation issues and provides robust export functionality
 */

export class PDFExportService {
  constructor() {
    this.doc = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.currentY = 20;
  }

  /**
   * Initialize PDF document with proper settings
   */
  initializeDocument() {
    try {
      this.doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      this.pageWidth = this.doc.internal.pageSize.getWidth();
      this.pageHeight = this.doc.internal.pageSize.getHeight();
      this.currentY = this.margin;
      
      return true;
    } catch (error) {
      console.error('PDF initialization error:', error);
      return false;
    }
  }

  /**
   * Add header to PDF
   */
  addHeader() {
    try {
      // Main title
      this.doc.setFontSize(20);
      this.doc.setFont(undefined, 'bold');
      this.doc.text(APP_CONFIG.APP_NAME, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 10;
      
      // Subtitle
      this.doc.setFontSize(16);
      this.doc.text('Meeting Summary Report', this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 15;
      
      // Add a line separator
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 10;
      
      return true;
    } catch (error) {
      console.error('PDF header error:', error);
      return false;
    }
  }

  /**
   * Add meeting information section
   */
  addMeetingInfo(meeting) {
    try {
      this.checkPageSpace(30);
      
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Meeting Information', this.margin, this.currentY);
      this.currentY += 10;
      
      this.doc.setFontSize(12);
      this.doc.setFont(undefined, 'normal');
      
      // Meeting details
      const details = [
        `Date: ${meeting.date || 'N/A'}`,
        `Attendees: ${meeting.attendees ? meeting.attendees.join(', ') : 'N/A'}`,
        `Generated: ${new Date().toLocaleString()}`,
        `Total Isolations: ${this.getTotalIsolations(meeting)}`
      ];
      
      details.forEach(detail => {
        this.doc.text(detail, this.margin, this.currentY);
        this.currentY += 7;
      });
      
      this.currentY += 10;
      return true;
    } catch (error) {
      console.error('PDF meeting info error:', error);
      return false;
    }
  }

  /**
   * Add statistics section
   */
  addStatistics(meeting) {
    try {
      const stats = this.getMeetingStats(meeting);
      if (!stats) return true;
      
      this.checkPageSpace(40);
      
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Meeting Statistics', this.margin, this.currentY);
      this.currentY += 10;
      
      this.doc.setFontSize(12);
      this.doc.setFont(undefined, 'normal');
      
      // Statistics details
      const statDetails = [
        `Total Isolations: ${stats.total || 0}`,
        `Critical Findings: ${stats.criticalFindings || 0}`,
        `Action Items: ${stats.actionItems || 0}`,
        `Risk Distribution - High: ${stats.byRisk?.High || 0}, Medium: ${stats.byRisk?.Medium || 0}, Low: ${stats.byRisk?.Low || 0}`
      ];
      
      statDetails.forEach(detail => {
        this.doc.text(detail, this.margin, this.currentY);
        this.currentY += 7;
      });
      
      this.currentY += 10;
      return true;
    } catch (error) {
      console.error('PDF statistics error:', error);
      return false;
    }
  }

  /**
   * Add related isolation warnings
   */
  addRelatedWarnings(meeting) {
    try {
      const warnings = meeting.meetingData?.executiveSummary?.relatedIsolationWarnings;
      if (!warnings || warnings.length === 0) return true;
      
      this.checkPageSpace(30);
      
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('⚠️ Related Isolation Warnings', this.margin, this.currentY);
      this.currentY += 10;
      
      this.doc.setFontSize(12);
      this.doc.setFont(undefined, 'normal');
      
      warnings.forEach(warning => {
        this.checkPageSpace(20);
        this.doc.text(`${warning.isolationId}: ${warning.relatedCount} related isolation(s)`, this.margin, this.currentY);
        this.currentY += 7;
        this.doc.text(`Related IDs: ${warning.relatedIds.join(', ')}`, this.margin + 5, this.currentY);
        this.currentY += 10;
      });
      
      this.currentY += 5;
      return true;
    } catch (error) {
      console.error('PDF warnings error:', error);
      return false;
    }
  }

  /**
   * Add isolation details with enhanced comment fields
   */
  addIsolationTable(meeting) {
    try {
      const isolationDetails = this.prepareDetailedIsolationData(meeting);
      if (isolationDetails.length === 0) {
        this.checkPageSpace(20);
        this.doc.setFontSize(12);
        this.doc.text('No isolation data available', this.margin, this.currentY);
        return true;
      }
      
      this.checkPageSpace(40);
      
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.text('Isolation Details', this.margin, this.currentY);
      this.currentY += 10;
      
      // Create summary table first
      this.addIsolationSummaryTable(isolationDetails);
      
      // Add detailed sections for each isolation
      isolationDetails.forEach((isolation, index) => {
        this.addIsolationDetailSection(isolation, index);
      });
      
      return true;
    } catch (error) {
      console.error('PDF isolation details error:', error);
      return false;
    }
  }

  /**
   * Add isolation summary table using autoTable
   */
  addIsolationSummaryTable(isolationDetails) {
    try {
      this.checkPageSpace(60);
      
      const tableData = isolationDetails.map(isolation => [
        isolation.id || 'N/A',
        this.truncateText(isolation.description, 25),
        isolation.riskLevel || 'N/A',
        isolation.ltiAge || 'N/A',
        isolation.mocRequired || 'N/A',
        isolation.actionRequired || 'N/A'
      ]);
      
      // Use autoTable plugin - now properly attached to jsPDF instance
      this.doc.autoTable({
        head: [['Isolation ID', 'Description', 'Risk Level', 'LTI Age', 'MOC Required', 'Action Required']],
        body: tableData,
        startY: this.currentY,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 }, // Isolation ID
          1: { cellWidth: 45 }, // Description
          2: { cellWidth: 25 }, // Risk Level
          3: { cellWidth: 20 }, // LTI Age
          4: { cellWidth: 25 }, // MOC Required
          5: { cellWidth: 30 }  // Action Required
        },
        margin: { left: this.margin, right: this.margin }
      });
      
      // Update currentY position after table
      this.currentY = this.doc.lastAutoTable.finalY + 15;
      
      return true;
    } catch (error) {
      console.error('PDF table generation error:', error);
      // Fallback to text-based display if autoTable fails
      this.doc.setFontSize(10);
      this.doc.text('Error generating table. Detailed information follows below.', this.margin, this.currentY);
      this.currentY += 10;
      return false;
    }
  }

  /**
   * Add detailed section for each isolation with all comment fields
   */
  addIsolationDetailSection(isolation, index) {
    try {
      this.checkPageSpace(60);
      
      // Isolation header
      this.doc.setFontSize(12);
      this.doc.setFont(undefined, 'bold');
      this.doc.text(`${index + 1}. ${isolation.id} - ${isolation.description}`, this.margin, this.currentY);
      this.currentY += 8;
      
      // Basic information
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'normal');
      
      const basicInfo = [
        `Risk Level: ${isolation.riskLevel}`,
        `LTI Age: ${isolation.ltiAge}`,
        `MOC Required: ${isolation.mocRequired}`,
        `Action Required: ${isolation.actionRequired}`
      ];
      
      basicInfo.forEach(info => {
        this.doc.text(info, this.margin + 5, this.currentY);
        this.currentY += 5;
      });
      
      // Add conditional comment fields
      if (isolation.riskLevelComment) {
        this.checkPageSpace(15);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Risk Level Comment:', this.margin + 5, this.currentY);
        this.currentY += 5;
        this.doc.setFont(undefined, 'normal');
        const riskCommentLines = this.doc.splitTextToSize(isolation.riskLevelComment, this.pageWidth - 2 * this.margin - 10);
        this.doc.text(riskCommentLines, this.margin + 10, this.currentY);
        this.currentY += riskCommentLines.length * 5 + 3;
      }
      
      if (isolation.mocRequiredComment) {
        this.checkPageSpace(15);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('MOC Comment:', this.margin + 5, this.currentY);
        this.currentY += 5;
        this.doc.setFont(undefined, 'normal');
        const mocCommentLines = this.doc.splitTextToSize(isolation.mocRequiredComment, this.pageWidth - 2 * this.margin - 10);
        this.doc.text(mocCommentLines, this.margin + 10, this.currentY);
        this.currentY += mocCommentLines.length * 5 + 3;
      }
      
      if (isolation.actionRequiredComment) {
        this.checkPageSpace(15);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Action Comment:', this.margin + 5, this.currentY);
        this.currentY += 5;
        this.doc.setFont(undefined, 'normal');
        const actionCommentLines = this.doc.splitTextToSize(isolation.actionRequiredComment, this.pageWidth - 2 * this.margin - 10);
        this.doc.text(actionCommentLines, this.margin + 10, this.currentY);
        this.currentY += actionCommentLines.length * 5 + 3;
      }
      
      // WMS Manual Risk Assessment Comments
      if (isolation.corrosionRiskComment || isolation.deadLegsRiskComment || isolation.automationLossRiskComment) {
        this.checkPageSpace(20);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('WMS Manual Risk Assessment:', this.margin + 5, this.currentY);
        this.currentY += 7;
        
        if (isolation.corrosionRiskComment) {
          this.doc.text(`Corrosion Risk (${isolation.corrosionRisk}):`, this.margin + 10, this.currentY);
          this.currentY += 5;
          this.doc.setFont(undefined, 'normal');
          const corrosionLines = this.doc.splitTextToSize(isolation.corrosionRiskComment, this.pageWidth - 2 * this.margin - 15);
          this.doc.text(corrosionLines, this.margin + 15, this.currentY);
          this.currentY += corrosionLines.length * 5 + 3;
          this.doc.setFont(undefined, 'bold');
        }
        
        if (isolation.deadLegsRiskComment) {
          this.doc.text(`Dead Legs Risk (${isolation.deadLegsRisk}):`, this.margin + 10, this.currentY);
          this.currentY += 5;
          this.doc.setFont(undefined, 'normal');
          const deadLegsLines = this.doc.splitTextToSize(isolation.deadLegsRiskComment, this.pageWidth - 2 * this.margin - 15);
          this.doc.text(deadLegsLines, this.margin + 15, this.currentY);
          this.currentY += deadLegsLines.length * 5 + 3;
          this.doc.setFont(undefined, 'bold');
        }
        
        if (isolation.automationLossRiskComment) {
          this.doc.text(`Automation Loss Risk (${isolation.automationLossRisk}):`, this.margin + 10, this.currentY);
          this.currentY += 5;
          this.doc.setFont(undefined, 'normal');
          const automationLines = this.doc.splitTextToSize(isolation.automationLossRiskComment, this.pageWidth - 2 * this.margin - 15);
          this.doc.text(automationLines, this.margin + 15, this.currentY);
          this.currentY += automationLines.length * 5 + 3;
        }
      }
      
      // General comments
      if (isolation.comments) {
        this.checkPageSpace(15);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('General Comments:', this.margin + 5, this.currentY);
        this.currentY += 5;
        this.doc.setFont(undefined, 'normal');
        const commentLines = this.doc.splitTextToSize(isolation.comments, this.pageWidth - 2 * this.margin - 10);
        this.doc.text(commentLines, this.margin + 10, this.currentY);
        this.currentY += commentLines.length * 5 + 3;
      }
      
      // Action items
      if (isolation.actionItems && isolation.actionItems.length > 0) {
        this.checkPageSpace(20);
        this.doc.setFont(undefined, 'bold');
        this.doc.text('Action Items:', this.margin + 5, this.currentY);
        this.currentY += 7;
        
        isolation.actionItems.forEach((item, itemIndex) => {
          this.doc.setFont(undefined, 'normal');
          this.doc.text(`${itemIndex + 1}. ${item.description || 'No description'}`, this.margin + 10, this.currentY);
          this.currentY += 5;
          if (item.owner) {
            this.doc.text(`   Owner: ${item.owner}`, this.margin + 10, this.currentY);
            this.currentY += 5;
          }
          this.currentY += 2;
        });
      }
      
      // Add separator line
      this.currentY += 5;
      this.doc.setLineWidth(0.2);
      this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 10;
      
      return true;
    } catch (error) {
      console.error('PDF isolation section error:', error);
      return false;
    }
  }

  /**
   * Prepare detailed isolation data with all comment fields
   */
  prepareDetailedIsolationData(meeting) {
    const isolationDetails = [];
    
    // Try multiple data extraction strategies
    const isolations = meeting.isolations || [];
    const responses = meeting.responses || {};
    
    // Strategy 1: Enhanced data structure (isolations array + responses object)
    if (isolations.length > 0) {
      isolations.forEach((isolation, index) => {
        const response = responses[isolation.id] || {};
        const plannedStartDate = isolation['Planned Start Date'] || 
                               isolation.plannedStartDate || 
                               isolation.PlannedStartDate;
        
        const isolationDetail = {
          id: isolation.id || 'N/A',
          description: isolation.description || isolation.Title || isolation.title || 'No description',
          riskLevel: response.riskLevel || response.risk || 'N/A',
          ltiAge: this.calculateLTIAge(plannedStartDate),
          mocRequired: response.mocRequired || 'N/A',
          mocNumber: response.mocNumber || '',
          actionRequired: response.actionRequired || 'N/A',
          partsRequired: response.partsRequired || 'N/A',
          supportRequired: response.supportRequired || 'N/A',
          comments: response.comments || '',
          actionItems: response.actionItems || [],
          
          // Conditional comment fields
          riskLevelComment: response.riskLevelComment || '',
          mocRequiredComment: response.mocRequiredComment || '',
          actionRequiredComment: response.actionRequiredComment || '',
          
          // WMS Manual Risk Assessment
          corrosionRisk: response.corrosionRisk || 'N/A',
          corrosionRiskComment: response.corrosionRiskComment || '',
          deadLegsRisk: response.deadLegsRisk || 'N/A',
          deadLegsRiskComment: response.deadLegsRiskComment || '',
          automationLossRisk: response.automationLossRisk || 'N/A',
          automationLossRiskComment: response.automationLossRiskComment || ''
        };
        
        isolationDetails.push(isolationDetail);
      });
    }
    // Strategy 2: Legacy data structure (responses only)
    else if (Object.keys(responses).length > 0) {
      Object.entries(responses).forEach(([id, response]) => {
        const isolationDetail = {
          id: id,
          description: response.description || 'No description',
          riskLevel: response.riskLevel || response.risk || 'N/A',
          ltiAge: 'N/A',
          mocRequired: response.mocRequired || 'N/A',
          mocNumber: response.mocNumber || '',
          actionRequired: response.actionRequired || 'N/A',
          partsRequired: response.partsRequired || 'N/A',
          supportRequired: response.supportRequired || 'N/A',
          comments: response.comments || '',
          actionItems: response.actionItems || [],
          
          // Conditional comment fields
          riskLevelComment: response.riskLevelComment || '',
          mocRequiredComment: response.mocRequiredComment || '',
          actionRequiredComment: response.actionRequiredComment || '',
          
          // WMS Manual Risk Assessment
          corrosionRisk: response.corrosionRisk || 'N/A',
          corrosionRiskComment: response.corrosionRiskComment || '',
          deadLegsRisk: response.deadLegsRisk || 'N/A',
          deadLegsRiskComment: response.deadLegsRiskComment || '',
          automationLossRisk: response.automationLossRisk || 'N/A',
          automationLossRiskComment: response.automationLossRiskComment || ''
        };
        
        isolationDetails.push(isolationDetail);
      });
    }
    
    return isolationDetails;
  }

  /**
   * Check if there's enough space on current page, add new page if needed
   */
  checkPageSpace(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  /**
   * Prepare table data from meeting - Enhanced with comprehensive data structure support
   */
  prepareTableData(meeting) {
    const tableData = [];
    
    // Try multiple data extraction strategies
    const isolations = meeting.isolations || [];
    const responses = meeting.responses || {};
    
    // Strategy 1: Enhanced data structure (isolations array + responses object)
    if (isolations.length > 0) {
      isolations.forEach((isolation, index) => {
        const response = responses[isolation.id] || {};
        const plannedStartDate = isolation['Planned Start Date'] || 
                               isolation.plannedStartDate || 
                               isolation.PlannedStartDate;
        
        const rowData = [
          isolation.id || 'N/A',
          this.truncateText(isolation.description || isolation.Title || isolation.title || 'No description', 30),
          response.riskLevel || response.risk || 'N/A',
          this.calculateLTIAge(plannedStartDate),
          response.mocRequired || 'N/A',
          response.partsRequired || 'N/A',
          this.truncateText(response.comments || 'N/A', 40)
        ];
        
        tableData.push(rowData);
      });
    }
    // Strategy 2: Legacy data structure (responses only)
    else if (Object.keys(responses).length > 0) {
      Object.entries(responses).forEach(([id, response]) => {
        const rowData = [
          id,
          this.truncateText(response.description || 'No description', 30),
          response.riskLevel || response.risk || 'N/A',
          'N/A',
          response.mocRequired || 'N/A',
          response.partsRequired || 'N/A',
          this.truncateText(response.comments || 'N/A', 40)
        ];
        
        tableData.push(rowData);
      });
    }
    // Strategy 3: Check for alternative data structures
    else {
      // Check for data in meetingData structure
      if (meeting.meetingData && meeting.meetingData.isolations) {
        const meetingIsolations = meeting.meetingData.isolations;
        const meetingResponses = meeting.meetingData.responses || {};
        
        meetingIsolations.forEach((isolation, index) => {
          const response = meetingResponses[isolation.id] || {};
          const plannedStartDate = isolation['Planned Start Date'] || 
                                 isolation.plannedStartDate || 
                                 isolation.PlannedStartDate;
          
          const rowData = [
            isolation.id || 'N/A',
            this.truncateText(isolation.description || isolation.Title || isolation.title || 'No description', 30),
            response.riskLevel || response.risk || 'N/A',
            this.calculateLTIAge(plannedStartDate),
            response.mocRequired || 'N/A',
            response.partsRequired || 'N/A',
            this.truncateText(response.comments || 'N/A', 40)
          ];
          
          tableData.push(rowData);
        });
      }
      // Check for flat structure where isolations are direct properties
      else {
        const possibleIsolationKeys = Object.keys(meeting).filter(key => 
          key.startsWith('CAHE-') || key.includes('isolation') || key.includes('Isolation')
        );
        
        if (possibleIsolationKeys.length > 0) {
          possibleIsolationKeys.forEach(key => {
            const isolationData = meeting[key];
            if (typeof isolationData === 'object' && isolationData !== null) {
              const rowData = [
                key,
                this.truncateText(isolationData.description || isolationData.Title || isolationData.title || 'No description', 30),
                isolationData.riskLevel || isolationData.risk || 'N/A',
                this.calculateLTIAge(isolationData['Planned Start Date'] || isolationData.plannedStartDate),
                isolationData.mocRequired || 'N/A',
                isolationData.partsRequired || 'N/A',
                this.truncateText(isolationData.comments || 'N/A', 40)
              ];
              
              tableData.push(rowData);
            }
          });
        }
      }
    }
    
    // Strategy 4: Last resort - try to extract any structured data
    if (tableData.length === 0) {
      // Look for any object that might contain isolation data
      const searchForIsolationData = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return [];
        
        const found = [];
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          // Check if this looks like isolation data
          if (typeof value === 'object' && value !== null) {
            if (key.startsWith('CAHE-') || 
                (value.id && value.id.startsWith('CAHE-')) ||
                (value.isolationId && value.isolationId.startsWith('CAHE-'))) {
              
              const id = value.id || value.isolationId || key;
              const description = value.description || value.Title || value.title || 'No description';
              const risk = value.riskLevel || value.risk || 'N/A';
              const plannedStartDate = value['Planned Start Date'] || value.plannedStartDate || value.PlannedStartDate;
              
              found.push([
                id,
                this.truncateText(description, 30),
                risk,
                this.calculateLTIAge(plannedStartDate),
                value.mocRequired || 'N/A',
                value.partsRequired || 'N/A',
                this.truncateText(value.comments || 'N/A', 40)
              ]);
            } else {
              // Recursively search deeper
              found.push(...searchForIsolationData(value, currentPath));
            }
          }
        }
        
        return found;
      };
      
      const foundData = searchForIsolationData(meeting);
      tableData.push(...foundData);
    }
    
    // If still no data, create a diagnostic row
    if (tableData.length === 0) {
      tableData.push([
        'No Data',
        'No isolation data found in meeting',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        `Available data: ${Object.keys(meeting).join(', ')}`
      ]);
    }
    
    return tableData;
  }

  /**
   * Calculate LTI age from planned start date
   */
  calculateLTIAge(plannedStartDate) {
    if (!plannedStartDate) return 'Unknown';
    
    try {
      const startDate = new Date(plannedStartDate);
      const currentDate = new Date();
      
      if (isNaN(startDate.getTime())) return 'Invalid Date';
      
      const diffTime = Math.abs(currentDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < APP_CONFIG.LTI_AGE_THRESHOLDS.DAYS_TO_MONTHS) {
        return `${diffDays} days`;
      } else if (diffDays < APP_CONFIG.LTI_AGE_THRESHOLDS.DAYS_TO_YEARS) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);
        return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
      }
    } catch (error) {
      console.error('LTI age calculation error:', error);
      return 'Error';
    }
  }

  /**
   * Truncate text to fit in table cells
   */
  truncateText(text, maxLength) {
    if (!text || typeof text !== 'string') return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  /**
   * Get total number of isolations
   */
  getTotalIsolations(meeting) {
    if (meeting.isolations && Array.isArray(meeting.isolations)) {
      return meeting.isolations.length;
    }
    if (meeting.responses && typeof meeting.responses === 'object') {
      return Object.keys(meeting.responses).length;
    }
    return 0;
  }

  /**
   * Get meeting statistics
   */
  getMeetingStats(meeting) {
    // Use new meetingData structure if available
    if (meeting.meetingData?.executiveSummary) {
      const execSummary = meeting.meetingData.executiveSummary;
      const riskDistribution = meeting.meetingData.riskAnalysis?.distribution || {};
      
      return {
        total: execSummary.totalIsolationsReviewed,
        criticalFindings: execSummary.criticalFindings,
        actionItems: execSummary.actionItemsGenerated,
        byRisk: {
          Critical: riskDistribution.Critical?.count || 0,
          High: riskDistribution.High?.count || 0,
          Medium: riskDistribution.Medium?.count || 0,
          Low: riskDistribution.Low?.count || 0
        }
      };
    }
    
    // Fallback to legacy statistics
    if (meeting.statistics) return meeting.statistics;
    
    return null;
  }

  /**
   * Generate filename for PDF
   */
  generateFilename(meetingDate) {
    try {
      const sanitizedDate = meetingDate.replace(/[^a-zA-Z0-9-]/g, '_');
      return `LTI_OMT_Meeting_System_${sanitizedDate}.pdf`;
    } catch (error) {
      console.error('Filename generation error:', error);
      return `LTI_OMT_Meeting_System_${new Date().toISOString().split('T')[0]}.pdf`;
    }
  }

  /**
   * Save PDF document
   */
  savePDF(filename) {
    try {
      if (!this.doc) {
        throw new Error('PDF document not initialized');
      }
      
      this.doc.save(filename);
      return { success: true, message: 'PDF downloaded successfully!' };
    } catch (error) {
      console.error('PDF save error:', error);
      return { success: false, message: `Error saving PDF: ${error.message}` };
    }
  }

  /**
   * Main export function
   */
  async exportMeetingToPDF(meeting) {
    try {
      // Validate input
      if (!meeting) {
        throw new Error('Meeting data is required');
      }
      
      // Log basic info for debugging (production-safe)
      if (process.env.NODE_ENV === 'development') {
        console.log('PDF Export - Processing meeting data with', Object.keys(meeting).length, 'properties');
        console.log('PDF Export - Isolations count:', (meeting.isolations || []).length);
        console.log('PDF Export - Responses count:', Object.keys(meeting.responses || {}).length);
      }
      
      // Initialize document
      if (!this.initializeDocument()) {
        throw new Error('Failed to initialize PDF document');
      }
      
      // Add content sections
      this.addHeader();
      this.addMeetingInfo(meeting);
      this.addStatistics(meeting);
      this.addRelatedWarnings(meeting);
      this.addIsolationTable(meeting);
      
      // Generate filename and save
      const filename = this.generateFilename(meeting.date);
      const result = this.savePDF(filename);
      
      return result;
    } catch (error) {
      console.error('PDF export error:', error);
      return { 
        success: false, 
        message: `Error generating PDF: ${error.message}` 
      };
    }
  }
}

// Export convenience function
export const exportMeetingToPDF = async (meeting) => {
  const pdfService = new PDFExportService();
  return await pdfService.exportMeetingToPDF(meeting);
};

export default PDFExportService;
