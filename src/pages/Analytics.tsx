import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  BarChart3, TrendingUp, PieChart as PieIcon, Activity, 
  Plus, X, Target, Edit3, Settings2, Sparkles, LayoutGrid
} from 'lucide-react';
import { getDatasetSummary, getChartData, getPredictions } from '../api';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#14b8a6', '#f97316'];

const CHART_TYPES = [
  { id: 'bar', label: 'Bar', icon: <BarChart3 size={20} /> },
  { id: 'line', label: 'Line', icon: <TrendingUp size={20} /> },
  { id: 'area', label: 'Area', icon: <Activity size={20} /> },
  { id: 'pie', label: 'Pie', icon: <PieIcon size={20} /> },
  { id: 'forecast', label: 'Forecast', icon: <Target size={20} /> },
];

const AGG_TYPES = ['sum', 'mean', 'count'];

type DashboardVisual = {
  id: string;
  type: string;
  title: string;
  xCol: string;
  yCol: string;
  agg: string;
  data: any[];
  loading: boolean;
  error?: string;
};

export default function Analytics({ dataset }: { dataset: string | null }) {
  const [columns, setColumns] = useState<string[]>([]);
  const [numericCols, setNumericCols] = useState<string[]>([]);
  const [categoricalCols, setCategoricalCols] = useState<string[]>([]);
  
  const [visuals, setVisuals] = useState<DashboardVisual[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Core intelligence to auto-populate the dashboard
  useEffect(() => {
    if (!dataset) return;
    const init = async () => {
      setIsInitializing(true);
      setVisuals([]);
      setSelectedId(null);
      try {
        const data = await getDatasetSummary(dataset);
        setColumns(data.columns);
        const nums = data.columns.filter((c: string) => data.types[c]?.includes('float') || data.types[c]?.includes('int'));
        const cats = data.columns.filter((c: string) => data.types[c]?.includes('object') && !c.toLowerCase().includes('id'));
        const date = data.columns.find((c: string) => c.toLowerCase().includes('date') || c.toLowerCase().includes('time'));
        
        setNumericCols(nums);
        setCategoricalCols(cats);

        // Auto-generate magical default widgets
        const initialWidgets: DashboardVisual[] = [];
        
        if (date && nums.length > 0) {
          initialWidgets.push({ id: 'v_trend', type: 'area', title: 'Metric Trends Over Time', xCol: date, yCol: nums[0], agg: 'sum', data: [], loading: true });
        }
        
        if (cats.length > 0 && nums.length > 0) {
          initialWidgets.push({ id: 'v_bar', type: 'bar', title: 'Categorical Performance', xCol: cats[0], yCol: nums[0], agg: 'sum', data: [], loading: true });
        }

        if (cats.length > 1 && nums.length > 0) {
            initialWidgets.push({ id: 'v_pie', type: 'pie', title: 'Segment Distribution', xCol: cats[1], yCol: nums[0], agg: 'sum', data: [], loading: true });
        } else if (cats.length > 0 && nums.length > 1) {
            initialWidgets.push({ id: 'v_pie', type: 'pie', title: 'Secondary Distribution', xCol: cats[0], yCol: nums[1], agg: 'sum', data: [], loading: true });
        }

        // If they had a date, attach a forecast widget
        if (date && nums.length > 0) {
           initialWidgets.push({ id: 'v_forecast', type: 'forecast', title: 'AI Driven Forecast', xCol: date, yCol: nums[0], agg: 'sum', data: [], loading: true });
        }
        
        // Fallback if the dataset is weird
        if (initialWidgets.length === 0 && columns.length > 1) {
             initialWidgets.push({ id: 'v_fallback', type: 'bar', title: 'Data Snapshot', xCol: columns[0], yCol: columns[1], agg: 'count', data: [], loading: true });
        }

        setVisuals(initialWidgets);

        // Fetch them all concurrently
        initialWidgets.forEach(w => {
           fetchVisualData(w.id, w, dataset);
        });

      } catch (err) {
        console.error("Failed to load columns", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [dataset]);

  const fetchVisualData = async (vid: string, v: Partial<DashboardVisual>, ds: string) => {
    try {
      if (v.type === 'forecast') {
        const preds = await getPredictions(ds, v.xCol!, v.yCol!);
        if (preds.error) throw new Error(preds.error);
        const combinedData = [
          ...preds.historical.map((d: any) => ({ ...d, name: d.date, actual: d.actual })),
          ...preds.forecast.map((d: any) => ({ ...d, name: d.date, predicted: d.predicted }))
        ];
        setVisuals(prev => prev.map(old => old.id === vid ? { ...old, data: combinedData, loading: false, error: undefined } : old));
      } else {
        const resp = await getChartData(ds, v.xCol!, v.yCol!, v.agg!);
        setVisuals(prev => prev.map(old => old.id === vid ? { ...old, data: resp.slice(0, 30), loading: false, error: undefined } : old));
      }
    } catch (err: any) {
      setVisuals(prev => prev.map(old => old.id === vid ? { ...old, error: err.message, loading: false, data: [] } : old));
    }
  };

  const syncVisualUpdate = (key: keyof DashboardVisual, value: any) => {
    if (!selectedId || !dataset) return;
    const v = visuals.find(v => v.id === selectedId);
    if (!v) return;

    // Reactively update the specific node and trigger spin
    const nextV = { ...v, [key]: value, loading: true, error: undefined };
    setVisuals(prev => prev.map(p => p.id === selectedId ? nextV : p));
    
    // Auto query backend on any change
    fetchVisualData(selectedId, nextV, dataset);
  };

  const addVisual = () => {
    const defaultX = categoricalCols[0] || columns[0] || '';
    const defaultY = numericCols[0] || columns[1] || '';
    const id = Date.now().toString();
    const newV: DashboardVisual = { id, type: 'bar', title: 'Custom Visual', xCol: defaultX, yCol: defaultY, agg: 'sum', data: [], loading: true };
    setVisuals(prev => [...prev, newV]);
    setSelectedId(id);
    fetchVisualData(id, newV, dataset!);
  };

  const removeVisual = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisuals(prev => prev.filter(v => v.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center">
        <LayoutGrid size={48} className="text-gray-300 mb-2" />
        <h2 className="text-2xl font-bold">Intelligent Dashboard</h2>
        <p className="text-gray-500 max-w-sm">Upload a dataset, and we'll instantly generate a stunning, professional analytics dashboard for you.</p>
      </div>
    );
  }

  const selectedVisual = visuals.find(v => v.id === selectedId);

  return (
    <div className="relative min-h-[calc(100vh-theme(spacing.24))] max-w-[1600px] mx-auto overflow-hidden rounded-3xl group">
      
      {/* HEADER OVERLAY */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pointer-events-none">
         <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-2">
              <Sparkles className="text-blue-500" /> Executive Analytics
            </h1>
            <p className="text-gray-500 font-medium ml-8 text-sm">{dataset}</p>
         </div>
      </div>

      {/* FULL WIDTH IMMERSIVE CANVAS */}
      <div className="w-full h-full pt-24 pb-20 px-6 xl:px-10 overflow-y-auto overflow-x-hidden relative">
        {isInitializing ? (
           <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="font-medium animate-pulse">Running AI Auto-Discovery...</p>
           </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
            <AnimatePresence>
              {visuals.map((v, i) => (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                  className={`
                    relative bg-white dark:bg-[#1a1a1c] rounded-[2rem] border border-[#e2e8f0] dark:border-[#27272a] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]
                    overflow-hidden group/card transition-all duration-300
                    ${selectedId === v.id ? 'ring-2 ring-blue-500/50 shadow-xl dark:shadow-blue-500/10 scale-[1.01]' : 'hover:border-blue-300/50 hover:shadow-lg'}
                  `}
                  onClick={() => setSelectedId(v.id)}
                >
                  {/* Card Header */}
                  <div className="px-8 py-5 flex justify-between items-center bg-transparent relative z-10">
                    <div className="flex flex-col">
                       <h3 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight bg-transparent border-none focus:outline-none">{v.title}</h3>
                       <p className="text-xs text-gray-400 font-medium tracking-wide uppercase opacity-70 mt-0.5">
                         {v.type === 'forecast' ? 'AI Projection' : `${v.yCol} by ${v.xCol}`}
                       </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setSelectedId(v.id); }} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 opacity-0 group-hover/card:opacity-100 hover:bg-blue-100 transition-all font-medium text-xs flex items-center gap-1.5">
                         <Edit3 size={14}/> Edit
                       </button>
                       <button onClick={(e) => removeVisual(v.id, e)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover/card:opacity-100">
                         <X size={16} />
                       </button>
                    </div>
                  </div>

                  {/* Card Chart Body */}
                  <div className="p-6 h-[350px] flex justify-center items-center relative">
                    {v.loading ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-[#1a1a1c]/50 backdrop-blur-sm z-20">
                          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                       </div>
                    ) : v.error ? (
                       <div className="text-red-500 text-sm font-medium opacity-80">{v.error}</div>
                    ) : (
                       <RenderChart widget={v} />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Blank Canvas State */}
            {visuals.length === 0 && (
               <div className="xl:col-span-2 py-32 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] bg-white/20 dark:bg-zinc-900/20">
                 <Settings2 size={48} className="mb-4 opacity-30" />
                 <p className="font-medium text-lg">No visuals on the board.</p>
                 <button onClick={addVisual} className="mt-6 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-xl transition-all hover:scale-105 shadow-md">Add A Custom Chart</button>
               </div>
            )}
          </motion.div>
        )}
      </div>

      {/* FAB - Add Chart Container */}
      <div className="absolute bottom-10 right-10 z-30">
         <button onClick={addVisual} className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-[0_10px_40px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_50px_rgba(59,130,246,0.6)] hover:-translate-y-1 transition-all group font-semibold tracking-wide">
           <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Add Metric
         </button>
      </div>

      {/* SLIDING RIGHT EDIT PANE */}
      <AnimatePresence>
        {selectedVisual && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedId(null)} className="absolute inset-0 bg-black/5 dark:bg-black/20 backdrop-blur-[2px] z-40" />
            <motion.div 
              initial={{ x: 400, opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }} 
              animate={{ x: 0, opacity: 1, boxShadow: '-20px 0 50px rgba(0,0,0,0.1)' }} 
              exit={{ x: 400, opacity: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[400px] z-50 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-3xl border-l border-white/20 dark:border-white/5 flex flex-col"
            >
              <div className="px-8 py-8 flex justify-between items-center border-b border-gray-100 dark:border-gray-800/50">
                 <div>
                   <h3 className="font-bold text-xl tracking-tight">Modify Chart</h3>
                   <p className="text-gray-500 text-sm mt-1">Live updates mapped to canvas</p>
                 </div>
                 <button onClick={() => setSelectedId(null)} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-white border border-transparent dark:hover:border-gray-700"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Title */}
                <div className="space-y-2">
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Visual Title</label>
                   <input type="text" value={selectedVisual.title} onChange={(e) => syncVisualUpdate('title', e.target.value)}
                     className="w-full text-base font-medium px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm" />
                </div>

                {/* Chart Type Config */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Chart Rendering Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {CHART_TYPES.map(ct => (
                      <button key={ct.id} onClick={() => syncVisualUpdate('type', ct.id)} title={ct.label}
                        className={`aspect-square flex items-center justify-center rounded-xl border transition-all duration-200 
                          ${selectedVisual.type === ct.id ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:border-blue-400 hover:text-blue-500'}
                        `}>
                        {ct.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Axes Bindings */}
                <div className="space-y-5 p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500">X-Axis (Category / Plot)</label>
                    <select value={selectedVisual.xCol} onChange={e => syncVisualUpdate('xCol', e.target.value)}
                      className="w-full text-sm font-medium px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500">Y-Axis (Target Value)</label>
                    <select value={selectedVisual.yCol} onChange={e => syncVisualUpdate('yCol', e.target.value)}
                      className="w-full text-sm font-medium px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-xs font-bold text-gray-500">Aggregation Methodology</label>
                     <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl">
                       {AGG_TYPES.map(a => (
                         <button key={a} onClick={() => syncVisualUpdate('agg', a)}
                           className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${selectedVisual.agg === a ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                           {a}
                         </button>
                       ))}
                     </div>
                  </div>
                </div>

                {/* Footer indication */}
                <div className="pt-4 text-center">
                   <p className="text-xs text-gray-400">Settings automatically sync to the dashboard canvas.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Extracted stateless pure renderer
const RenderChart = ({ widget }: { widget: DashboardVisual }) => {
  const commonProps = { data: widget.data, margin: widget.type !== 'pie' ? { top: 10, right: 10, left: -20, bottom: 0 } : undefined };
  const axisStyle = { tick: { fill: '#94a3b8', fontSize: 11, fontWeight: 500 }, axisLine: { stroke: 'rgba(148,163,184,0.2)' }, tickLine: false };
  const gridStyle = { strokeDasharray: '3 3', vertical: false, stroke: 'rgba(148,163,184,0.1)' };
  const tipStyle = { contentStyle: { borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', backdropFilter: 'blur(8px)', padding: '12px 16px' }, itemStyle: { fontWeight: 600, color: '#333' } };

  switch (widget.type) {
    case 'forecast':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} minTickGap={20} tickFormatter={(val) => {
              try { const d = new Date(val); return isNaN(d.getTime()) ? val : `${d.getMonth()+1}/${d.getDate()}`; } catch { return val; } 
            }} />
            <YAxis {...axisStyle} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(0)}k` : val} />
            <Tooltip {...tipStyle} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
            <Line type="monotone" name="Historical" dataKey="actual" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 7 }} />
            <Line type="monotone" name="AI Forecast" dataKey="predicted" stroke="#f59e0b" strokeWidth={3} strokeDasharray="6 6" dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={widget.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="85%" paddingAngle={3} label={false}>
              {widget.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2}/>)}
            </Pie>
            <Tooltip {...tipStyle} />
            <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} minTickGap={20} />
            <YAxis {...axisStyle} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(0)}k` : val} />
            <Tooltip {...tipStyle} />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3.5} dot={{ fill: '#white', stroke: '#10b981', strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: '#059669' }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'area':
      const gradId = `areaGrad-${widget.id}`;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4338ca" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} minTickGap={20} />
            <YAxis {...axisStyle} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(0)}k` : val} />
            <Tooltip {...tipStyle} />
            <Area type="monotone" dataKey="value" stroke="#4338ca" strokeWidth={3} fill={`url(#${gradId})`} />
          </AreaChart>
        </ResponsiveContainer>
      );
    default:
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} minTickGap={20} />
            <YAxis {...axisStyle} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(0)}k` : val} />
            <Tooltip {...tipStyle} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {widget.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
  }
};
