import { useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import toast from 'react-hot-toast';

// Register Stampete font
Font.register({
  family: 'Stampete',
  src: '/fonts/stampete.ttf'
});

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    color: '#f0f0f0',
    opacity: 0.3,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 20,
    marginTop: 10,
    position: 'relative',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: 65,
    height: 65,
    position: 'absolute',
    left: 40,
    top: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  headerText: {
    width: '70%',
    textAlign: 'center',
    paddingTop: 5,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2563eb',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 6,
    textAlign: 'center',
  },
  period: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    padding: 8,
    textAlign: 'left',
    color: '#374151',
  },
  summaryBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryTotal: {
    backgroundColor: '#2563eb',
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
  },
  summaryTotalText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#333',
    paddingTop: 20,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 8,
    color: '#666',
  },
  certificateMark: {
    position: 'absolute',
    bottom: 85,
    right: 35,
    width: 95,
    height: 100,
    opacity: 0.9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-30deg)',
  },
  authenticityText: {
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 40,
    right: 40,
    fontSize: 24,
    color: '#2563eb',
  },
  verifiedText: {
    fontSize: 10,
    color: '#2563eb',
    textAlign: 'right',
    marginTop: 5,
  },
  securityText: {
    position: 'absolute',
    top: 5,
    left: 5,
    fontSize: 4,
    color: '#e0e0e0',
    opacity: 0.2,
  },
  securityBorder: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    opacity: 0.1,
  },
  certificateText: {
    fontFamily: 'Stampete',
    fontSize: 8,
    color: '#dc2626',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 1.4,
    fontWeight: 'bold',
  },
});

