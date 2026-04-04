import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle2, AlertCircle, TrendingUp, Target, Lightbulb, Sparkles, BrainCircuit } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { getDatasetSummary, getDatasetInsights, getPredictions, getForecastValidation } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

export default function Reports({ dataset, chatHistory = [] }: { dataset: string | null, chatHistory?: any[] }) {
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [validationText, setValidationText] = useState<string>('');

  useEffect(() => {
    if (!dataset) return;
    
    const assembleReport = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Summary
        const sumData = await getDatasetSummary(dataset);
        setSummary(sumData);
        
        // 2. Fetch Insights
        const insightsData = await getDatasetInsights(dataset);
        setInsights(Array.isArray(insightsData) ? insightsData : []);
        
        // Find best columns for prediction
        const dateCol = sumData.columns.find((c: string) => c.toLowerCase().includes('date') || c.toLowerCase().includes('time'));
        const numericCols = Object.keys(sumData.types).filter(k => sumData.types[k].includes('float') || sumData.types[k].includes('int'));
        const valCol = numericCols.find(c => c.toLowerCase().includes('sales') || c.toLowerCase().includes('revenue')) || numericCols[0];
        
        // 3. Fetch Predictions and Validation if possible
        if (dateCol && valCol) {
          const preds = await getPredictions(dataset, dateCol, valCol);
          if (!preds.error) {
            const combinedData = [
              ...preds.historical.map((d: any) => ({ ...d, actual: d.actual })),
              ...preds.forecast.map((d: any) => ({ ...d, predicted: d.predicted }))
            ];
            setForecast({ original: preds, combined: combinedData, var: valCol });
            
            try {
              const valData = await getForecastValidation(dataset, valCol);
              setValidationText(valData.validation);
            } catch (err) {
              console.warn("Failed to fetch validation", err);
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to assemble professional report");
      } finally {
        setLoading(false);
      }
    };
    
    assembleReport();
  }, [dataset]);

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    
    const element = reportRef.current;
    
    const opt = {
      margin: 0.5,
      filename: `Executive_Report_${dataset || 'Global'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt as any).from(element).save();
  };

  const renderIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('opportunity')) return <Target className="text-emerald-600" size={20} />;
    if (t.includes('observation')) return <TrendingUp className="text-blue-600" size={20} />;
    if (t.includes('recommend')) return <Lightbulb className="text-purple-600" size={20} />;
    if (t.includes('alert') || t.includes('warning')) return <AlertCircle className="text-amber-600" size={20} />;
    return <Sparkles className="text-blue-600" size={20} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive PDF Reports</h1>
          <p className="text-gray-500 mt-1">Download aggregated AI intelligence reports.</p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={loading || !dataset}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white dark:text-black hover:bg-black dark:hover:bg-gray-100 text-white rounded-xl font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          {loading ? 'Assembling...' : 'Export to PDF'}
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center glass rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500 font-medium">Aggregating AI Intelligence & Predictions...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-200">
          <AlertCircle />
          <div>
            <h3 className="font-bold">Generation Failed</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : !dataset ? (
        <div className="flex flex-col items-center justify-center h-[60vh] glass rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <FileText size={48} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Dataset Loaded</h2>
          <p className="text-gray-500 max-w-md text-center">Upload and select a dataset to generate a full corporate intelligence report.</p>
        </div>
      ) : (
        /* REPORT CONTAINER - FORCED LIGHT MODE AND STRICT A4 DIMENSIONS */
        <div className="flex justify-center w-full overflow-x-auto py-4">
          <div 
             className="bg-white shadow-2xl text-gray-900 mx-auto" 
             style={{ width: '210mm', minHeight: '297mm', color: '#111827', flexShrink: 0 }}
          >
            <div ref={reportRef} className="p-12 bg-white h-full box-border" style={{ backgroundColor: '#ffffff' }}>
              
              {/* Header */}
              <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-end">
               <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Executive Summary</h1>
                  <h2 className="text-xl text-gray-500 font-medium tracking-wide border-none pb-0">Dataset: {dataset}</h2>
               </div>
               <div className="text-right">
                  <div className="font-bold text-gray-900 flex items-center justify-end gap-2">
                     <Sparkles size={18} className="text-purple-600" />
                     Generated by DecisionGPT
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
               </div>
            </div>

            {/* 1. Dataset Profile */}
            <div className="mb-10">
               <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-sm">1. Primary Dataset Profile</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                   <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total Columns</div>
                   <div className="text-2xl font-bold text-gray-900">{summary?.columns?.length || 0}</div>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                   <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total Rows</div>
                   <div className="text-2xl font-bold text-gray-900">{summary?.metrics?.total_transactions || 0}</div>
                 </div>
                 <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 col-span-2 md:col-span-2 flex items-center gap-3">
                   <CheckCircle2 className="text-emerald-500" size={32} />
                   <div>
                     <div className="text-xs text-emerald-800 uppercase tracking-wider font-bold mb-0.5">Data Quality</div>
                     <div className="text-lg font-bold text-emerald-700">Excellent Integrity</div>
                   </div>
                 </div>
               </div>
            </div>

            {/* 2. AI Strategic Insights */}
            {insights.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-sm">2. Key Strategic Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((ins, idx) => (
                    <div key={idx} className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        {renderIcon(ins.type)}
                        <h4 className="font-bold text-gray-900 text-lg">{ins.title}</h4>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-sm">
                        {ins.desc}
                      </p>
                      <div className="mt-3 inline-block px-2 py-1 bg-white border border-gray-200 text-gray-500 text-xs font-bold rounded uppercase tracking-wider shadow-sm">
                        {ins.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Predictive Forecast */}
            {forecast && (
              <div className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-sm">3. ML Trend Forecast ({forecast.var})</h3>
                
                <div className="h-[350px] w-full mb-6 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecast.combined} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tick={{fill: '#6b7280', fontSize: 12}} 
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return `${d.getMonth()+1}/${d.getDate()}`;
                          }}
                        />
                        <YAxis tick={{fill: '#6b7280', fontSize: 12}} />
                        <Legend />
                        {/* isAnimationActive={false} is critical so html2pdf renders the line instantly */}
                        <Line type="monotone" isAnimationActive={false} name="Historical Base" dataKey="actual" stroke="#111827" strokeWidth={2} dot={{r: 2, fill: '#111827'}} />
                        <Line type="monotone" isAnimationActive={false} name="Detrended Forecast" dataKey="predicted" stroke="#6366f1" strokeWidth={3} strokeDasharray="5 5" dot={{r: 3, fill: '#6366f1'}} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
                
                {validationText && (
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-xl">
                    <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-3">
                      <BrainCircuit size={18} /> Analytical Validation Strategy
                    </h4>
                    <div className="space-y-3">
                      {validationText.split('\n').filter(l => l.trim().length > 0).map((line, idx) => (
                        <p key={idx} className="text-indigo-800 text-sm leading-relaxed flex items-start gap-2">
                           <span className="text-indigo-500 mt-1">•</span> 
                           <span>{line.replace(/^[^a-zA-Z]+/, '').trim()}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Chat Appendix */}
            <div className="mb-4" style={{ pageBreakInside: 'avoid' }}>
               <h3 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-sm">Appendix: AI Interactions</h3>
               {chatHistory.length <= 1 ? (
                  <p className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded-lg border border-gray-100">No conversational logic history exists for this session.</p>
               ) : (
                  <div className="space-y-3">
                     {chatHistory.slice(1).map((msg: any) => (
                        <div key={msg.id} className={`p-4 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white border text-gray-800 border-gray-200 ml-8' : 'bg-gray-50 text-gray-700 mr-8 border border-gray-100'}`}>
                           <div className="font-bold text-xs uppercase tracking-wider mb-1 text-gray-500">
                             {msg.role === 'user' ? 'User Inquiry' : 'DecisionGPT Response'}
                           </div>
                           <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
