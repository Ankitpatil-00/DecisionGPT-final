import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { getDatasetSummary, getDatasetInsights } from '../api';

export default function Insights({ dataset }: { dataset: string | null }) {
  const navigate = useNavigate();
  const [llmInsights, setLlmInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLLM, setLoadingLLM] = useState(false);

  useEffect(() => {
    if (!dataset) return;
    
    const loadData = async () => {
      setLoading(true);
      setLoadingLLM(true);
      try {
        await getDatasetSummary(dataset);
        setLoading(false);
        
        // Fetch LLM Insights concurrently after summary loads
        const insightsData = await getDatasetInsights(dataset);
        setLlmInsights(Array.isArray(insightsData) ? insightsData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingLLM(false);
      }
    };
    
    loadData();
  }, [dataset]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (!dataset || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
        ) : (
          <BrainCircuit size={48} className="text-gray-300 mb-4" />
        )}
        <h2 className="text-2xl font-bold mb-2">{loading ? "AI is Analyzing Data..." : "No Dataset Selected"}</h2>
        <p className="text-gray-500">Upload a dataset to generate automated AI insights.</p>
      </div>
    );
  }

  // Dynamic LLM Insights used instead of predefined ones

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
            Smart AI Insights
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Automated analysis of {dataset}</p>
        </div>
        <div className={`px-4 py-2 ${loadingLLM ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200' : 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200'} rounded-full text-sm font-semibold flex items-center gap-2 border dark:border-opacity-50`}>
          {loadingLLM ? (
            <><Sparkles className="animate-spin" size={16} /> Generating AI Insights...</>
          ) : (
            <><BrainCircuit size={16} /> Analysis Complete</>
          )}
        </div>
      </div>

      {!loadingLLM && llmInsights.length > 0 && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {llmInsights.map((insight, idx) => (
            <InsightCard key={idx} data={insight} variants={item} />
          ))}
        </motion.div>
      )}
      
      {!loadingLLM && llmInsights.length === 0 && (
         <div className="p-8 text-center glass rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
           <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
           <p className="text-gray-500">Failed to generate dynamic insights. Try uploading the dataset again.</p>
         </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 glass rounded-2xl p-8 border border-[#e2e8f0] dark:border-[#27272a] text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center rotate-3 shadow-lg">
          <BrainCircuit className="text-white" size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2">Want to dive deeper?</h3>
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">Use the AI Chat Assistant to ask custom questions about these findings or generate specific charts based on the dataset.</p>
        <button onClick={() => navigate('/chat')} className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium shadow-md hover:shadow-xl transition-shadow">
          Open AI Chat Assistant
        </button>
      </motion.div>
    </div>
  );
}

function InsightCard({ data, variants }: any) {
  const getGradient = () => {
    const typeLower = (data.type || '').toLowerCase();
    if (typeLower.includes('opportunity')) return 'from-emerald-500/10 to-transparent border-emerald-500/20';
    if (typeLower.includes('observation')) return 'from-blue-500/10 to-transparent border-blue-500/20';
    if (typeLower.includes('recommend')) return 'from-purple-500/10 to-transparent border-purple-500/20';
    if (typeLower.includes('alert') || typeLower.includes('warning')) return 'from-amber-500/10 to-transparent border-amber-500/20';
    return 'from-gray-500/10 to-transparent border-gray-500/20';
  };

  const getIcon = () => {
    const typeLower = (data.type || '').toLowerCase();
    if (typeLower.includes('opportunity')) return <Target className="text-emerald-500" />;
    if (typeLower.includes('observation')) return <TrendingUp className="text-blue-500" />;
    if (typeLower.includes('recommend')) return <Lightbulb className="text-purple-500" />;
    if (typeLower.includes('alert') || typeLower.includes('warning')) return <AlertTriangle className="text-amber-500" />;
    return <Sparkles className="text-blue-500" />;
  };

  return (
    <motion.div variants={variants} className={`glass-card rounded-2xl p-6 border ${getGradient()} relative overflow-hidden group hover:shadow-lg transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white dark:bg-black/30 rounded-xl shadow-sm z-10">
          {getIcon()}
        </div>
        <div className="flex flex-col items-end z-10">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{data.type}</span>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white/60 dark:bg-black/40 rounded-full border border-gray-200 dark:border-gray-800 text-xs font-medium backdrop-blur-md">
            Confidence: <span className={data.confidence > 90 ? 'text-emerald-500' : 'text-blue-500'}>{data.confidence}%</span>
          </div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold mb-2 relative z-10 group-hover:text-primary transition-colors">{data.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed relative z-10">
        {data.desc}
      </p>

      {/* Background decoration */}
      <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-150 transition-transform duration-700 pointer-events-none">
         {getIcon()}
      </div>
    </motion.div>
  );
}
