import SparklineChart from '../pages/charts/Sparkline';
import ChartJs from '../pages/charts/Chartjs';
import RechartJs from '../pages/charts/rechart';
import ApexChart from '../pages/charts/apexcharts';

export const chartsRoutes = [
    { path: '/chart-sparkline', element: <SparklineChart /> },
    { path: '/chart-chartjs', element: <ChartJs /> },
    { path: '/chart-rechart', element: <RechartJs /> },
    { path: '/chart-apexchart', element: <ApexChart /> },
];
