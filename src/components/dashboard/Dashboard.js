import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { formatCurrency } from '../../utils/helpers';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import MembershipPieChart from './MembershipPieChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTithes: 0,
    totalOfferings: 0,
    weeklyData: Array(5).fill({ tithes: 0, offerings: 0 }),
  });
  const [membershipData, setMembershipData] = useState([
    { id: 'men', label: 'Men', value: 0 },
    { id: 'women', label: 'Women', value: 0 },
    { id: 'youth', label: 'Youth', value: 0 },
    { id: 'children', label: 'Children', value: 0 }
  ]);

  useEffect(() => {
    let unsubscribeSubmissions = null;
    let unsubscribeMembers = null;
    let isMounted = true;

    const setupRealtimeSync = async () => {
      try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Calculate weeks in the month
        const numWeeks = Math.ceil((endOfMonth.getDate() - startOfMonth.getDate() + 1) / 7);
        const weekRanges = Array(numWeeks).fill().map((_, index) => {
          const start = new Date(startOfMonth);
          start.setDate(start.getDate() + (index * 7));
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          if (end > endOfMonth) end.setDate(endOfMonth.getDate());
          return { start, end };
        });

        // Real-time members sync
        const membersRef = collection(db, 'members');
        unsubscribeMembers = onSnapshot(membersRef, 
          (snapshot) => {
            if (!isMounted) return;
            
            const memberCounts = {
              men: 0,
              women: 0,
              youth: 0,
              children: 0
            };

            snapshot.forEach((doc) => {
              const member = doc.data();
              let birthYear = 0;
              
              if (member.birthYear) {
                birthYear = member.birthYear;
              } else if (member.dateOfBirth) {
                // Handle different date formats
                if (member.dateOfBirth.toDate) {
                  // Firebase Timestamp
                  birthYear = member.dateOfBirth.toDate().getFullYear();
                } else if (typeof member.dateOfBirth === 'string') {
                  // String date format
                  birthYear = new Date(member.dateOfBirth).getFullYear();
                }
              }

              const currentYear = new Date().getFullYear();
              const age = birthYear ? currentYear - birthYear : (member.age || 0);
              const gender = member.gender?.toLowerCase() || '';

              if (age < 15) {
                memberCounts.children++;
              } else if (age >= 15 && age <= 30) {
                memberCounts.youth++;
              } else {
                if (gender === 'male') {
                  memberCounts.men++;
                } else if (gender === 'female') {
                  memberCounts.women++;
                }
              }
            });

            if (isMounted) {
              setMembershipData([
                { id: 'men', label: 'Men (31+)', value: memberCounts.men },
                { id: 'women', label: 'Women (31+)', value: memberCounts.women },
                { id: 'youth', label: 'Youth (15-30)', value: memberCounts.youth },
                { id: 'children', label: 'Children (0-14)', value: memberCounts.children }
              ]);
            }
          },
          (error) => {
            console.error('Error syncing members:', error);
            if (isMounted) {
              setError('Failed to sync membership data');
            }
          }
        );

        // Real-time submissions sync
        const submissionsRef = collection(db, 'submissions');
        const monthlyQuery = query(
          submissionsRef,
          where('date', '>=', startOfMonth),
          where('date', '<=', endOfMonth),
          orderBy('date', 'desc')
        );

        unsubscribeSubmissions = onSnapshot(monthlyQuery, 
          (submissionsSnapshot) => {
            if (!isMounted) return;

            let totalTithes = 0;
            let totalOfferings = 0;
            const weeklyTotals = Array(numWeeks).fill().map(() => ({ tithes: 0, offerings: 0 }));

            submissionsSnapshot.forEach((doc) => {
              const data = doc.data();
              const submissionDate = data.date.toDate();
              totalTithes += Number(data.tithe) || 0;
              totalOfferings += Number(data.offering) || 0;

              // Find which week this submission belongs to
              const weekIndex = weekRanges.findIndex(({ start, end }) => 
                submissionDate >= start && submissionDate <= end
              );

              if (weekIndex !== -1) {
                weeklyTotals[weekIndex].tithes += Number(data.tithe) || 0;
                weeklyTotals[weekIndex].offerings += Number(data.offering) || 0;
              }
            });

            if (isMounted) {
              setStats({
                totalTithes,
                totalOfferings,
                weeklyData: weeklyTotals
              });
              setLoading(false);
            }
          },
          (error) => {
            console.error('Error syncing submissions:', error);
            if (isMounted) {
              setError('Failed to sync financial data');
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error('Error setting up real-time sync:', error);
        if (isMounted) {
          setError('Failed to initialize dashboard');
          setLoading(false);
        }
      }
    };

    setupRealtimeSync();

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribeMembers) {
        unsubscribeMembers();
      }
      if (unsubscribeSubmissions) {
        unsubscribeSubmissions();
      }
    };
  }, []);

  const chartData = {
    labels: stats.weeklyData.map((_, index) => {
      const weekStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1 + (index * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `Week ${index + 1} (${weekStart.getDate()}-${weekEnd.getDate()})`;
    }),
    datasets: [
      {
        label: 'Tithes',
        data: stats.weeklyData.map((week) => week.tithes),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
      },
      {
        label: 'Offerings',
        data: stats.weeklyData.map((week) => week.offerings),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'Monthly Financial Trends',
        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
        },
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#f3f4f6',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-500 dark:text-dark-fg-alt">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Collections Card */}
        <div className="card bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-primary-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-dark-fg-alt truncate">Total Collections</dt>
                  <dd className="text-lg font-medium text-gray-800 dark:text-dark-fg-primary">
                    {formatCurrency(stats.totalTithes + stats.totalOfferings)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Tithes Card */}
        <div className="card bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-dark-fg-alt truncate">Total Tithes</dt>
                  <dd className="text-lg font-medium text-gray-800 dark:text-dark-fg-primary">
                    {formatCurrency(stats.totalTithes)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Offerings Card */}
        <div className="card bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-primary-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-600 dark:text-dark-fg-alt truncate">Total Offerings</dt>
                  <dd className="text-lg font-medium text-gray-800 dark:text-dark-fg-primary">
                    {formatCurrency(stats.totalOfferings)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Financial Chart */}
        <div className="card bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6">
          <Line options={chartOptions} data={chartData} />
        </div>

        {/* Member Demographics */}
        <div className="card bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm p-6">
          <MembershipPieChart 
            data={membershipData}
            title="Membership Distribution"
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 