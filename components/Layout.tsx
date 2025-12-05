import React from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Package, 
  Settings, 
  BarChart3
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: '销售仪表盘', icon: LayoutDashboard },
    { id: 'sales', label: '销售计算器', icon: Calculator },
    { id: 'inventory', label: '库存管理', icon: Package },
    { id: 'settings', label: '系统设置', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SmartSales</h1>
            <p className="text-xs text-slate-400">Pro Edition</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">系统状态</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-400">在线运行中</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">v1.2.0 • React + Gemini</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header (Visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 flex justify-between items-center">
         <span className="font-bold">SmartSales Pro</span>
         <button className="text-slate-300">菜单</button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:p-8 p-4 mt-12 md:mt-0">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};