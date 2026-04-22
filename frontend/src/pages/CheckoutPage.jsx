import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    tableNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedRestaurant = localStorage.getItem('restaurant');
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      navigate('/menu');
    }
    
    if (savedRestaurant) {
      setRestaurant(JSON.parse(savedRestaurant));
    }
    
    // Auto-fill table number if coming from QR code
    if (tableFromUrl) {
      setCustomerInfo(prev => ({
        ...prev,
        tableNumber: tableFromUrl
      }));
    }
  }, [navigate]);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getTotalPrice() * 0.1; // 10% tax
  };

  const getTotalWithTax = () => {
    return getTotalPrice() + getTax();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        restaurantId: restaurant._id,
        customerName: customerInfo.name,
        customerPhone: 'N/A',
        customerEmail: 'N/A',
        tableNumber: customerInfo.tableNumber,
        items: cart.map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: getTotalPrice(),
        tax: getTax(),
        total: getTotalWithTax()
      };

      const response = await orderAPI.create(orderData);
      
      // Clear cart and redirect to order confirmation
      localStorage.removeItem('cart');
      navigate(`/order-confirmation/${response.data._id}`);
    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant || cart.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">No items in cart</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Information Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Table Number *
                </label>
                <input
                  type="text"
                  name="tableNumber"
                  value={customerInfo.tableNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Table 1, Table 2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {customerInfo.tableNumber && (
                  <p className="text-sm text-green-600 mt-1">
                    Table: {customerInfo.tableNumber}
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">{restaurant.name}</h3>
            </div>

            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item._id} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 ml-2">×{item.quantity}</span>
                  </div>
                  <span className="font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>₹{getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{getTotalWithTax().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
