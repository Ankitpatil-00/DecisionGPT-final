import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Database, ArrowRight } from 'lucide-react';
import { uploadDataset, getDatasets, getDatasetSummary } from '../api';

export default function DataManager({ activeDataset, setActiveDataset }: { activeDataset: string | null, setActiveDataset: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchDatasets = async () => {
    try {
      const data = await getDatasets();
      setDatasets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (activeDataset) {
      loadPreview(activeDataset);
    }
  }, [activeDataset]);

  const loadPreview = async (id: string) => {
    try {
      const data = await getDatasetSummary(id);
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Only CSV files are supported");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const res = await uploadDataset(file);
      setSuccess(true);
      fetchDatasets();
      setActiveDataset(res.dataset_id);
      setFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Manager</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Upload and manage your business datasets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 glass-card rounded-2xl p-6 border border-[#e2e8f0] dark:border-[#27272a] h-fit"
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <UploadCloud className="text-blue-500" /> Upload New Data
          </h3>
          
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 ${file ? 'border-primary bg-blue-50/50 dark:bg-blue-900/20' : 'border-[#e2e8f0] dark:border-[#27272a]'}`}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              id="file-upload" 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setError(null);
                }
              }}
            />
            
            <div className="w-16 h-16 mx-auto mb-4 bg-white dark:bg-black/50 rounded-full flex items-center justify-center shadow-sm">
              <FileSpreadsheet size={32} className={file ? "text-primary" : "text-gray-400"} />
            </div>
            
            {file ? (
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Drag & drop a CSV file here</p>
                <p className="text-sm text-gray-400 mt-2">or click to browse</p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> Dataset successfully analyzed & saved!
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full mt-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              !file 
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
                 : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30'
            }`}
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Database size={18} />}
            {loading ? 'Processing Data...' : 'Process Dataset'}
          </button>
        </motion.div>

        {/* Existing Datasets & Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Active Dataset Stats */}
          {activeDataset && previewData && (
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8" />
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" /> Active Dataset Analyzed
              </h3>
              <div className="grid grid-cols-3 gap-6 mt-6">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Rows Detected</p>
                  <p className="text-2xl font-bold">{previewData.metrics?.total_transactions}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Columns</p>
                  <p className="text-2xl font-bold">{previewData.columns?.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Data Types</p>
                  <p className="text-sm font-medium mt-1 truncate">
                    {Object.values(previewData.types).slice(0, 3).join(', ')}...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Database List */}
          <div className="glass rounded-2xl p-6 border border-[#e2e8f0] dark:border-[#27272a]">
            <h3 className="font-semibold text-lg mb-4">Stored Datasets</h3>
            
            {datasets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database size={32} className="mx-auto mb-3 opacity-20" />
                <p>No datasets available. Upload your first CSV to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {datasets.map((ds) => (
                  <div 
                    key={ds.id} 
                    className={`flex items-center justify-between p-4 rounded-xl transition-all border ${
                      activeDataset === ds.id 
                        ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-500/30' 
                        : 'border-[#e2e8f0] dark:border-[#27272a] hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${activeDataset === ds.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-sm md:text-base">{ds.id}</p>
                        <p className="text-xs text-gray-500 flex gap-3 mt-1">
                          <span>{ds.rows} Rows</span>
                          <span>{ds.columns.length} Columns</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeDataset !== ds.id ? (
                        <button 
                          onClick={() => setActiveDataset(ds.id)}
                          className="px-4 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
                        >
                          Select
                        </button>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full dark:bg-emerald-500/20 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Data Preview Table */}
          {activeDataset && previewData && previewData.preview && (
            <div className="glass rounded-2xl border border-[#e2e8f0] dark:border-[#27272a] overflow-hidden">
               <div className="p-4 border-b border-[#e2e8f0] dark:border-[#27272a] flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                 <h3 className="font-semibold flex items-center gap-2">
                   Data Preview <span className="text-xs font-normal text-gray-500">(Top 10 rows)</span>
                 </h3>
                 <button className="text-sm text-primary flex items-center hover:underline">
                    View Full Table <ArrowRight size={14} className="ml-1" />
                 </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50/80 dark:bg-gray-800/50 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-[#e2e8f0] dark:border-[#27272a]">
                     <tr>
                       {previewData.columns.slice(0, 8).map((col: string) => (
                         <th key={col} className="px-4 py-3 font-medium tracking-wider">{col}</th>
                       ))}
                       {previewData.columns.length > 8 && <th className="px-4 py-3">...</th>}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#27272a]">
                     {previewData.preview.map((row: any, i: number) => (
                       <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                         {previewData.columns.slice(0, 8).map((col: string) => (
                           <td key={`${i}-${col}`} className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                             {row[col] !== null && row[col] !== undefined 
                                ? (typeof row[col] === 'number' && row[col] % 1 !== 0 
                                    ? row[col].toFixed(2) 
                                    : String(row[col]).substring(0, 20) + (String(row[col]).length > 20 ? '...' : ''))
                                : '-'}
                           </td>
                         ))}
                         {previewData.columns.length > 8 && <td className="px-4 py-3 text-gray-400">...</td>}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
