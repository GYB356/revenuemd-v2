import React from 'react';
import { LineChart, BarChart, PieChart } from './charts';

const Dashboard = () => {
  const mockData = [
    { date: '2024-01', value: 100 },
    { date: '2024-02', value: 200 },
  ];

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <LineChart data={mockData} xField="date" yField="value" />
      <BarChart data={mockData} xField="date" yField="value" />
      <PieChart data={mockData} />
    </div>
  );
};

export default Dashboard;
