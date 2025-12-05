import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { DbConfig } from '../types';
import { Database, Server, Save, CheckCircle2, AlertCircle, Lock, ShieldCheck, Key, Globe, Network } from 'lucide-react';

export const Settings: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Config State
  const [config, setConfig] = useState<DbConfig>({
    type: 'sqlite',
    host: 'localhost',
    user: 'root',
    database: 'sales_db',
    connected: false,
    connectionMode: 'direct',
    proxyUrl: ''
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Environment Check
  const hasEnvKey = !!process.env.API_KEY;

  useEffect(() => {
    // Check for existing session
    const sessionAuth = sessionStorage.getItem('admin_auth');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }

    const saved = dbService.getConfig();
    setConfig(saved);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setError('');
    } else {
      setError('密码错误。(默认: admin)');
    }
  };

  const handleSave = () => {
    setStatus('saving');
    // Simulate connection check
    setTimeout(() => {
      const newConfig = { ...config, connected: true };
      dbService.saveConfig(newConfig);
      setConfig(newConfig);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10 md:mt-20 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">访问受限</h2>
          <p className="text-slate-500 mb-8">系统配置需要管理员权限。</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">管理员密码</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="请输入密码..."
                autoFocus
              />
              {error && (
                <p className="text-rose-500 text-sm mt-2 flex items-center gap-1 animate-pulse">
                  <AlertCircle size={14}/> {error}
                </p>
              )}
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              验证身份
            </button>
          </form>
          <p className="text-xs text-slate-300 mt-6">演示密码: admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">管理员控制台</h2>
          <p className="text-slate-500">系统配置与安全参数管理。</p>
        </div>
        <button 
          onClick={() => {
            setIsAuthenticated(false);
            sessionStorage.removeItem('admin_auth');
          }}
          className="text-sm px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* Security & AI Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <ShieldCheck className="text-emerald-600" />
          <h3 className="font-bold text-slate-800">安全与 AI 服务</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* API Key Status - Purely Informational, no input field to prevent leaks */}
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${hasEnvKey ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
            <Key className="flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-sm">Gemini API Key 状态</h4>
              <p className="text-sm mt-1">
                {hasEnvKey 
                  ? "已从服务器环境变量 (process.env.API_KEY) 安全加载。" 
                  : "未在环境变量中找到 API Key。"}
              </p>
              {!hasEnvKey && (
                <p className="text-xs mt-2 opacity-80">
                  <strong>安全提示：</strong> 为防止泄漏，请勿在代码中硬编码密钥。请在您的托管平台（如 Vercel/Netlify/Docker）的环境变量设置中配置 <code>API_KEY</code>。
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
             <label className="block text-sm font-semibold text-slate-700">连接架构模式</label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setConfig({...config, connectionMode: 'direct'})}
                  className={`p-4 border rounded-xl text-left transition-all ${config.connectionMode === 'direct' ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                   <div className="flex items-center gap-2 mb-2">
                     <Globe size={18} className={config.connectionMode === 'direct' ? 'text-indigo-600' : 'text-slate-400'}/>
                     <span className={`font-bold ${config.connectionMode === 'direct' ? 'text-indigo-700' : 'text-slate-600'}`}>直连模式 (Direct)</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed">
                     浏览器直接与 Google API 通信。仅建议用于开发或内部工具。需要在构建时注入 <code>API_KEY</code>。
                   </p>
                </button>

                <button 
                  onClick={() => setConfig({...config, connectionMode: 'proxy'})}
                  className={`p-4 border rounded-xl text-left transition-all ${config.connectionMode === 'proxy' ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                   <div className="flex items-center gap-2 mb-2">
                     <Network size={18} className={config.connectionMode === 'proxy' ? 'text-indigo-600' : 'text-slate-400'}/>
                     <span className={`font-bold ${config.connectionMode === 'proxy' ? 'text-indigo-700' : 'text-slate-600'}`}>后端代理 (安全)</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed">
                     请求通过您自己的安全服务器路由。对浏览器隐藏 API Key。生产环境推荐使用。
                   </p>
                </button>
             </div>

             {config.connectionMode === 'proxy' && (
               <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                 <label className="text-xs font-bold text-slate-500 uppercase">代理服务端点 URL</label>
                 <div className="relative mt-1">
                    <Globe size={16} className="absolute left-3 top-3 text-slate-400"/>
                    <input 
                      type="text" 
                      placeholder="https://api.yourcompany.com/v1/analyze" 
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={config.proxyUrl}
                      onChange={(e) => setConfig({...config, proxyUrl: e.target.value})}
                    />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1">应用将把销售数据 POST 到此 URL，而不是直接调用 Gemini。</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Database Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Database className="text-indigo-600" />
          <h3 className="font-bold text-slate-800">数据库连接</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">数据库引擎</label>
              <div className="flex gap-4">
                <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center justify-center gap-2 transition-all ${config.type === 'sqlite' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="dbtype" className="hidden" 
                    checked={config.type === 'sqlite'} onChange={() => setConfig({...config, type: 'sqlite'})} />
                  SQLite
                </label>
                <label className={`flex-1 cursor-pointer border rounded-lg p-4 flex items-center justify-center gap-2 transition-all ${config.type === 'mysql' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                   <input type="radio" name="dbtype" className="hidden" 
                    checked={config.type === 'mysql'} onChange={() => setConfig({...config, type: 'mysql'})} />
                  MySQL
                </label>
              </div>
            </div>

            {config.type === 'mysql' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">主机 (Host)</label>
                  <div className="relative">
                    <Server size={16} className="absolute left-3 top-3 text-slate-400"/>
                    <input type="text" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={config.host} onChange={e => setConfig({...config, host: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">用户 (User)</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={config.user} onChange={e => setConfig({...config, user: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">密码 (Password)</label>
                  <input type="password" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                     placeholder="••••••••" onChange={e => setConfig({...config, password: e.target.value})} />
                </div>
              </>
            )}

            <div className={`${config.type === 'mysql' ? '' : 'col-span-2'} space-y-1`}>
               <label className="text-xs font-bold text-slate-500 uppercase">数据库名称 / 文件路径</label>
               <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={config.database} onChange={e => setConfig({...config, database: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${config.connected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
             <span className="text-sm text-slate-600 font-medium">{config.connected ? '系统已连接' : '未连接'}</span>
          </div>
          <button 
            onClick={handleSave}
            disabled={status === 'saving'}
            className={`px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition-all shadow-md hover:shadow-lg ${status === 'success' ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {status === 'saving' ? '正在应用设置...' : status === 'success' ? '配置已保存！' : '保存配置'}
            {status === 'success' ? <CheckCircle2 size={18}/> : <Save size={18}/>}
          </button>
      </div>
    </div>
  );
};