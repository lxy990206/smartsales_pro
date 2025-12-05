export enum TimeRange {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  stock: number;
  lastUpdated: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleRecord {
  id: string;
  timestamp: string; // ISO date string
  items: {
    productId: string;
    productName: string;
    quantity: number;
    costAtTime: number;
  }[];
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  note?: string;
}

export interface DashboardStats {
  revenue: number;
  profit: number;
  cost: number;
  margin: number;
  salesCount: number;
}

export interface DbConfig {
  type: 'sqlite' | 'mysql';
  host?: string;
  user?: string;
  password?: string;
  database?: string;
  connected: boolean;
  // Security & Connection Settings
  connectionMode: 'direct' | 'proxy';
  proxyUrl?: string;
}