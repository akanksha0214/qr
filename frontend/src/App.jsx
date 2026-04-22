import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import MenuPage from './pages/MenuPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/menu/:qrCodeId" element={<MenuPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/dashboard" element={<RestaurantDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">QR Restaurant Ordering</h1>
                <p className="text-gray-600 mb-8">Scan a QR code to start ordering</p>
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
                  <h2 className="text-xl font-semibold mb-4">How it works:</h2>
                  <ol className="text-left space-y-2">
                    <li>1. Scan the QR code at your table</li>
                    <li>2. Browse the restaurant menu</li>
                    <li>3. Add items to your cart</li>
                    <li>4. Place your order</li>
                    <li>5. Track your order status</li>
                  </ol>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App
