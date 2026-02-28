import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.status(200).json({
    totalProducts: 120,
    totalSales: 450000,
    totalCustomers: 85,
    totalSuppliers: 12
  });
}