import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { collection, query, getDocs, updateDoc, doc as firestoreDoc, orderBy, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { auth } from '../../utils/firebase';

function Receipts() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [dateRange, setDateRange] = useState({ 
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [memberName, setMemberName] = useState('');
  const [customTemplate, setCustomTemplate] = useState({
    header: 'Church Finance System',
    footer: 'Thank you for your contribution',
    color: '#4F46E5',
    logo: null,
    fontSize: '12',
    orientation: 'portrait'
  });
  const [error, setError] = useState(null);
  const currentUser = auth.currentUser;

  const receiptTemplates = [
    { id: 'standard', name: 'Standard Template' },
    { id: 'modern', name: 'Modern Design' },
    { id: 'minimal', name: 'Minimal Layout' },
    { id: 'custom', name: 'Custom Template' }
  ];

  const formatSubmissionDate = (date) => {
    try {
      if (!date) return 'N/A';
      
      // Handle Firestore Timestamp
      if (typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      
      // Handle Date object
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      
      // Handle string or number
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn('Invalid date value:', date);
        return 'N/A';
      }
      
      return parsedDate.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const validateDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) return true;
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error('Invalid date range');
      return false;
    }
    
    if (start > end) {
      toast.error('Start date must be before end date');
      return false;
    }
    
    return true;
  };

  // Memoize fetchSubmissions to prevent unnecessary re-renders
  const fetchSubmissions = useCallback(async () => {
    if (!validateDateRange()) return;

    try {
      setLoading(true);
      setError(null);

      const submissionsRef = collection(db, 'submissions');
      const q = query(submissionsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const submissionsList = [];
      
      querySnapshot.forEach(doc => {
        try {
          const data = doc.data();
          
          // Skip if no date
          if (!data.date) return;
          
          // Convert date strings to Date objects for comparison
          const submissionDate = new Date(data.date);
          const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
          const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
          
          // Skip if outside date range
          if (startDate && submissionDate < startDate) return;
          if (endDate) {
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            if (submissionDate > endDate) return;
          }

          // Member name filtering with null check
          if (memberName && !data.memberName?.toLowerCase().includes(memberName.toLowerCase())) {
            return;
          }

          submissionsList.push({
            id: doc.id,
            ...data,
            date: data.date,
            tithe: parseFloat(data.tithe) || 0,
            offering: parseFloat(data.offering) || 0,
            memberName: data.memberName || 'Unknown Member',
            receiptGenerated: data.receiptGenerated || false,
            receiptGeneratedAt: data.receiptGeneratedAt || null,
            status: data.receiptGenerated ? 'Complete' : 'Pending'
          });
        } catch (docError) {
          console.error('Error processing document:', doc.id, docError);
        }
      });

      setSubmissions(submissionsList);
      
      if (submissionsList.length === 0 && (dateRange.startDate || dateRange.endDate || memberName)) {
        toast('No submissions found matching the criteria', {
          icon: 'ℹ️',
        });
      }
    } catch (error) {
      console.error('Error in fetchSubmissions:', error);
      toast.error(error.message || 'Error loading submissions');
    } finally {
      setLoading(false);
    }
  }, [dateRange, memberName, db]);

  // Use a debounced effect for filtering
  useEffect(() => {
    const timer = setTimeout(() => {
    fetchSubmissions();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchSubmissions]);

  const handleBatchDownload = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Please select at least one submission');
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to generate receipts');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const loadingId = toast.loading('Preparing to generate receipts...');

      const zip = new JSZip();
      const receiptsFolder = zip.folder('receipts');
      const errors = [];
      let successCount = 0;
      let currentCount = 0;

      // Keep track of updated submissions
      const updatedSubmissions = [...submissions];

      for (const submissionId of selectedSubmissions) {
        currentCount++;
        try {
          const submission = submissions.find(s => s.id === submissionId);
          
          if (!submission) {
            errors.push(`Submission not found: ${submissionId}`);
            continue;
          }

          toast.loading(
            `Generating receipt ${currentCount} of ${selectedSubmissions.length}...`, 
            { id: loadingId }
          );

          // Generate PDF
          const pdfDoc = await generateReceipt(submission);
          if (!pdfDoc) {
            throw new Error('Failed to generate PDF document');
          }

          // Get PDF blob
          const pdfBlob = await pdfDoc.output('blob');
          
          // Add to ZIP
          receiptsFolder.file(`receipt_${submission.id}.pdf`, pdfBlob);
          
          // Update submission status individually
          try {
            const submissionRef = firestoreDoc(db, 'submissions', submission.id);
            
            // Update status in Firestore
            await setDoc(submissionRef, {
              receiptGenerated: true,
              receiptGeneratedAt: new Date().toISOString(),
              generatedBy: currentUser.uid
            }, { merge: true });

            // Update the submission in our local state
            setSubmissions(prevSubmissions => 
              prevSubmissions.map(sub => 
                sub.id === submission.id 
                  ? {
                      ...sub,
                      receiptGenerated: true,
                      receiptGeneratedAt: new Date().toISOString(),
                      generatedBy: currentUser.uid
                    }
                  : sub
              )
            );
            
            successCount++;
          } catch (error) {
            console.warn('Error updating submission:', error);
            // Still count as success since PDF was generated
            successCount++;
          }
        } catch (error) {
          console.error('Error processing receipt:', submissionId, error);
          errors.push(`Failed to process receipt for ${submissionId}: ${error.message}`);
        }
      }

      // Update the submissions state with our updated array
      setSubmissions(updatedSubmissions);

      if (errors.length > 0) {
        console.error('Errors during batch processing:', errors);
        setError(`${errors.length} receipts failed to generate. Check console for details.`);
        toast.error(`${errors.length} receipts failed to generate`);
      }

      if (successCount > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const fileName = `receipts_${new Date().toISOString().split('T')[0]}.zip`;
        saveAs(zipBlob, fileName);
        toast.success(`Successfully generated ${successCount} receipts`);
      } else {
        toast.error('No receipts were generated successfully');
      }

      setSelectedSubmissions([]);
      // Refresh the data
      await fetchSubmissions();
    } catch (error) {
      console.error('Error in batch download:', error);
      setError('Failed to generate receipts: ' + error.message);
      toast.error('Failed to generate receipts: ' + error.message);
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  const generateReceipt = async (submission, template = selectedTemplate) => {
    try {
      console.log('Generating receipt for submission:', submission.id);
      
      // Enhanced validation
      if (!submission?.id || !submission?.date || !submission?.memberName) {
        throw new Error('Missing required submission data');
      }

      // Validate amounts
      const tithe = parseFloat(submission.tithe) || 0;
      const offering = parseFloat(submission.offering) || 0;
      if (tithe < 0 || offering < 0) {
        throw new Error('Invalid amount: Negative values are not allowed');
      }
      if ((tithe === 0 && offering === 0) || (isNaN(tithe) || isNaN(offering))) {
        throw new Error('Invalid amount: No valid contribution found');
      }

      // Check user permissions
      if (!currentUser) {
        throw new Error('You must be logged in to generate receipts');
      }

      // Create new document with proper orientation
      const doc = new jsPDF({
        orientation: template === 'custom' ? customTemplate.orientation : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Get template styles
      const styles = getTemplateStyles(template);
      
      try {
        // Set basic styles
        doc.setFont(styles.font);
        doc.setFontSize(template === 'custom' ? parseInt(customTemplate.fontSize) || 12 : styles.fontSize);
        doc.setTextColor(template === 'custom' ? customTemplate.color : styles.color);

        // Add header with error handling
        const header = template === 'custom' ? (customTemplate.header || 'Church Finance System') : 'Church Finance System';
        doc.text(header, doc.internal.pageSize.width / 2, 20, { align: 'center' });

        // Add logo if custom template with logo
        if (template === 'custom' && customTemplate.logo) {
          try {
          doc.addImage(customTemplate.logo, 'JPEG', 20, 10, 30, 30);
          } catch (logoError) {
            console.warn('Failed to add logo:', logoError);
            // Continue without logo
          }
        }

        // Format date with validation
        const formattedDate = formatSubmissionDate(submission.date);
        if (formattedDate === 'N/A') {
          throw new Error('Invalid submission date');
        }

        // Add receipt details
        doc.setFontSize(12);
        doc.text(`Receipt No: ${submission.id}`, 20, 40);
        doc.text(`Date: ${formattedDate}`, 20, 50);
        doc.text(`Member: ${submission.memberName}`, 20, 60);

        // Add contribution details with proper formatting and validation
        const total = tithe + offering;

        const tableData = [
          ['Tithe', formatCurrency(tithe)],
          ['Offering', formatCurrency(offering)],
          ['Total', formatCurrency(total)]
        ];

        doc.autoTable({
          startY: 70,
          head: [['Description', 'Amount']],
          body: tableData,
          styles: { fontSize: 12 },
          theme: styles.tableTheme
        });

        // Generate QR code with verification data and error handling
        const verificationData = {
          id: submission.id,
          date: formattedDate,
          amount: total,
          memberId: submission.memberId || submission.id,
          memberName: submission.memberName,
          verificationUrl: `${window.location.origin}/verify/${submission.id}`,
          generatedBy: currentUser.uid,
          generatedAt: new Date().toISOString()
        };

        try {
        const qrContainer = document.createElement('div');
        const root = ReactDOM.createRoot(qrContainer);
        root.render(
          <QRCodeCanvas
            value={JSON.stringify(verificationData)}
            size={128}
            level="M"
          />
        );
        
        // Wait for the QR code to be rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const qrCanvas = qrContainer.querySelector('canvas');
          if (qrCanvas) {
        const qrImage = qrCanvas.toDataURL('image/png');
        doc.addImage(qrImage, 'PNG', 20, 150, 30, 30);
          } else {
            console.warn('QR code generation failed');
            // Add text note about missing QR code
            doc.setFontSize(8);
            doc.text('QR code verification unavailable', 20, 150);
          }
        
        // Clean up
        root.unmount();
        } catch (qrError) {
          console.error('Error generating QR code:', qrError);
          // Add text note about missing QR code
          doc.setFontSize(8);
          doc.text('QR code verification unavailable', 20, 150);
        }

        // Add verification text
        doc.setFontSize(8);
        doc.text('Scan QR code to verify receipt', 20, 185);

        // Add footer
        const footer = template === 'custom' ? (customTemplate.footer || 'Thank you for your contribution') : 'Thank you for your contribution';
        doc.text(footer, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });

        console.log('Receipt generated successfully for:', submission.id);
        return doc;
      } catch (error) {
        console.error('Error in PDF generation:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in generateReceipt:', error);
      throw error;
    }
  };

  const getTemplateStyles = (template) => {
    const templates = {
      standard: {
        font: 'helvetica',
        fontSize: 14,
        color: '#000000',
        tableTheme: 'striped'
      },
      modern: {
        font: 'helvetica',
        fontSize: 12,
        color: '#4F46E5',
        tableTheme: 'grid'
      },
      minimal: {
        font: 'helvetica',
        fontSize: 10,
        color: '#374151',
        tableTheme: 'plain'
      }
    };
    return templates[template] || templates.standard;
  };

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
  };

  const handleCustomTemplateChange = (field, value) => {
    setCustomTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomTemplate(prev => ({
          ...prev,
          logo: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Show loading state - Modified to be less intrusive */}
      {loading && (
        <div className="fixed top-4 right-4 bg-white dark:bg-dark-bg-secondary p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
            <p className="text-sm text-gray-600 dark:text-dark-fg-alt">Loading...</p>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-200 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-200 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              Member Name
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Filter by member name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-200 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              Receipt Template
            </label>
            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-200 dark:bg-gray-800"
            >
              {receiptTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={handleBatchDownload}
              disabled={selectedSubmissions.length === 0 || loading}
              className="mt-7 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Selected Receipts'
              )}
            </button>
          </div>
        </div>

        {/* Custom Template Options */}
        {selectedTemplate === 'custom' && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Header Text
              </label>
              <input
                type="text"
                value={customTemplate.header}
                onChange={(e) => handleCustomTemplateChange('header', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Footer Text
              </label>
              <input
                type="text"
                value={customTemplate.footer}
                onChange={(e) => handleCustomTemplateChange('footer', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Color
              </label>
              <input
                type="color"
                value={customTemplate.color}
                onChange={(e) => handleCustomTemplateChange('color', e.target.value)}
                className="mt-1 block w-full h-9 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Font Size
              </label>
              <select
                value={customTemplate.fontSize}
                onChange={(e) => handleCustomTemplateChange('fontSize', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {[10, 12, 14, 16, 18].map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Orientation
              </label>
              <select
                value={customTemplate.orientation}
                onChange={(e) => handleCustomTemplateChange('orientation', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm overflow-hidden rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedSubmissions.length === submissions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubmissions(submissions.map(s => s.id));
                      } else {
                        setSelectedSubmissions([]);
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tithe
                </th>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Offering
                </th>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/40 dark:bg-gray-900/40 divide-y divide-gray-200 dark:divide-gray-700">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSubmissions.includes(submission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubmissions([...selectedSubmissions, submission.id]);
                        } else {
                          setSelectedSubmissions(selectedSubmissions.filter(id => id !== submission.id));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatSubmissionDate(submission.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {submission.memberName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(submission.tithe)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(submission.offering)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(submission.tithe + submission.offering)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {submission.receiptGenerated ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900">
                        Complete {submission.receiptGeneratedAt && `on ${formatSubmissionDate(submission.receiptGeneratedAt)}`}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Receipts; 