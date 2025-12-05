import { GoogleGenAI } from "@google/genai";
import { SaleRecord, Product } from '../types';
import { dbService } from './dbService';

// Initialize the Gemini Client
// In a production app using 'Direct' mode, the key must be in process.env.API_KEY
// In 'Proxy' mode, this client might not be used, or the key is ignored in favor of the proxy response.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSalesData = async (
  sales: SaleRecord[],
  products: Product[],
  period: string
): Promise<string> => {
  const config = dbService.getConfig();

  // Security Check: If running in proxy mode (simulated)
  if (config.connectionMode === 'proxy') {
    if (!config.proxyUrl) return "## 配置错误\n\n您启用了代理模式，但未在设置中配置代理 URL。";
    
    // In a real implementation:
    // const response = await fetch(config.proxyUrl, { method: 'POST', body: JSON.stringify({ sales, products }) });
    // return await response.text();
    
    return "## 后端代理模式\n\n请求已配置为通过以下地址路由： `" + config.proxyUrl + "`。\n\n*注意：由于这是一个静态演示，实际的代理调用是模拟的。在实际部署中，您的后端应安全地处理 API Key。*";
  }

  // Direct Mode Check
  if (!process.env.API_KEY) {
    return "## ⚠️ 安全配置缺失\n\n未在环境变量中检测到 API Key。\n\n**安全修复步骤：**\n1. 前往您的托管平台仪表盘（如 Vercel, Netlify）。\n2. 添加名为 `API_KEY` 的环境变量。\n3. 重新部署应用程序。\n\n*请勿将 Key 硬编码在源代码中。*";
  }

  // Prepare context
  const salesSummary = sales.map(s => ({
    date: s.timestamp.split('T')[0],
    revenue: s.totalRevenue,
    profit: s.totalProfit,
    items: s.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')
  }));

  const productSummary = products.map(p => ({
    name: p.name,
    stock: p.stock,
    cost: p.costPrice
  }));

  const prompt = `
    作为一名专业的商业智能AI分析专家，请分析以下时间段内的销售数据：${period}。
    
    数据背景：
    1. 库存状态：${JSON.stringify(productSummary).slice(0, 2000)}...
    2. 销售记录：${JSON.stringify(salesSummary).slice(0, 5000)}...

    请提供一份简明扼要的中文 Markdown 分析报告，必须包含以下部分：
    - **关键销售趋势**：什么卖得好？什么滞销？
    - **盈利能力分析**：利润率是否健康？有哪些高利润点？
    - **库存预警**：识别低库存或周转缓慢的商品。
    - **战略建议**：基于数据提出具体的捆绑销售建议或定价调整策略。

    请保持语气专业且具有可操作性。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "无法生成分析报告。";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "## 分析失败\n\n与 Gemini API 通信时发生错误。请检查您的网络连接或 API 配额。";
  }
};