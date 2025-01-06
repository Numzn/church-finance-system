import React from 'react';
import { formatCurrency } from '../../utils/helpers';
import MembershipPieChart from './MembershipPieChart';
import { Line } from 'react-chartjs-2';

const Overview = ({ stats, membershipData, chartData, chartOptions }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Collections Card */}
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-fg">Total Collections</h3>
          <dl className="mt-5 grid grid-cols-1 gap-5">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-dark-fg-alt">Tithes</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-dark-fg">
                {formatCurrency(stats.totalTithes)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-dark-fg-alt">Offerings</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-dark-fg">
                {formatCurrency(stats.totalOfferings)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Membership Stats Card */}
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-fg">Membership</h3>
          <div className="mt-5 h-48">
            <MembershipPieChart data={membershipData} />
          </div>
        </div>

        {/* Weekly Trends Card */}
        <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-fg">Weekly Trends</h3>
          <div className="mt-5">
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview; 