import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  LineChart, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Settings as SettingsIcon,
  Menu,
  X,
  Moon,
  Sun,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import DataManager from './pages/DataManager';
import Insights from './pages/Insights';
import Predictions from './pages/Predictions';
import Analytics from './pages/Analytics';
import ChatAssistant, { type Message } from './pages/ChatAssistant';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
const Sidebar = ({ isOpen, toggleSidebar }: { isOpen: boolean, toggleSidebar: () => void }) => {
  const location = useLocation();
  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { title: 'Data Manager', icon: <Database size={20} />, path: '/data' },
    { title: 'AI Insights', icon: <BrainCircuit size={20} />, path: '/insights' },
    { title: 'Predictions', icon: <LineChart size={20} />, path: '/predictions' },
    { title: 'Action Center', icon: <div className="relative"><Bell size={20} /><span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span></div>, path: '/alerts' },
    { title: 'Charts & Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
    { title: 'AI Chat Panel', icon: <MessageSquare size={20} />, path: '/chat' },
    { title: 'Reports', icon: <FileText size={20} />, path: '/reports' },
    { title: 'Settings', icon: <SettingsIcon size={20} />, path: '/settings' },
  ];
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
      {/* Sidebar sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: isOpen ? 0 : -250 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="fixed lg:static top-0 left-0 z-50 h-screen w-64 glass flex flex-col border-r border-[#e2e8f0] dark:border-[#27272a] lg:transform-none"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] dark:border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BrainCircuit className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              DecisionGPT
            </span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                onClick={() => { if (window.innerWidth < 1024) toggleSidebar() }}
              >
                <div className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`}>
                  {item.icon}
                </div>
                <span className="font-medium text-sm">{item.title}</span>
                {isActive && (
                  <motion.div layoutId="activeItemIndicator" className="absolute left-0 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-[#e2e8f0] dark:border-[#27272a]">
          <div className="p-3 glass-card rounded-xl text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Workspace</p>
            <p className="text-sm font-medium">My Company Data</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
const Header = ({ toggleSidebar, toggleTheme, isDark, activeDataset }: any) => {
  return (
    <header className="h-16 glass border-b border-[#e2e8f0] dark:border-[#27272a] sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
          <Menu size={20} />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Dataset:</span>
          {activeDataset ? (
            <span className="px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-full flex items-center gap-1.5 border border-green-200 dark:border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {activeDataset.slice(0, 20)}{activeDataset.length > 20 ? '...' : ''}
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-full flex items-center gap-1.5 border border-yellow-200 dark:border-yellow-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              No Dataset Selected
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div 
          onClick={() => {
            if (window.confirm("Are you sure you want to log out?")) {
              localStorage.removeItem('auth_token');
              window.location.reload();
            }
          }}
          title="Sign out"
          className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer border-2 border-white dark:border-gray-800 hover:opacity-80 transition-opacity"
        >
          U
        </div>
      </div>
    </header>
  );
};
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('auth_token'));
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: 'Hello! I am your DecisionGPT data copilot. Ask me anything about your uploaded dataset.' }
  ]);
  useEffect(() => {
    const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkOS) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
    const saved = localStorage.getItem('activeDataset');
    if (saved) setActiveDataset(saved);
  }, []);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  const updateActiveDataset = (name: string) => {
    setActiveDataset(name);
    localStorage.setItem('activeDataset', name);
  };
  const handleLogin = (token: string) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] min-h-screen">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-[2px]">
          <Header 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            toggleTheme={toggleTheme} 
            isDark={isDark} 
            activeDataset={activeDataset}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 scroll-smooth">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard dataset={activeDataset} />} />
                <Route path="/data" element={<DataManager activeDataset={activeDataset} setActiveDataset={updateActiveDataset} />} />
                <Route path="/insights" element={<Insights dataset={activeDataset} />} />
                <Route path="/predictions" element={<Predictions dataset={activeDataset} />} />
                <Route path="/analytics" element={<Analytics dataset={activeDataset} />} />
                <Route path="/chat" element={<ChatAssistant dataset={activeDataset} messages={chatHistory} setMessages={setChatHistory} />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/reports" element={<Reports dataset={activeDataset} chatHistory={chatHistory} />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}