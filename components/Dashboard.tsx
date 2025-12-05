import React, { useState, useEffect, useMemo } from 'react';
import { TimeRange, SaleRecord, Product } from '../types';
import { dbService } from '../services/dbService';
import { analyzeSalesData } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Bot, Calendar, Download, TrendingUp, DollarSign, Package, Edit2, Trash2, X, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeRange>(TimeRange.WEEK);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Edit Modal State
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [editFormData, setEditFormData] = useState<{revenue: number, date: string, note: string}>({ revenue: 0, date: '', note: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await dbService.getSales();
    const p = await dbService.getProducts();
    setSales(s);
    setProducts(p);
  };

  // Filter Sales based on Time Range or Custom Dates
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      
      // If custom date range is set, prioritize it
      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999); // Include the end day
        return saleDate >= start && saleDate <= end;
      }

      const now = new Date();
      switch (timeFilter) {
        case TimeRange.DAY:
          return saleDate.toDateString() === now.toDateString();
        case TimeRange.WEEK:
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return saleDate >= oneWeekAgo;
        case TimeRange.MONTH:
          return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        case TimeRange.YEAR:
          return saleDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [sales, timeFilter, dateRange]);

  // Aggregate Stats
  const stats = useMemo(() => {
    return filteredSales.reduce((acc, sale) => ({
      revenue: acc.revenue + sale.totalRevenue,
      cost: acc.cost + sale.totalCost,
      profit: acc.profit + sale.totalProfit,
      count: acc.count + 1
    }), { revenue: 0, cost: 0, profit: 0, count: 0 });
  }, [filteredSales]);

  // Chart Data Preparation (Aggregate by day/month based on filter)
  const chartData = useMemo(() => {
    const map = new Map();
    filteredSales.forEach(sale => {
      const date = new Date(sale.timestamp);
      // Simplify grouping for demo
      const key = (timeFilter === TimeRange.DAY && !dateRange.start)
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : date.toLocaleDateString();
      
      if (!map.has(key)) map.set(key, { name: key, profit: 0, revenue: 0 });
      const entry = map.get(key);
      entry.profit += sale.totalProfit;
      entry.revenue += sale.totalRevenue;
    });
    return Array.from(map.values());
  }, [filteredSales, timeFilter, dateRange]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiReport(null);
    let periodDesc = timeRangeLabels[timeFilter];
    if (dateRange.start && dateRange.end) {
      periodDesc = `${dateRange.start} 至 ${dateRange.end}`;
    }
    const report = await analyzeSalesData(filteredSales, products, periodDesc);
    setAiReport(report);
    setIsAnalyzing(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID,日期,商品详情,总成本,总营收,净利润,备注'];
    const rows = filteredSales.map(s => {
      const itemsStr = s.items.map(i => `${i.productName}(x${i.quantity})`).join('; ');
      // Escape commas in strings
      const safeItems = `"${itemsStr}"`;
      const safeNote = `"${s.note || ''}"`;
      return `${s.id},${new Date(s.timestamp).toLocaleString()},${safeItems},${s.totalCost.toFixed(2)},${s.totalRevenue.toFixed(2)},${s.totalProfit.toFixed(2)},${safeNote}`;
    });

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // Add BOM for Excel UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('确定要删除此条销售记录吗？删除后，关联的商品库存将自动恢复。')) {
      await dbService.deleteSale(id);
      loadData();
    }
  };

  const openEditModal = (sale: SaleRecord) => {
    setEditingSale(sale);
    // Convert ISO timestamp to YYYY-MM-DDTHH:MM for input[type="datetime-local"]
    const dateStr = new Date(sale.timestamp).toISOString().slice(0, 16);
    setEditFormData({
      revenue: sale.totalRevenue,
      date: dateStr,
      note: sale.note || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;

    const newProfit = editFormData.revenue - editingSale.totalCost;
    
    const updatedSale: SaleRecord = {
      ...editingSale,
      timestamp: new Date(editFormData.date).toISOString(),
      totalRevenue: editFormData.revenue,
      totalProfit: newProfit,
      note: editFormData.note
    };

    await dbService.updateSale(updatedSale);
    loadData();
    setEditingSale(null);
  };

  const timeRangeLabels: Record<TimeRange, string> = {
    [TimeRange.DAY]: '今日',
    [TimeRange.WEEK]: '本周',
    [TimeRange.MONTH]: '本月',
    [TimeRange.YEAR]: '今年',
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">销售仪表盘</h2>
          <p className="text-slate-500">业绩与财务健康状况概览。</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-xl shadow-sm border border-slate-200">
           {/* Date Range Inputs */}
           <div className="flex items-center gap-2 text-sm text-slate-600">
             <span className="font-medium whitespace-nowrap">日期范围:</span>
             <input 
               type="date" 
               className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-500"
               value={dateRange.start}
               onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
             />
             <span>至</span>
             <input 
               type="date" 
               className="border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-500"
               value={dateRange.end}
               onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
             />
             {(dateRange.start || dateRange.end) && (
               <button onClick={() => setDateRange({start:'', end:''})} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
             )}
           </div>

           <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

           {/* Quick Select */}
           <div className="flex bg-slate-100 p-1 rounded-lg">
            {Object.values(TimeRange).map(range => (
              <button
                key={range}
                onClick={() => {
                  setTimeFilter(range);
                  setDateRange({start: '', end: ''}); // Clear custom dates
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  timeFilter === range && !dateRange.start ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={20}/></div>
            <span className="text-sm font-medium text-slate-500">总营收</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">${stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20}/></div>
            <span className="text-sm font-medium text-slate-500">净利润</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">+${stats.profit.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Package size={20}/></div>
            <span className="text-sm font-medium text-slate-500">销售笔数</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Calendar size={20}/></div>
            <span className="text-sm font-medium text-slate-500">统计周期</span>
          </div>
          <p className="text-sm font-bold text-slate-800 mt-2">
            {(dateRange.start && dateRange.end) ? `${dateRange.start} ~ ${dateRange.end}` : timeRangeLabels[timeFilter]}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">营收与利润趋势</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="营收" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="profit" name="利润" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-indigo-700">
               <Bot size={24} />
               <h3 className="font-bold">AI 智能洞察</h3>
             </div>
             <button 
                onClick={handleAiAnalysis} 
                disabled={isAnalyzing}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50"
             >
               {isAnalyzing ? '分析中...' : '立即分析'}
             </button>
          </div>
          
          <div className="flex-1 bg-slate-50 rounded-lg p-4 overflow-y-auto max-h-[400px] text-sm text-slate-700 leading-relaxed border border-slate-100">
             {aiReport ? (
               <ReactMarkdown 
                components={{
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 text-slate-900" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold mt-4 mb-2 text-slate-800" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-indigo-700" {...props} />
                }}
               >
                 {aiReport}
               </ReactMarkdown>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                 <Bot size={48} className="mb-2 opacity-20"/>
                 <p>点击“立即分析”以获取基于 Gemini 模型的销售业绩洞察。</p>
                 {(dateRange.start || dateRange.end) && <p className="text-xs mt-2 text-indigo-500">将基于选定的日期范围进行分析</p>}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">近期交易</h3>
          <button 
            onClick={handleExportCSV}
            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-sm font-medium border border-slate-200 hover:border-indigo-200"
          >
            <Download size={16}/> 导出表格
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <th className="p-4">日期</th>
                <th className="p-4">商品详情</th>
                <th className="p-4 text-right">成本</th>
                <th className="p-4 text-right">营收</th>
                <th className="p-4 text-right">利润</th>
                <th className="p-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {[...filteredSales].reverse().map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 group">
                  <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(sale.timestamp).toLocaleString('zh-CN')}</td>
                  <td className="p-4 max-w-xs text-slate-800 font-medium">
                    <div className="truncate">{sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}</div>
                    {sale.note && <div className="text-xs text-slate-400 mt-1 italic">{sale.note}</div>}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-500">${sale.totalCost.toFixed(2)}</td>
                  <td className="p-4 text-right font-mono text-slate-900 font-bold">${sale.totalRevenue.toFixed(2)}</td>
                  <td className={`p-4 text-right font-mono font-bold ${sale.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {sale.totalProfit >= 0 ? '+' : ''}${sale.totalProfit.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(sale)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="编辑报表">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteSale(sale.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded" title="删除并恢复库存">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                 <tr><td colSpan={6} className="p-8 text-center text-slate-400">此时段暂无销售记录。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">编辑销售记录</h3>
              <button onClick={() => setEditingSale(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-4">
                <span className="font-semibold block mb-1">包含商品:</span>
                {editingSale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">销售时间</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={editFormData.date}
                  onChange={e => setEditFormData({...editFormData, date: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">总营收 (修改将自动更新利润)</label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input 
                    type="number" 
                    step="0.01"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" 
                    value={editFormData.revenue}
                    onChange={e => setEditFormData({...editFormData, revenue: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase">备注</label>
                 <textarea 
                   className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                   rows={2}
                   placeholder="填写退款原因、折扣说明等..."
                   value={editFormData.note}
                   onChange={e => setEditFormData({...editFormData, note: e.target.value})}
                 />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button onClick={() => setEditingSale(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">取消</button>
                <button onClick={handleSaveEdit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm flex items-center gap-2">
                  <Save size={18} /> 保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};