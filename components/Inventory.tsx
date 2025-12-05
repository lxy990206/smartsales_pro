import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { dbService } from '../services/dbService';
import { Plus, Search, Edit2, Trash2, Save, X, AlertTriangle } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', category: '', costPrice: 0, stock: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await dbService.getProducts();
    setProducts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || '新商品',
      sku: formData.sku || 'SKU-000',
      category: formData.category || '通用',
      costPrice: Number(formData.costPrice) || 0,
      stock: Number(formData.stock) || 0,
      lastUpdated: new Date().toISOString()
    };
    
    await dbService.saveProduct(newProduct);
    await loadProducts();
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除此商品吗？此操作无法撤销。')) {
      await dbService.deleteProduct(id);
      loadProducts();
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData(product);
    } else {
      setEditingId(null);
      setFormData({ name: '', sku: '', category: '', costPrice: 0, stock: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">库存管理</h2>
          <p className="text-slate-500">管理商品库存数量与进货成本。</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          添加商品
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="搜索商品名称或编码..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="p-4">编码 (SKU)</th>
                <th className="p-4">商品名称</th>
                <th className="p-4">分类</th>
                <th className="p-4 text-right">成本价</th>
                <th className="p-4 text-right">库存</th>
                <th className="p-4 text-center">状态</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 font-mono text-xs text-slate-500">{product.sku}</td>
                  <td className="p-4 font-medium text-slate-900">{product.name}</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-slate-600">${product.costPrice.toFixed(2)}</td>
                  <td className="p-4 text-right font-mono font-medium">
                    {product.stock}
                  </td>
                  <td className="p-4 text-center">
                    {product.stock <= 5 ? (
                       <span className="inline-flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
                         <AlertTriangle size={10} /> 库存紧张
                       </span>
                    ) : (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">充足</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(product)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    未找到商品。请添加新商品开始使用。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? '编辑商品' : '新增商品'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">编码 (SKU)</label>
                  <input required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">分类</label>
                   <input className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">商品名称</label>
                <input required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">成本价 ($)</label>
                    <input type="number" step="0.01" min="0" required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">库存数量</label>
                    <input type="number" step="1" min="0" required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">取消</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm flex items-center gap-2">
                  <Save size={18} /> 保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};