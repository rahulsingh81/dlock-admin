import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  UserCheck,
  UserX,
  Server,
  Cloud,
  HardDrive
} from 'lucide-react';
import { mockStats, mockChartData } from '@/data/mockData';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  gradient 
}: {
  title: string;
  value: string;
  icon: any;
  change: string;
  gradient: string;
}) => (
  <Card className="card-hover">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">
        {title}
      </CardTitle>
      <div className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <p className="text-xs text-slate-600">
        <span className="text-green-600 font-semibold">{change}</span> from last month
      </p>
    </CardContent>
  </Card>
);

const SimpleChart = ({ 
  title, 
  data, 
  color = "blue" 
}: {
  title: string;
  data: number[];
  color?: string;
}) => {
  const max = Math.max(...data);
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 space-x-2">
          {data.map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full ${colorClasses[color as keyof typeof colorClasses]} rounded-t-sm`}
                style={{ height: `${(value / max) * 100}%` }}
              />
              <div className="text-xs text-slate-500 mt-2">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="text-sm text-slate-600">Last 12 months</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Overview of your admin panel metrics</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={mockStats.totalUsers.toLocaleString()}
          icon={Users}
          change="+12.5%"
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <StatsCard
          title="Total Orders"
          value={mockStats.totalOrders.toLocaleString()}
          icon={Package}
          change="+8.2%"
          gradient="bg-gradient-to-r from-green-500 to-green-600"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${mockStats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          change="+15.3%"
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${mockStats.monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          change="+23.1%"
          gradient="bg-gradient-to-r from-orange-500 to-orange-600"
        />
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Active Users"
          value={mockStats.activeUsers.toLocaleString()}
          icon={UserCheck}
          change="+5.2%"
          gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
        />
        <StatsCard
          title="Inactive Users"
          value={mockStats.inactiveUsers.toLocaleString()}
          icon={UserX}
          change="-2.1%"
          gradient="bg-gradient-to-r from-red-500 to-red-600"
        />
        <StatsCard
          title="New Users (30d)"
          value={mockStats.newUsers.toLocaleString()}
          icon={Users}
          change="+18.7%"
          gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
        />
      </div>

      {/* Order Type Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="VPS Orders"
          value={mockStats.vpsOrders.toLocaleString()}
          icon={Server}
          change="+7.3%"
          gradient="bg-gradient-to-r from-indigo-500 to-indigo-600"
        />
        <StatsCard
          title="Cloud Orders"
          value={mockStats.cloudOrders.toLocaleString()}
          icon={Cloud}
          change="+12.8%"
          gradient="bg-gradient-to-r from-sky-500 to-sky-600"
        />
        <StatsCard
          title="Dedicated Orders"
          value={mockStats.dedicatedOrders.toLocaleString()}
          icon={HardDrive}
          change="+4.5%"
          gradient="bg-gradient-to-r from-violet-500 to-violet-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart
          title="User Growth Trend"
          data={mockChartData.userGrowth}
          color="blue"
        />
        <SimpleChart
          title="Order Volume Trend"
          data={mockChartData.orderVolume}
          color="green"
        />
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart
          title="Revenue Trend"
          data={mockChartData.revenue}
          color="purple"
        />
        <SimpleChart
          title="Monthly Active Users"
          data={mockChartData.activeUsers}
          color="orange"
        />
      </div>
    </div>
  );
}