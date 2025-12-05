import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, SaleRecord } from '../types';
import { dbService } from '../services/dbService';
import { ShoppingCart, Plus, Minus, DollarSign, Calculator, Trash } from 'lucide-react';

export const SalesCalculator: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualRevenue, setManualRevenue] = useState<number | string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await dbService.getProducts();
    setProducts(data);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const totalCost = useMemo(() => cart.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0), [cart]);
  const revenue = Number(manualRevenue);
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const handleCompleteSale = async () => {
    if (cart.length === 0 || revenue <= 0) return;

    const sale: SaleRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        costAtTime: item.costPrice
      })),
      totalCost,
      totalRevenue: revenue,
      totalProfit: profit
    };

    await dbService.addSale(sale);
    setLastSale(sale);
    
    // Reset
    setCart([]);
    setManualRevenue('');
    loadProducts(); // Refresh stock
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-h-[calc(100vh-6rem)]">
      
      {/* Product Selector */}
      <div className="lg:col-span-2 flex flex-col gap-4 h-full">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <input 
            type="text" 
            placeholder="搜索商品添加..." 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col text-left p-3 rounded-lg border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all group bg-slate-50 hover:bg-white"
              >
                <div className="flex justify-between w-full mb-1">
                   <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                   <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">库存: {product.stock}</span>
                </div>
                <h4 className="font-semibold text-slate-800 line-clamp-1">{product.name}</h4>
                <p className="text-sm text-slate-500 mt-1">成本: ${product.costPrice.toFixed(2)}</p>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400">
                没有找到符合条件的库存商品。
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calculator / Cart Panel */}
      <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full">
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> 当前销售组合</h3>
          <span className="text-xs bg-indigo-500 px-2 py-1 rounded">{cart.length} 件商品</span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Calculator size={48} className="opacity-20" />
              <p>请添加商品以计算利润</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500">单件成本: ${item.costPrice}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 text-slate-600"><Minus size={14}/></button>
                    <span className="w-6 text-center text-sm font-mono">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 text-slate-600"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-rose-400 hover:text-rose-600"><Trash size={16}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>总成本 (COGS)</span>
            <span className="font-mono font-medium">${totalCost.toFixed(2)}</span>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase">总销售价格</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="number" 
                value={manualRevenue}
                onChange={(e) => setManualRevenue(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 text-lg font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Profit Display */}
          <div className={`p-4 rounded-lg border ${profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
             <div className="flex justify-between items-end mb-1">
               <span className={`text-sm font-semibold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>预估利润</span>
               <span className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                 {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
               </span>
             </div>
             <div className="flex justify-between text-xs opacity-75">
               <span className={profit >= 0 ? 'text-emerald-800' : 'text-rose-800'}>利润率: {margin.toFixed(1)}%</span>
             </div>
          </div>

          <button 
            disabled={cart.length === 0 || !revenue}
            onClick={handleCompleteSale}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2"
          >
            记录销售
          </button>
        </div>
      </div>
    </div>
  );
};