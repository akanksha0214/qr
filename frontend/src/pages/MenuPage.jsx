import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantAPI, menuAPI, orderAPI } from '../services/api';
import '../styles/MenuPage.css';

const MenuPage = () => {
  const { qrCodeId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Get unique categories from menu items plus standard categories
  const getUniqueCategories = () => {
    const standardCategories = ['all', 'appetizer', 'main', 'dessert', 'beverage', 'other'];
    const customCategories = [...new Set(menuItems.map(item => item.category).filter(cat => 
      !standardCategories.includes(cat.toLowerCase())
    ))];
    return [...standardCategories, ...customCategories];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const restaurantResponse = await restaurantAPI.getByQRCode(qrCodeId);
        setRestaurant(restaurantResponse.data);
        
        // Extract table number from URL
        const urlParams = new URLSearchParams(window.location.search);
        const tableFromUrl = urlParams.get('table');
        if (tableFromUrl) {
          setTableNumber(tableFromUrl);
        }

        const menuResponse = await menuAPI.getByRestaurant(restaurantResponse.data._id);
        setMenuItems(menuResponse.data);
      } catch (err) {
        setError('Failed to load restaurant information');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [qrCodeId]);

  const filteredItems = selectedCategory === 'all' 
    ? menuItems.filter(item => item.isAvailable)
    : menuItems.filter(item => item.category === selectedCategory && item.isAvailable);

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getQuantity = (itemId) => {
    const cartItem = cart.find(item => item._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    setShowOrderForm(true);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setOrderError('Please enter your name');
      return;
    }
    
    setIsPlacingOrder(true);
    setOrderError('');
    
    try {
      const orderData = {
        restaurantId: restaurant._id,
        customerName: customerName.trim(),
        customerPhone: 'N/A',
        customerEmail: 'N/A',
        tableNumber: tableNumber || 'Not specified',
        items: cart.map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: getTotalPrice(),
        tax: getTotalPrice() * 0.1,
        total: getTotalPrice() * 1.1
      };
      
      const response = await orderAPI.create(orderData);
      setOrderSuccess(true);
      setCart([]);
      setShowOrderForm(false);
      setCustomerName('');
      
      // Show success message for 3 seconds then reset
      setTimeout(() => {
        setOrderSuccess(false);
      }, 3000);
      
    } catch (error) {
      setOrderError('Failed to place order. Please try again.');
      console.error('Order error:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Header */}
      <header className="menu-header">
        <div className="menu-header-content">
          <div className="restaurant-info">
            <h1>{restaurant?.name}</h1>
            <p>{restaurant?.description}</p>
          </div>
          <div className="relative">
            <button className="cart-button">
              <span>Cart ({getTotalItems()})</span>
              <span>₹{getTotalPrice().toFixed(2)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="category-filters">
        <div className="category-scroll">
          {getUniqueCategories().map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-button ${
                selectedCategory === category ? 'active' : ''
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="menu-items">
        {filteredItems.map(item => (
          <div key={item._id} className="menu-item-card">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="menu-item-image"
              />
            ) : (
              <div className="menu-item-image" />
            )}
            <div className="menu-item-content">
              <div className="menu-item-header">
                <h3 className="menu-item-name">{item.name}</h3>
                <span className="menu-item-price">₹{item.price.toFixed(2)}</span>
              </div>
              <p className="menu-item-description">{item.description || 'No description'}</p>
              {item.preparationTime && (
                <p className="menu-item-prep-time">
                  ⏱️ {item.preparationTime} min prep time
                </p>
              )}
              <button
                onClick={() => addToCart(item)}
                className="add-to-cart-button"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="empty-state">
            <p>
              {selectedCategory === 'all' 
                ? 'No items available at the moment' 
                : `No available items in ${selectedCategory} category`
              }
            </p>
            <p>
              {selectedCategory === 'all' 
                ? 'Check back later or contact staff for availability' 
                : 'Try selecting a different category'
              }
            </p>
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {cart.length > 0 && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h2>Your Order</h2>
          </div>
          <div className="cart-content">
            {cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-header">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="cart-item-remove"
                  >
                    ×
                  </button>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="quantity-button"
                    >
                      -
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="quantity-button"
                    >
                      +
                    </button>
                  </div>
                  <span className="cart-item-total">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            <div className="cart-summary">
              <div className="cart-total">
                <span className="cart-total-label">Total:</span>
                <span className="cart-total-amount">₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <button 
                onClick={handlePlaceOrder}
                className="place-order-button"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="order-modal-overlay" onClick={() => setShowOrderForm(false)}>
          <div className="order-modal" style={{ padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1.5rem', borderBottom: 'none' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>Place Your Order</h3>
            </div>

            <form onSubmit={submitOrder} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Enter your name"
                  className="form-input"
                  style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '1rem', width: '100%' }}
                />
              </div>

              {tableNumber && (
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                  Table Number
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  readOnly
                  className="form-input"
                  style={{ padding: '0.75rem 1rem', borderRadius: '10px', border: '2px solid #e5e7eb', fontSize: '1rem', width: '100%', backgroundColor: '#f9fafb' }}
                />
                <p className="form-hint" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Table number from QR code</p>
              </div>
            )}

              <div className="form-group">
                <h4 className="order-summary-title" style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#1a1a1a' }}>Order Summary:</h4>
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem' }}>
                  {cart.map(item => (
                    <div key={item._id} className="order-summary-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                      <span style={{ color: '#374151' }}>{item.quantity}x {item.name}</span>
                      <span style={{ fontWeight: 600, color: '#1a1a1a' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="order-summary-divider" style={{ borderTop: '2px solid #e5e7eb', margin: '1rem 0' }}></div>
                  <div className="order-summary-total" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="order-summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#6b7280' }}>Subtotal:</span>
                      <span style={{ color: '#374151' }}>₹{getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="order-summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#6b7280' }}>Tax (10%):</span>
                      <span style={{ color: '#374151' }}>₹{(getTotalPrice() * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="order-summary-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: '#1a1a1a', paddingTop: '0.5rem', borderTop: '2px solid #e5e7eb' }}>
                      <span>Total:</span>
                      <span>₹{(getTotalPrice() * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {orderError && (
                <div className="form-error" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {orderError}
                </div>
              )}

              <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowOrderForm(false);
                    setOrderError('');
                  }}
                  className="form-button form-button-cancel"
                  style={{ flex: 1, padding: '0.875rem 1.5rem', borderRadius: '10px', border: '2px solid #e5e7eb', backgroundColor: 'white', color: '#374151', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="form-button form-button-submit"
                  style={{ flex: 1, padding: '0.875rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Message */}
      {orderSuccess && (
        <div className="success-message">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Order placed successfully! Your food will be ready soon.</span>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
