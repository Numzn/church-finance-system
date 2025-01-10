import { formatCurrency } from './helpers';

// Helper functions
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

const parseAmount = (value) => {
  const amount = parseFloat(value);
  return isNaN(amount) ? 0 : amount;
};

const calculateGrowthRate = (currentValue, previousValue) => {
  if (!previousValue) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
};

// Export all required functions
export const calculateMonthlyComparison = (currentMonthData = {}, previousMonthData = {}) => ({
    tithes: {
    current: parseAmount(currentMonthData.totalTithes),
    previous: parseAmount(previousMonthData.totalTithes),
      growth: calculateGrowthRate(
      parseAmount(currentMonthData.totalTithes),
      parseAmount(previousMonthData.totalTithes)
    )
    },
    offerings: {
    current: parseAmount(currentMonthData.totalOfferings),
    previous: parseAmount(previousMonthData.totalOfferings),
      growth: calculateGrowthRate(
      parseAmount(currentMonthData.totalOfferings),
      parseAmount(previousMonthData.totalOfferings)
    )
    },
    total: {
    current: parseAmount(currentMonthData.totalTithes) + parseAmount(currentMonthData.totalOfferings),
    previous: parseAmount(previousMonthData.totalTithes) + parseAmount(previousMonthData.totalOfferings),
      growth: calculateGrowthRate(
      parseAmount(currentMonthData.totalTithes) + parseAmount(currentMonthData.totalOfferings),
      parseAmount(previousMonthData.totalTithes) + parseAmount(previousMonthData.totalOfferings)
    )
  }
});

export const calculateYearlyTrends = (yearlyData = {}) => 
  Object.entries(yearlyData)
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, data]) => ({
    month,
      tithes: parseAmount(data?.totalTithes),
      offerings: parseAmount(data?.totalOfferings),
      total: parseAmount(data?.totalTithes) + parseAmount(data?.totalOfferings)
    }));

export const analyzeContributionPatterns = (submissions = [], members = []) => {
  const patterns = {};
  
  members.forEach(member => {
    if (!member?.id) return;
    patterns[member.id] = {
      memberId: member.id,
      memberName: member.firstName && member.lastName ? 
        `${member.firstName} ${member.lastName}` : 'Unknown Member',
      totalContributions: 0,
      frequency: 0,
      averageAmount: 0,
      lastContribution: null
    };
  });

  submissions.forEach(submission => {
    if (!submission?.memberId || !patterns[submission.memberId]) return;
    const pattern = patterns[submission.memberId];
    const total = parseAmount(submission.tithe) + parseAmount(submission.offering);
      pattern.totalContributions += total;
      pattern.frequency += 1;
    
    // Handle date properly
    let submissionDate = null;
    try {
      if (submission.date?.toDate) {
        submissionDate = submission.date.toDate();
      } else if (submission.date instanceof Date) {
        submissionDate = submission.date;
      } else if (submission.date) {
        submissionDate = new Date(submission.date);
      }
    } catch (error) {
      console.warn('Error processing date:', error);
    }

    if (submissionDate && (!pattern.lastContribution || submissionDate > pattern.lastContribution)) {
      pattern.lastContribution = submissionDate;
    }
  });

  return Object.values(patterns)
    .map(pattern => ({
      ...pattern,
      averageAmount: pattern.frequency > 0 ? pattern.totalContributions / pattern.frequency : 0
    }))
    .sort((a, b) => b.totalContributions - a.totalContributions);
};

export const calculateQuarterlyStats = (submissions = []) => {
  const quarters = {
    Q1: { months: [0, 1, 2], tithes: 0, offerings: 0 },
    Q2: { months: [3, 4, 5], tithes: 0, offerings: 0 },
    Q3: { months: [6, 7, 8], tithes: 0, offerings: 0 },
    Q4: { months: [9, 10, 11], tithes: 0, offerings: 0 }
  };

  submissions.forEach(submission => {
    const date = processDate(submission?.date);
    if (!date) return;

    const month = date.getMonth();
    const quarter = Object.entries(quarters).find(([key]) => data.months.includes(month))?.[0];
    if (quarter) {
      quarters[quarter].tithes += parseAmount(submission.tithe);
      quarters[quarter].offerings += parseAmount(submission.offering);
    }
  });

  return Object.entries(quarters).map(([quarter, data]) => ({
    quarter,
    tithes: data.tithes,
    offerings: data.offerings,
    total: data.tithes + data.offerings
  }));
};

