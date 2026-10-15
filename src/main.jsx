import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ThemeContext from './context/ThemeContext'
import { store } from './store/store.jsx'
import { Provider } from 'react-redux'
import './assets/css/autoprime-dashboard-v2.css'
import './assets/css/auth-autoprime.css'
import './assets/css/recent-orders-single-line.css'
import './assets/css/autoprime-accent-overrides.css'
import './assets/css/autoprime-finder-polish.css'
import './assets/css/autoprime-product-card-classic.css'
import './assets/css/ant-marketplace-search-fix.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeContext>
          <App />
        </ThemeContext>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
