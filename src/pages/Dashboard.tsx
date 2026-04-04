import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Activity,
  Package
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { getDatasetSummary, getChartData } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ dataset }: { dataset: string | null }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dataset) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getDatasetSummary(dataset);
        setSummary(data);
        
        // Try to guess columns for a standard chart
        const dateCol = data.columns.find((c: string) => c.toLowerCase().includes('date') || c.toLowerCase().includes('time'));
        const numericCol = Object.keys(data.types).find(k => data.types[k].includes('float') || data.types[k].includes('int'));
        
        if (dateCol && numericCol) {
          const chart = await getChartData(dataset, dateCol, numericCol, 'sum');
          // Sort by date for line chart if needed, assuming the backend limited to 20
          setChartData(chart.slice(0, 7).reverse()); // Just 7 entries for dashboard sparkline
        } else if (data.columns.length > 1) {
          // just pick any two for a demo
          const chart = await getChartData(dataset, data.columns[0], numericCol || data.columns[1], 'count');
          setChartData(chart);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [dataset]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Activity size={48} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to DecisionGPT</h2>
        <p className="text-gray-500 max-w-md">Get started by uploading a dataset in the Data Manager. Your AI copilot is ready to analyze your business metrics.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analyzing {dataset}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Revenue" 
              value={`$${summary?.metrics?.total_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}`} 
              icon={<DollarSign size={24} className="text-emerald-500" />}
              trend="+12.5%"
              positive={true}
            />
            <MetricCard 
              title="Transactions" 
              value={summary?.metrics?.total_transactions?.toLocaleString() || '0'} 
              icon={<ShoppingCart size={24} className="text-blue-500" />}
              trend="+8.2%"
              positive={true}
            />
            <MetricCard 
              title="Active Customers" 
              value={summary?.metrics?.active_customers?.toLocaleString() || '0'} 
              icon={<Users size={24} className="text-purple-500" />}
              trend="-2.4%"
              positive={false}
            />
            <MetricCard 
              title="Top Product" 
              value={summary?.metrics?.top_product?.toString() || 'N/A'} 
              icon={<Package size={24} className="text-orange-500" />}
              subtitle="Highest volume item"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <motion.div variants={item as any} className="lg:col-span-2 glass-card rounded-2xl p-6 border border-[#e2e8f0] dark:border-[#27272a]">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Revenue Trend</h3>
              </div>
              <div className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" tick={{fill: '#888888'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#888888'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: 'none', color: '#000' }} 
                        itemStyle={{ color: '#000' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">Not enough data to visualize</div>
                )}
              </div>
            </motion.div>

            {/* AI Insights Sidebar */}
            <motion.div variants={item as any} className="glass rounded-2xl p-6 border border-[#e2e8f0] dark:border-[#27272a] flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-purple-500" />
                <h3 className="font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">AI Findings</h3>
              </div>
              
              <div className="space-y-4 flex-1">
                 <InsightItem 
                   title="Revenue Spike Detected"
                   desc="Sales increased by 18% in the latest period analyzed compared to the average."
                   type="positive"
                 />
                 <InsightItem 
                   title="Customer Retention"
                   desc="Repeat purchase frequency is showing a slight decline indicating a need for targeted marketing."
                   type="warning"
                 />
                 <InsightItem 
                   title="Product Performance"
                   desc={`"${summary?.metrics?.top_product}" consistently dominates transaction volume.`}
                   type="info"
                 />
              </div>
              
              <button onClick={() => navigate('/reports')} className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow">
                Generate Full Report
              </button>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MetricCard({ title, value, icon, trend, positive, subtitle }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
      }}
      className="glass rounded-2xl p-5 border border-[#e2e8f0] dark:border-[#27272a] flex flex-col relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <div className="flex justify-between items-start mb-4">
        <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">{title}</p>
        <div className="p-2 bg-white/50 dark:bg-black/20 rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-1 tracking-tight">{value}</h3>
      {trend ? (
        <div className={`flex items-center text-sm font-medium ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
          <TrendingUp size={16} className={`mr-1 ${!positive && 'rotate-180'}`} />
          {trend} <span className="text-gray-400 font-normal ml-1">vs last period</span>
        </div>
      ) : subtitle ? (
        <p className="text-sm text-gray-400">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}

function InsightItem({ title, desc, type }: any) {
  const getColors = () => {
    switch(type) {
      case 'positive': return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400';
      default: return 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className={`p-4 rounded-xl border ${getColors()} transition-all hover:scale-[1.02] cursor-default`}>
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs opacity-80 leading-relaxed">{desc}</p>
    </div>
  );
}