export const calculateWeeklyAverages = (submissions = []) => {
  const weeklyTotals = {};

  submissions.forEach(submission => {
    if (!submission) return;
    const weekNumber = parseInt(submission.weekNumber) || 1;
    
    if (!weeklyTotals[weekNumber]) {
      weeklyTotals[weekNumber] = { tithes: 0, offerings: 0, count: 0 };
    }
    
    weeklyTotals[weekNumber].tithes += parseAmount(submission.tithe);
    weeklyTotals[weekNumber].offerings += parseAmount(submission.offering);
    weeklyTotals[weekNumber].count++;
  });

  return Object.entries(weeklyTotals).map(([week, data]) => ({
    week: `Week ${week}`,
    avgTithes: data.count > 0 ? data.tithes / data.count : 0,
    avgOfferings: data.count > 0 ? data.offerings / data.count : 0,
    totalContributions: data.tithes + data.offerings,
    contributionCount: data.count
  }));
};

export const analyzeGrowthTrends = (submissions = []) => {
  const monthlyData = {};
  
  submissions.forEach(submission => {
    const date = processDate(submission?.date);
    if (!date) return;

      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          tithes: 0,
          offerings: 0,
        contributorCount: new Set()
        };
      }
      
    monthlyData[monthKey].tithes += parseAmount(submission.tithe);
    monthlyData[monthKey].offerings += parseAmount(submission.offering);
    if (submission.memberId) {
      monthlyData[monthKey].contributorCount.add(submission.memberId);
      }
    });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    tithes: data.tithes,
    offerings: data.offerings,
    total: data.tithes + data.offerings,
    contributorCount: data.contributorCount.size
  }));
};

export const generateEnhancedReport = (data, dateRange) => {
  if (!Array.isArray(data)) {
    console.warn('Invalid data provided to generateEnhancedReport');
    return {
    summary: {
        totalTithes: 0,
        totalOfferings: 0,
        totalContributions: 0,
        averageContribution: 0,
        numberOfContributions: 0
      },
      details: [],
      dateRange: dateRange || { start: '', end: '' }
    };
  }

  const validData = data.filter(item => item && (item.tithe || item.offering));
  const summary = validData.reduce((acc, item) => {
    const tithe = parseAmount(item.tithe);
    const offering = parseAmount(item.offering);
    acc.totalTithes += tithe;
    acc.totalOfferings += offering;
    acc.numberOfContributions++;
    return acc;
  }, {
    totalTithes: 0,
    totalOfferings: 0,
    numberOfContributions: 0
  });

  summary.totalContributions = summary.totalTithes + summary.totalOfferings;
  summary.averageContribution = summary.numberOfContributions > 0 
    ? summary.totalContributions / summary.numberOfContributions 
    : 0;

  const details = validData.map(item => ({
    date: processDate(item.date),
    memberName: item.memberName || 'Unknown Member',
    tithe: parseAmount(item.tithe),
    offering: parseAmount(item.offering),
    weekNumber: parseInt(item.weekNumber) || 1
  }));

  return { summary, details, dateRange: dateRange || { start: '', end: '' } };
};

export const formatEnhancedReportForExcel = (report) => {
  if (!report?.summary) {
    return {
      summary: [['No data available']],
      details: [['No data available']]
    };
  }

  const summarySheet = [
    ['Church Finance System - Summary Report'],
    ['Generated on:', new Date().toLocaleString()],
    ['Period:', `${report.dateRange.start} to ${report.dateRange.end}`],
    [''],
    ['Key Metrics'],
    ['Total Contributions:', formatCurrency(report.summary.totalContributions)],
    ['Total Tithes:', formatCurrency(report.summary.totalTithes)],
    ['Total Offerings:', formatCurrency(report.summary.totalOfferings)],
    ['Average Contribution:', formatCurrency(report.summary.averageContribution)],
    ['Number of Contributions:', report.summary.numberOfContributions]
  ];

  const detailsSheet = [
    ['Detailed Transactions'],
    ['Date', 'Member Name', 'Tithe', 'Offering', 'Total', 'Week'],
    ...report.details.map(item => [
      item.date ? item.date.toLocaleDateString() : 'N/A',
      item.memberName,
      formatCurrency(item.tithe),
      formatCurrency(item.offering),
      formatCurrency(item.tithe + item.offering),
      item.weekNumber
    ])
  ];

  return { summary: summarySheet, details: detailsSheet };
}; 