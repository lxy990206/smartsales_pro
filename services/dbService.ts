import { Product, SaleRecord, DbConfig } from '../types';

// In a real scenario, this would communicate with a Node.js backend connecting to SQLite/MySQL.
// For this Web UI demo, we use LocalStorage to simulate persistence so the app is functional.

const STORAGE_KEYS = {
  PRODUCTS: 'smartsales_products',
  SALES: 'smartsales_sales',
  CONFIG: 'smartsales_db_config',
};

// Seed data
const initialProducts: Product[] = [
  { id: '1', name: '无线静音鼠标', sku: 'WM-001', category: '数码配件', costPrice: 15.50, stock: 45, lastUpdated: new Date().toISOString() },
  { id: '2', name: '机械键盘 (红轴)', sku: 'KB-102', category: '数码配件', costPrice: 45.00, stock: 20, lastUpdated: new Date().toISOString() },
  { id: '3', name: '24寸护眼显示器', sku: 'MN-200', category: '电子产品', costPrice: 120.00, stock: 8, lastUpdated: new Date().toISOString() },
  { id: '4', name: 'USB-C 快充线', sku: 'CB-050', category: '线材', costPrice: 2.50, stock: 100, lastUpdated: new Date().toISOString() },
];

export const dbService = {
  // Config
  getConfig: (): DbConfig => {
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return stored ? JSON.parse(stored) : { 
      type: 'sqlite', 
      connected: true, 
      database: 'sales_db.sqlite',
      connectionMode: 'direct',
      proxyUrl: 'https://api.yourdomain.com/v1/analyze'
    };
  },

  saveConfig: (config: DbConfig): void => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
      return initialProducts;
    }
    return JSON.parse(stored);
  },

  saveProduct: async (product: Product): Promise<void> => {
    const products = await dbService.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  deleteProduct: async (id: string): Promise<void> => {
    const products = await dbService.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
  },

  updateStock: async (productId: string, quantityChange: number): Promise<void> => {
    const products = await dbService.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.stock -= quantityChange; // reduce stock for sales
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }
  },

  // Sales
  getSales: async (): Promise<SaleRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const stored = localStorage.getItem(STORAGE_KEYS.SALES);
    return stored ? JSON.parse(stored) : [];
  },

  addSale: async (sale: SaleRecord): Promise<void> => {
    const sales = await dbService.getSales();
    sales.push(sale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    
    // Update stock for each item
    for (const item of sale.items) {
      await dbService.updateStock(item.productId, item.quantity);
    }
  }
};