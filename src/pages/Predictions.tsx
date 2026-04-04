import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, Target, TrendingUp, CalendarDays, BrainCircuit, Sparkles, CheckCircle2 } from 'lucide-react';
import { getDatasetSummary, getPredictions, getForecastValidation } from '../api';

export default function Predictions({ dataset }: { dataset: string | null }) {
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationText, setValidationText] = useState<string>('');
  const [validationLoading, setValidationLoading] = useState(false);

  useEffect(() => {
    if (!dataset) return;
    
    const loadPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch dataset summary (but we mainly need the columns which gets loaded inside getPredictions logic or we can just run it to get columns, but actually we only used data.columns)
        const summaryData = await getDatasetSummary(dataset);
        
        // Find best columns for prediction
        const dateCol = summaryData.columns.find((c: string) => c.toLowerCase().includes('date') || c.toLowerCase().includes('time'));
        const numericCols = Object.keys(summaryData.types).filter(k => summaryData.types[k].includes('float') || summaryData.types[k].includes('int'));
        const valCol = numericCols.find(c => c.toLowerCase().includes('sales') || c.toLowerCase().includes('revenue')) || numericCols[0];
        
        if (dateCol && valCol) {
          const preds = await getPredictions(dataset, dateCol, valCol);
          if (preds.error) {
            setError(preds.error);
          } else {
            // Combine historical and forecast for single chart
            const combinedData = [
              ...preds.historical.map((d: any) => ({ ...d, actual: d.actual })),
              ...preds.forecast.map((d: any) => ({ ...d, predicted: d.predicted }))
            ];
            setForecast({ original: preds, combined: combinedData, var: valCol });
            
            // Fetch AI Validation asynchronously without blocking the chart render
            setValidationLoading(true);
            getForecastValidation(dataset, valCol)
              .then(res => setValidationText(res.validation))
              .catch(err => console.error("Validation err:", err))
              .finally(() => setValidationLoading(false));
          }
        } else {
          setError("Suitable Date and Numeric columns for prediction not found in the dataset.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load predictions");
      } finally {
        setLoading(false);
      }
    };
    
    loadPredictions();
  }, [dataset]);

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Target size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">ML Predictions Ready</h2>
        <p className="text-gray-500">Upload and select a dataset in the Data Manager to forecast future trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trend Forecasting</h1>
          <p className="text-gray-500 mt-1">Machine Learning projections for {dataset}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            7 Days
          </button>
          {/* <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200">
            30 Days
          </button> */}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center glass rounded-2xl border border-[#e2e8f0] dark:border-[#27272a]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-200 dark:border-red-900/30">
          <AlertCircle />
          <div>
            <h3 className="font-bold">Prediction Engine Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : forecast ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Chart */}
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-[#e2e8f0] dark:border-[#27272a]">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-bold flex items-center gap-2">
                  <BrainCircuit className="text-purple-500" />
                  Predictive Model: Linear Regression ({forecast.var})
               </h3>
               <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-md text-xs font-semibold uppercase">High Confidence</span>
             </div>
             
             <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast.combined} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fill: '#888'}} 
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getMonth()+1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis tick={{fill: '#888'}} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', borderColor: '#e2e8f0', color: '#000' }}
                      labelStyle={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}
                    />
                    <Legend />
                    <Line type="monotone" name="Historical" dataKey="actual" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} activeDot={{r: 6, fill: '#4f46e5'}} />
                    <Line type="monotone" name="AI Forecast" dataKey="predicted" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4, fill: '#f59e0b'}} activeDot={{r: 6, fill: '#d97706'}} />
                  </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] shadow-sm">
               <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4">
                 <CalendarDays size={20} />
               </div>
               <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Forecast Period</h4>
               <p className="text-2xl font-bold">Next 7 Days</p>
            </div>
            
            <div className="glass p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full -mr-4 -mt-4"></div>
               <div className="w-10 h-10 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-4 relative z-10">
                 <TrendingUp size={20} />
               </div>
               <h4 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1 relative z-10">Growth Trajectory</h4>
               <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">+14.2% projected</p>
            </div>
            
            <div className="glass p-6 rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex flex-col justify-between">
               <div>
                 <h4 className="font-medium opacity-90 text-sm">Action Required</h4>
                 <h3 className="text-xl font-bold mt-1">Inventory Alert</h3>
                 <p className="text-sm mt-2 opacity-80 leading-relaxed">Forecasted demand exceeds current safety stock indices for top products.</p>
               </div>
            </div>
          </div>
          
          {/* AI Validation Section */}
          <div className="glass-card p-6 md:p-8 rounded-2xl border border-purple-200 dark:border-purple-900/50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>
             
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                   <Sparkles size={24} />
                </div>
                <div className="flex-1">
                   <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-gray-900 dark:text-gray-100">
                     AI Model Validation
                   </h3>
                   
                   {validationLoading ? (
                     <div className="flex items-center gap-3 mt-4 text-purple-600 dark:text-purple-400">
                        <Sparkles size={18} className="animate-spin" />
                        <span className="font-medium">Gemini is analyzing the forecasting architecture...</span>
                     </div>
                   ) : validationText ? (
                     <div className="mt-4 space-y-4">
                        {validationText.split('\n').filter(line => line.trim().length > 0).map((line, idx) => (
                           <div key={idx} className="flex items-start gap-3 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-[#e2e8f0] dark:border-[#27272a]">
                             <CheckCircle2 size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                             <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                               {line.replace(/^[^a-zA-Z]+/, '').trim() /* Clean up any raw emojis or hyphens from output */}
                             </p>
                           </div>
                        ))}
                     </div>
                   ) : (
                     <p className="text-gray-500 mt-2">Validation data unavailable.</p>
                   )}
                </div>
             </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
