import React, { useState, useEffect, useMemo } from 'react';
import { TimeRange, SaleRecord, Product } from '../types';
import { dbService } from '../services/dbService';
import { analyzeSalesData } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Bot, Calendar, Download, TrendingUp, DollarSign, Package } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeRange>(TimeRange.WEEK);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const s = await dbService.getSales();
    const p = await dbService.getProducts();
    setSales(s);
    setProducts(p);
  };

  // Filter Sales based on Time Range
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
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
  }, [sales, timeFilter]);

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
      const key = timeFilter === TimeRange.DAY 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : date.toLocaleDateString();
      
      if (!map.has(key)) map.set(key, { name: key, profit: 0, revenue: 0 });
      const entry = map.get(key);
      entry.profit += sale.totalProfit;
      entry.revenue += sale.totalRevenue;
    });
    return Array.from(map.values());
  }, [filteredSales, timeFilter]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiReport(null);
    const report = await analyzeSalesData(filteredSales, products, timeFilter);
    setAiReport(report);
    setIsAnalyzing(false);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">销售仪表盘</h2>
          <p className="text-slate-500">业绩与财务健康状况概览。</p>
        </div>
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
          {Object.values(TimeRange).map(range => (
            <button
              key={range}
              onClick={() => setTimeFilter(range)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeFilter === range ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {timeRangeLabels[range]}
            </button>
          ))}
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
          <p className="text-xl font-bold text-slate-800">{timeRangeLabels[timeFilter]}</p>
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
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">近期交易</h3>
          <button className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm"><Download size={16}/> 导出</button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {[...filteredSales].reverse().slice(0, 10).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-500">{new Date(sale.timestamp).toLocaleString('zh-CN')}</td>
                  <td className="p-4 max-w-xs truncate text-slate-800 font-medium">
                    {sale.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                  </td>
                  <td className="p-4 text-right font-mono text-slate-500">${sale.totalCost.toFixed(2)}</td>
                  <td className="p-4 text-right font-mono text-slate-900 font-bold">${sale.totalRevenue.toFixed(2)}</td>
                  <td className={`p-4 text-right font-mono font-bold ${sale.totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {sale.totalProfit >= 0 ? '+' : ''}${sale.totalProfit.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                 <tr><td colSpan={5} className="p-8 text-center text-slate-400">此时段暂无销售记录。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};