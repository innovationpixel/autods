import BootstrapTable from '../pages/table/BootstrapTable';
import DataTable from '../pages/table/DataTable';

export const tablesRoutes = [
    { path: '/table-bootstrap-basic', element: <BootstrapTable /> },
    { path: '/table-datatable-basic', element: <DataTable /> },
];