// Report PDF component
const ReportPDF = ({ data }) => {
  const generateAuthCode = () => {
    const date = new Date();
    return `LHG-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const generateSecurityText = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 200; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i % 50 === 49) result += ' ';
    }
    return result;
  };

  const authCode = generateAuthCode();
  const securityText = generateSecurityText();

  return (
    <Document
      creator="L.H.G-BIGOCA Financial System"
      producer="L.H.G-BIGOCA"
      author="L.H.G-BIGOCA"
      title="Financial Report"
      subject="Official Financial Report"
      keywords="financial, report, official"
      security={{
        userPassword: undefined,
        ownerPassword: authCode,
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false,
        },
      }}
    >
      <Page size="A4" style={styles.page}>
        {/* Security Border */}
        <View style={styles.securityBorder} />
        
        {/* Micro Security Text */}
        <Text style={styles.securityText}>{securityText}</Text>

        {/* Watermark */}
        <View style={styles.watermark}>
          <Text>L.H.G-BIGOCA</Text>
        </View>

        {/* Verified Badge */}
        <View style={styles.verifiedBadge}>
          <Text>✓</Text>
          <Text style={styles.verifiedText}>Verified Document</Text>
        </View>

        {/* Header with Logo */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image 
              src="/logo (2).png"
              style={styles.logo}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>L.H.G-BIGOCA</Text>
            <Text style={styles.subtitle}>OFFICIAL FINANCIAL REPORT</Text>
            <Text style={styles.period}>
              Period: {data.summary.startDate} to {data.summary.endDate}
            </Text>
          </View>
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: 'bold' }}>Financial Summary</Text>
          <View style={styles.summaryRow}>
            <Text>Total Tithes:</Text>
            <Text>{formatCurrency(data.summary.totalTithes)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Total Offerings:</Text>
            <Text>{formatCurrency(data.summary.totalOfferings)}</Text>
          </View>
          <View style={styles.summaryTotal}>
            <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryTotalText}>Total Combined:</Text>
              <Text style={styles.summaryTotalText}>{formatCurrency(data.summary.totalCombined)}</Text>
            </View>
          </View>
        </View>

        {/* Transactions Table */}
        <View style={styles.section}>
          <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: 'bold' }}>Transaction Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Date</Text>
              <Text style={styles.tableCell}>Member Name</Text>
              <Text style={styles.tableCell}>Tithe</Text>
              <Text style={styles.tableCell}>Offering</Text>
              <Text style={styles.tableCell}>Week</Text>
            </View>
            {data.submissions.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.date}</Text>
                <Text style={styles.tableCell}>{item.memberName}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.tithe)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.offering)}</Text>
                <Text style={styles.tableCell}>{item.weekNumber}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerText}>Generated: {new Date().toLocaleString()}</Text>
              <Text style={styles.footerText}>Auth Code: {authCode}</Text>
              <Text style={styles.footerText}>This document is digitally secured and verified</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerText}>L.H.G-BIGOCA Financial System</Text>
              <Text style={styles.authenticityText}>
                This is an official financial document. Verify authenticity using the auth code.
                Any attempt to modify this document will invalidate it.
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Certificate Mark */}
        <View style={styles.certificateMark}>
          <Text style={styles.certificateText}>
            VERIFIED{'\n'}
            OFFICIAL DOCUMENT{'\n'}
            {authCode}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('weekly');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    setLoading(true);

    try {
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999); // End of day

      console.log('Fetching reports from:', start, 'to:', end); // Debug log

      // Query submissions within date range
      const submissionsRef = collection(db, 'submissions');
      let submissionsQuery;

      if (reportType === 'custom') {
        submissionsQuery = query(
          submissionsRef,
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'desc')
        );
      } else {
        // For weekly/monthly, just get all submissions and filter client-side
        submissionsQuery = query(
          submissionsRef,
          orderBy('date', 'desc')
        );
      }

      const querySnapshot = await getDocs(submissionsQuery);
      console.log('Found submissions:', querySnapshot.size); // Debug log

      const submissions = [];
      let totalTithes = 0;
      let totalOfferings = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const submissionDate = data.date?.toDate();
        
        // Skip if outside date range for weekly/monthly reports
        if (reportType !== 'custom') {
          if (submissionDate < start || submissionDate > end) {
            return;
          }
        }

        const tithe = parseFloat(data.tithe) || 0;
        const offering = parseFloat(data.offering) || 0;

        submissions.push({
          id: doc.id,
          memberName: data.memberName,
          tithe: tithe,
          offering: offering,
          date: formatDate(submissionDate),
          weekNumber: data.weekNumber
        });
        
        totalTithes += tithe;
        totalOfferings += offering;
      });

      console.log('Processed submissions:', {
        count: submissions.length,
        totalTithes,
        totalOfferings
      }); // Debug log

      setReportData({
        submissions: submissions.sort((a, b) => new Date(b.date) - new Date(a.date)),
        summary: {
          totalTithes,
          totalOfferings,
          totalCombined: totalTithes + totalOfferings,
          startDate: formatDate(start),
          endDate: formatDate(end),
        },
      });

      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-dark-fg-primary">Generate Report</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-dark-fg-alt">
          Generate financial reports for any date range.
        </p>
      </div>

      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Report Type
              </label>
              <select
                id="reportType"
                name="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={generateReport}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-dark-fg-primary">Report Summary</h3>
                <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="overflow-hidden rounded-lg bg-white/80 dark:bg-dark-bg-alt px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-dark-fg-alt">Total Tithes</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-dark-fg-primary">
                      {formatCurrency(reportData.summary.totalTithes)}
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white/80 dark:bg-dark-bg-alt px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-dark-fg-alt">Total Offerings</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-dark-fg-primary">
                      {formatCurrency(reportData.summary.totalOfferings)}
                    </dd>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-white/80 dark:bg-dark-bg-alt px-4 py-5 shadow sm:p-6">
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-dark-fg-alt">Total Combined</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-dark-fg-primary">
                      {formatCurrency(reportData.summary.totalCombined)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-dark-fg-primary">Detailed Report</h3>
                    <p className="mt-2 text-sm text-gray-700 dark:text-dark-fg-alt">
                      A detailed list of all financial submissions for the selected period.
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <PDFDownloadLink
                      document={<ReportPDF data={reportData} />}
                      fileName={`financial_report_${dateRange.startDate}_to_${dateRange.endDate}.pdf`}
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 sm:w-auto"
                    >
                      {({ loading }) => (loading ? 'Preparing PDF...' : 'Download PDF')}
                    </PDFDownloadLink>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-dark-border">
                      <thead className="bg-gray-50 dark:bg-dark-bg-alt">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary sm:pl-6"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary"
                          >
                            Member Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary"
                          >
                            Tithe
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary"
                          >
                            Offering
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary"
                          >
                            Week
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-dark-border bg-white dark:bg-dark-bg-primary">
                        {reportData.submissions.map((item) => (
                          <tr key={item.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-dark-fg-primary sm:pl-6">
                              {item.date}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-fg-alt">
                              {item.memberName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-fg-alt">
                              {formatCurrency(item.tithe)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-fg-alt">
                              {formatCurrency(item.offering)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-fg-alt">
                              {item.weekNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports; 