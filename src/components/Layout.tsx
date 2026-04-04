import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Lightbulb, 
  TrendingUp, 
  BarChart2, 
  MessageSquare,
  Settings,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ChatAssistant from './ChatAssistant';

// Helper for tailwind class merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Data Manager', icon: Database, path: '/data-manager' },
  { name: 'AI Insights', icon: Lightbulb, path: '/insights' },
  { name: 'Predictions', icon: TrendingUp, path: '/predictions' },
  { name: 'Charts & Analytics', icon: BarChart2, path: '/analytics' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode for the AI feel
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            DecisionGPT
          </div>
          <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary dark:text-primary-foreground dark:bg-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
                end={item.path === '/'}
              >
                <Icon size={18} className="transition-transform group-hover:scale-110" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full"
            >
              <MessageSquare size={18} />
              AI Chat Assistant
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors w-full">
              <Settings size={18} />
              Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/20 sticky top-0 z-30">
          <button 
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1" /> {/* Spacer */}
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 border border-border" />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in relative h-full">
            <Outlet />
          </div>
        </div>
        
        {/* Floating AI Assistant Trigger */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={cn(
            "fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 z-50 group",
            isChatOpen ? "bg-muted text-muted-foreground shadow-none" : "bg-primary text-white shadow-primary/30 hover:scale-110 hover:shadow-primary/50"
          )}
        >
          {isChatOpen ? <X size={24} /> : (
            <>
              <MessageSquare size={24} className="group-hover:animate-pulse" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full animate-pulse" />
            </>
          )}
        </button>

        <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>

    </div>
  );
}
