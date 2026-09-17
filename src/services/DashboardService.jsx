import axiosInstance from './AxiosInstance';

// Seller dashboard summary — KPIs, sales chart, recent orders/activity, store info.
// range: "today" | "15" | "30" | "year"
export const getDashboardSummary = (range = '30') =>
    axiosInstance.get('/dashboard/summary', { params: { range } });
