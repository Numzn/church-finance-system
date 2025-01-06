import React from 'react';
import { ResponsivePie } from '@nivo/pie';

function MembershipPieChart({ data, title = "Member Demographics" }) {
  // Ensure data is in the correct format and not null
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="h-[400px] relative">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-fg-primary absolute top-0 left-0">
        {title}
      </h3>
      <ResponsivePie
        data={chartData}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
        innerRadius={0.5}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={{ scheme: 'category10' }}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor={document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827'}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 0,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#666666',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: 'circle'
          }
        ]}
        theme={{
          text: {
            fill: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827',
          },
          tooltip: {
            container: {
              background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
              color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827',
            }
          }
        }}
      />
    </div>
  );
}

export default MembershipPieChart; 