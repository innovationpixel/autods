import CategoryTable from '../pages/ecommerce/categories/category-table';
import AddCategory from '../pages/ecommerce/categories/add-categary';
import EditCategory from '../pages/ecommerce/categories/edit-categary';
import ProductTable from '../pages/ecommerce/products/product-table';
import AddProduct from '../pages/ecommerce/products/add-product';
import EditProduct from '../pages/ecommerce/products/edit-product';
import ProductGrid from '../pages/ecommerce/shop/ecom-product-grid';
import ProductList from '../pages/ecommerce/shop/ecom-product-list';
import ProductDetail from '../pages/ecommerce/shop/ecom-product-detail';
import ProductOrder from '../pages/ecommerce/shop/ecom-product-order';
import Checkout from '../pages/ecommerce/shop/ecom-checkout';
import Invoice from '../pages/ecommerce/shop/ecom-invoice';
import Customers from '../pages/ecommerce/shop/ecom-customers';

export const ecommerceRoutes = [
    { path: '/category-table', element: <CategoryTable /> },
    { path: '/add-category', element: <AddCategory /> },
    { path: '/edit-category', element: <EditCategory /> },
    { path: '/product-table', element: <ProductTable /> },
    { path: '/add-product', element: <AddProduct /> },
    { path: '/edit-product', element: <EditProduct /> },
    { path: '/ecom-product-grid', element: <ProductGrid /> },
    { path: '/ecom-product-list', element: <ProductList /> },
    { path: '/ecom-product-detail', element: <ProductDetail /> },
    { path: '/ecom-product-order', element: <ProductOrder /> },
    { path: '/ecom-checkout', element: <Checkout /> },
    { path: '/ecom-invoice', element: <Invoice /> },
    { path: '/ecom-customers', element: <Customers /> },
];
