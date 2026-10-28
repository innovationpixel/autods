import Markup from './routes/index';
import BrandTextNormalizer from './components/BrandTextNormalizer';
import './index2.css';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import "./assets/css/style.css"
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import "nouislider/distribute/nouislider.css";
import "react-range-slider-input/dist/style.css";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./assets/css/autoprime-theme.css";
import "./assets/css/autoprime-accent-overrides.css";
import "./assets/css/autoprime-product-card-classic.css";
import "./assets/css/autoprime-ui-fixes.css";
import "./assets/css/autoprime-dashboard-analytics-polish.css";
import "./assets/css/autoprime-order-processing-v2.css";
import "./assets/css/autoprime-order-processing-table-v2.css";
import "./assets/css/autoprime-topbar-v2.css";
import "./assets/css/autoprime-calculations-table-v2.css";
import "./assets/css/autoprime-topbar-balance-fix.css";
import "./assets/css/autoprime-returns-disputes-v2.css";
import "./assets/css/autoprime-returns-product-width-fix.css";
import "./assets/css/autoprime-sourcing-products-v2.css";
import "./assets/css/autoprime-drafts-v2.css";
import "./assets/css/autoprime-ai-studio-v2.css";
import "./assets/css/autoprime-products-table-final.css";
import "./assets/css/autoprime-orders-theme-v2.css";
import "./assets/css/autoprime-returns-table-final-fix.css";
import "./assets/css/autoprime-latest-fixes-repush.css";
import "./assets/css/autoprime-orders-final-theme.css";
import "./assets/css/autoprime-legacy-orange-cleanup.css";
import "./assets/css/autoprime-profile-settings-fix.css";
import "./assets/css/autoprime-profile-overlay-final.css";
import "./assets/css/autoprime-help-settings-layout.css";
import "./assets/css/autoprime-calculations-polish.css";
import "./assets/css/autoprime-orders-hover-actions.css";
import "./assets/css/autoprime-table-scroll-area.css";
import "./assets/css/autoprime-notifications-v2.css";

function App() {
  return (
    <>
      <BrandTextNormalizer />
      <Markup />
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;