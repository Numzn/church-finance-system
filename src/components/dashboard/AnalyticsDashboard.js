import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/helpers';
import { 
  calculateMonthlyComparison, 
  calculateYearlyTrends,
  analyzeContributionPatterns,
  generateEnhancedReport,
  formatEnhancedReportForExcel,
  calculateQuarterlyStats,
  calculateWeeklyAverages,
  analyzeGrowthTrends
} from '../../utils/analytics';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const processDate = (dateInput) => {
  try {
    if (!dateInput) return null;
    if (typeof dateInput.toDate === 'function') return dateInput.toDate();
    if (dateInput instanceof Date) return dateInput;
    return new Date(dateInput);
  } catch (error) {
    console.warn('Error processing date:', error);
    return null;
  }
};

function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [category, setCategory] = useState('all'); // all, tithes, offerings
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview'); // overview, quarterly, weekly, growth
  const [analyticsData, setAnalyticsData] = useState({
    monthlyComparison: null,
    yearlyTrends: [],
    contributionPatterns: [],
    quarterlyStats: [],
    weeklyAverages: [],
    growthTrends: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Fetch submissions
      const submissionsRef = collection(db, 'submissions');
      const submissionsQuery = query(
        submissionsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissions = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch members for contribution patterns
      const membersRef = collection(db, 'members');
      const membersSnapshot = await getDocs(membersRef);
      const members = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate monthly comparison
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthData = submissions.filter(s => {
        const date = s.date.toDate();
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      const previousMonthData = submissions.filter(s => {
        const date = s.date.toDate();
        return date.getMonth() === (currentMonth - 1) && date.getFullYear() === currentYear;
      });

      const monthlyComparison = calculateMonthlyComparison(
        {
          totalTithes: currentMonthData.reduce((sum, s) => sum + (s.tithe || 0), 0),
          totalOfferings: currentMonthData.reduce((sum, s) => sum + (s.offering || 0), 0),
        },
        {
          totalTithes: previousMonthData.reduce((sum, s) => sum + (s.tithe || 0), 0),
          totalOfferings: previousMonthData.reduce((sum, s) => sum + (s.offering || 0), 0),
        }
      );

      // Calculate yearly trends
      const yearlyTrends = calculateYearlyTrends(
        submissions.reduce((acc, submission) => {
          const date = processDate(submission.date);
          if (!date) return acc;
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!acc[monthKey]) {
            acc[monthKey] = { totalTithes: 0, totalOfferings: 0 };
          }
          acc[monthKey].totalTithes += parseFloat(submission.tithe) || 0;
          acc[monthKey].totalOfferings += parseFloat(submission.offering) || 0;
          return acc;
        }, {})
      );

      // Analyze contribution patterns
      const contributionPatterns = analyzeContributionPatterns(submissions, members);

      // Calculate additional metrics
      const quarterlyStats = calculateQuarterlyStats(submissions);
      const weeklyAverages = calculateWeeklyAverages(submissions);
      const growthTrends = analyzeGrowthTrends(submissions);

      setAnalyticsData({
        monthlyComparison,
        yearlyTrends,
        contributionPatterns,
        quarterlyStats,
        weeklyAverages,
        growthTrends
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    try {
      // Helper function to create styled headers
      const createStyledHeader = (ws, range) => {
        const headerStyle = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } },
          alignment: { horizontal: "center" },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
        for (let cell of range) {
          if (ws[cell]) {
            ws[cell].s = headerStyle;
          }
        }
      };

      // Helper function to create section headers
      const createSectionHeader = (ws, cell) => {
        if (ws[cell]) {
          ws[cell].s = {
            font: { bold: true, size: 14, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "E5E7EB" } },
            alignment: { horizontal: "left" },
            border: {
              bottom: { style: 'thin', color: { rgb: "000000" } }
            }
          };
        }
      };

      // Helper function to format currency cells
      const formatCurrencyCells = (ws, range) => {
        const currencyStyle = {
          numFmt: '"$"#,##0.00;[Red]-"$"#,##0.00',
          alignment: { horizontal: "right" },
          font: { color: { rgb: "000000" } }
        };
        for (let cell of range) {
          if (ws[cell]) {
            ws[cell].s = currencyStyle;
          }
        }
      };

      // Helper function to format percentage cells
      const formatPercentageCells = (ws, range) => {
        const percentageStyle = {
          numFmt: '0.0"%"',
          alignment: { horizontal: "right" },
          font: { color: { rgb: "000000" } }
        };
        for (let cell of range) {
          if (ws[cell]) {
            ws[cell].s = percentageStyle;
          }
        }
      };

      // Helper function to format date cells
      const formatDateCells = (ws, range) => {
        const dateStyle = {
          numFmt: 'mm/dd/yyyy',
          alignment: { horizontal: "center" },
          font: { color: { rgb: "000000" } }
        };
        for (let cell of range) {
          if (ws[cell]) {
            ws[cell].s = dateStyle;
          }
        }
      };

      const report = generateEnhancedReport(analyticsData.yearlyTrends, dateRange);
      const formattedData = formatEnhancedReportForExcel(report);
      
      const wb = XLSX.utils.book_new();
      wb.Props = {
        Title: "Church Financial Report",
        Subject: "Financial Analytics",
        Author: "Church Finance System",
        CreatedDate: new Date()
      };
      
      // Add Executive Summary Sheet
      const executiveSummaryWS = XLSX.utils.aoa_to_sheet(formattedData.executiveSummary);
      XLSX.utils.book_append_sheet(wb, executiveSummaryWS, 'Executive Summary');
      
      // Add Detailed Transactions Sheet
      const detailedTransactionsWS = XLSX.utils.aoa_to_sheet(formattedData.detailedTransactions);
      XLSX.utils.book_append_sheet(wb, detailedTransactionsWS, 'Transactions');
      
      // Add Quarterly Analysis Sheet
      const quarterlyAnalysisWS = XLSX.utils.aoa_to_sheet(formattedData.quarterlyAnalysis);
      XLSX.utils.book_append_sheet(wb, quarterlyAnalysisWS, 'Quarterly Analysis');
      
      // Add Weekly Trends Sheet
      const weeklyTrendsWS = XLSX.utils.aoa_to_sheet(formattedData.weeklyTrends);
      XLSX.utils.book_append_sheet(wb, weeklyTrendsWS, 'Weekly Trends');
      
      // Add Growth Analysis Sheet
      const growthAnalysisWS = XLSX.utils.aoa_to_sheet(formattedData.growthAnalysis);
      XLSX.utils.book_append_sheet(wb, growthAnalysisWS, 'Growth Analysis');
      
      // Add Contributor Statistics Sheet
      const contributorStatsWS = XLSX.utils.aoa_to_sheet(formattedData.contributorStats);
      XLSX.utils.book_append_sheet(wb, contributorStatsWS, 'Contributor Stats');

      // Apply styles to all sheets
      const sheets = [
        { 
          ws: executiveSummaryWS, 
          headerRange: ['A1:B1'],
          currencyRange: ['B6:B9'],
          dateRange: []
        },
        { 
          ws: detailedTransactionsWS, 
          headerRange: ['A4:F4'],
          currencyRange: ['C5:E1000'],
          dateRange: ['A5:A1000']
        },
        { 
          ws: quarterlyAnalysisWS, 
          headerRange: ['A4:E4'],
          currencyRange: ['B5:D8'],
          percentageRange: ['E5:E8']
        },
        { 
          ws: weeklyTrendsWS, 
          headerRange: ['A4:E4'],
          currencyRange: ['B5:D1000']
        },
        { 
          ws: growthAnalysisWS, 
          headerRange: ['A4:F4'],
          currencyRange: ['B5:B1000'],
          percentageRange: ['E5:F1000']
        },
        { 
          ws: contributorStatsWS, 
          headerRange: ['A4:E4'],
          currencyRange: ['B5:B1000', 'D5:D1000'],
          dateRange: ['E5:E1000']
        }
      ];

      sheets.forEach(({ ws, headerRange, currencyRange, dateRange, percentageRange }) => {
        // Apply header styles
        createStyledHeader(ws, headerRange);
        
        // Apply section header styles
        createSectionHeader(ws, 'A1');
        
        // Apply currency formatting
        if (currencyRange) {
          currencyRange.forEach(range => {
            formatCurrencyCells(ws, Array.from({ length: 1000 }, (_, i) => `${range.split(':')[0]}${i + 5}`));
          });
        }

        // Apply date formatting
        if (dateRange) {
          dateRange.forEach(range => {
            formatDateCells(ws, Array.from({ length: 1000 }, (_, i) => `${range.split(':')[0]}${i + 5}`));
          });
        }

        // Apply percentage formatting
        if (percentageRange) {
          percentageRange.forEach(range => {
            formatPercentageCells(ws, Array.from({ length: 1000 }, (_, i) => `${range.split(':')[0]}${i + 5}`));
          });
        }
        
        // Set column widths
        const lastCol = ws['!ref'].split(':')[1].replace(/\d+/, '');
        const colCount = lastCol.charCodeAt(0) - 64;
        ws['!cols'] = Array(colCount).fill({ wch: 15 });
      });
      
      // Save the file with a formatted name including date range
      const startDate = new Date(dateRange.start).toLocaleDateString().replace(/\//g, '-');
      const endDate = new Date(dateRange.end).toLocaleDateString().replace(/\//g, '-');
      const fileName = `Church_Financial_Report_${startDate}_to_${endDate}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      
      toast.success('Enhanced financial report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const renderQuarterlyChart = () => (
    <div className="h-[400px]">
      <Bar
        data={{
          labels: analyticsData.quarterlyStats.map(q => q.quarter),
          datasets: [
            {
              label: 'Tithes',
              data: analyticsData.quarterlyStats.map(q => q.tithes),
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 1
            },
            {
              label: 'Offerings',
              data: analyticsData.quarterlyStats.map(q => q.offerings),
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
              borderColor: 'rgb(16, 185, 129)',
              borderWidth: 1
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => formatCurrency(value),
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Quarterly Financial Distribution',
              font: {
                size: 16
              }
            },
            legend: {
              position: 'top',
            }
          }
        }}
      />
    </div>
  );

  const renderWeeklyChart = () => (
    <div className="h-[400px]">
      <Line
        data={{
          labels: analyticsData.weeklyAverages.map(w => w.week),
          datasets: [
            {
              label: 'Average Tithes',
              data: analyticsData.weeklyAverages.map(w => w.avgTithes),
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              tension: 0.3
            },
            {
              label: 'Average Offerings',
              data: analyticsData.weeklyAverages.map(w => w.avgOfferings),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
              tension: 0.3
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => formatCurrency(value),
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Weekly Average Contributions',
              font: {
                size: 16
              }
            },
            legend: {
              position: 'top',
            }
          },
          interaction: {
            mode: 'index',
            intersect: false,
          }
        }}
      />
    </div>
  );

  const renderGrowthChart = () => (
    <div className="h-[400px]">
      <Line
        data={{
          labels: analyticsData.growthTrends.map(g => g.month),
          datasets: [
            {
              label: 'Total Contributions',
              data: analyticsData.growthTrends.map(g => g.total),
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              yAxisID: 'y',
              tension: 0.3
            },
            {
              label: 'Retention Rate (%)',
              data: analyticsData.growthTrends.map(g => g.retentionRate),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
              yAxisID: 'y1',
              tension: 0.3
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              ticks: {
                callback: value => formatCurrency(value),
              },
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: value => `${value}%`,
              },
              grid: {
                drawOnChartArea: false,
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Growth Trends & Retention',
              font: {
                size: 16
              }
            },
            legend: {
              position: 'top',
            }
          },
          interaction: {
            mode: 'index',
            intersect: false,
          }
        }}
      />
    </div>
  );

  const renderOverviewCharts = () => {
    if (!analyticsData.contributionPatterns || !analyticsData.yearlyTrends) {
      return <div>No data available</div>;
    }

    const recentContributors = analyticsData.contributionPatterns
      .filter(pattern => pattern && pattern.memberName)
      .map(pattern => ({
          name: pattern.memberName,
          amount: pattern.totalContributions || 0,
          frequency: pattern.frequency || 0,
          average: pattern.averageAmount || 0,
        date: pattern.lastContribution ? 
          (typeof pattern.lastContribution.toDate === 'function' ? 
            pattern.lastContribution.toDate().toLocaleDateString() : 
            new Date(pattern.lastContribution).toLocaleDateString()
          ) : 'N/A'
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return (
    <>
      {/* Monthly Comparison Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Tithes</h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(analyticsData.monthlyComparison?.tithes?.current || 0)}
            </div>
            <div className={`text-sm ${
                (analyticsData.monthlyComparison?.tithes?.growth || 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
                {(analyticsData.monthlyComparison?.tithes?.growth || 0).toFixed(1)}% vs last month
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Offerings</h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(analyticsData.monthlyComparison?.offerings?.current || 0)}
            </div>
            <div className={`text-sm ${
                (analyticsData.monthlyComparison?.offerings?.growth || 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
                {(analyticsData.monthlyComparison?.offerings?.growth || 0).toFixed(1)}% vs last month
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Total</h3>
          <div className="mt-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(analyticsData.monthlyComparison?.total?.current || 0)}
            </div>
            <div className={`text-sm ${
                (analyticsData.monthlyComparison?.total?.growth || 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
                {(analyticsData.monthlyComparison?.total?.growth || 0).toFixed(1)}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Trends Chart */}
      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Yearly Trends
        </h3>
        <div className="h-[400px]">
          <Line
            data={{
              labels: analyticsData.yearlyTrends.map(d => d.month),
              datasets: [
                {
                  label: 'Tithes',
                    data: analyticsData.yearlyTrends.map(d => d.tithes || 0),
                  borderColor: 'rgb(99, 102, 241)',
                  backgroundColor: 'rgba(99, 102, 241, 0.5)',
                  tension: 0.3
                },
                {
                  label: 'Offerings',
                    data: analyticsData.yearlyTrends.map(d => d.offerings || 0),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.5)',
                  tension: 0.3
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: value => formatCurrency(value),
                  },
                },
              },
              plugins: {
                title: {
                  display: true,
                  text: 'Yearly Financial Trends',
                  font: {
                    size: 16
                  }
                },
                legend: {
                  position: 'top',
                }
              },
              interaction: {
                mode: 'index',
                intersect: false,
              }
            }}
          />
        </div>
      </div>

        {/* Recent Contributors Table */}
      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Recent Contributors
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Contributions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Average Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Contribution
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/40 dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-gray-700">
                {recentContributors.map((contributor) => (
                  <tr key={contributor.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {contributor.name}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                      {formatCurrency(contributor.amount)}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                      {contributor.frequency}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                      {formatCurrency(contributor.average)}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-100">
                      {contributor.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800"
            >
              <option value="all">All</option>
              <option value="tithes">Tithes</option>
              <option value="offerings">Offerings</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
              View
            </label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-800"
            >
              <option value="overview">Overview</option>
              <option value="quarterly">Quarterly Analysis</option>
              <option value="weekly">Weekly Trends</option>
              <option value="growth">Growth Analysis</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Export Enhanced Report
          </button>
        </div>
      </div>

      {/* Views */}
      {view === 'overview' && renderOverviewCharts()}
      {view === 'quarterly' && (
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Quarterly Analysis
          </h3>
          {renderQuarterlyChart()}
        </div>
      )}
      {view === 'weekly' && (
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Weekly Contribution Trends
          </h3>
          {renderWeeklyChart()}
        </div>
      )}
      {view === 'growth' && (
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Growth & Retention Analysis
          </h3>
          {renderGrowthChart()}
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard; 