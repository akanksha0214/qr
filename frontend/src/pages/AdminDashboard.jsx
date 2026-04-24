import React, { useState, useEffect } from 'react';
import { restaurantAPI, orderAPI, menuAPI, qrAPI } from '../services/api';
import QRGenerator from '../components/QRGenerator';
import PrintableReceipt from '../components/PrintableReceipt';
import { io } from 'socket.io-client';
import '../styles/AdminDashboard.css';
import '../styles/NotificationPopup.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [showEditRestaurant, setShowEditRestaurant] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    restaurantId: ''
  });
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    customCategory: '',
    preparationTime: 15,
    availability: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [showPrintReceipt, setShowPrintReceipt] = useState(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Form states
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: ''
  });

  // Function to group menu items by category
  const groupMenuItemsByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [restaurantsRes, ordersRes] = await Promise.all([
        restaurantAPI.getAll(),
        selectedRestaurant ? orderAPI.getByRestaurant(selectedRestaurant._id) : Promise.resolve({ data: [] })
      ]);

      setRestaurants(restaurantsRes.data);
      setOrders(ordersRes.data);

      if (selectedRestaurant) {
        const menuRes = await menuAPI.getByRestaurant(selectedRestaurant._id);
        setMenuItems(menuRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRestaurant) {
      fetchData();
    }
  }, [selectedRestaurant]);

  // Socket.io connection and event handling
  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });

    newSocket.on('new-order', (data) => {
      console.log('New order received in frontend:', data);
      console.log('Selected restaurant ID:', selectedRestaurant?._id);
      console.log('Order restaurant ID:', data.order?.restaurantId);

      // Add notification
      const notification = {
        id: Date.now(),
        type: 'order',
        message: data.message,
        order: data.order,
        timestamp: data.timestamp,
        read: false
      };

      // Play notification sound
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
      } catch (e) {
        console.log('Audio play failed:', e);
      }

      console.log('Adding notification:', notification);
      setNotifications(prev => {
        console.log('Previous notifications:', prev);
        const newNotifications = [notification, ...prev];
        console.log('New notifications:', newNotifications);
        return newNotifications;
      });

      // Refresh orders if we're looking at this restaurant's orders
      if (selectedRestaurant && data.order.restaurantId === selectedRestaurant._id.toString()) {
        console.log('Refreshing orders for matching restaurant');
        fetchData();
      } else {
        console.log('Not refreshing orders - restaurant mismatch or no selected restaurant');
        console.log('Comparing:', data.order.restaurantId, 'vs', selectedRestaurant._id.toString());
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });

    return () => {
      newSocket.close();
    };
  }, [selectedRestaurant]);

  // Join restaurant room when restaurant is selected
  useEffect(() => {
    if (socket && selectedRestaurant) {
      const restaurantId = selectedRestaurant._id.toString();
      console.log('Joining restaurant room:', restaurantId);
      socket.emit('join-restaurant', restaurantId);
    }
  }, [socket, selectedRestaurant]);

  // Auto-print receipt when showPrintReceipt changes
  useEffect(() => {
    if (showPrintReceipt) {
      setTimeout(() => {
        window.print();
        setShowPrintReceipt(null);
      }, 100);
    }
  }, [showPrintReceipt]);

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    try {
      const response = await restaurantAPI.create(newRestaurant);
      setRestaurants([...restaurants, response.data]);
      setShowAddRestaurant(false);
      setNewRestaurant({ name: '', description: '', address: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error adding restaurant:', error);
    }
  };

  const handleEditRestaurant = async (e) => {
    e.preventDefault();
    try {
      const response = await restaurantAPI.update(editingRestaurant._id, editingRestaurant);
      setRestaurants(restaurants.map(r => r._id === editingRestaurant._id ? response.data : r));
      setShowEditRestaurant(false);
      setEditingRestaurant(null);
    } catch (error) {
      console.error('Error updating restaurant:', error);
    }
  };

  const handleDeleteRestaurant = async (restaurantId) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await restaurantAPI.delete(restaurantId);
        setRestaurants(restaurants.filter(r => r._id !== restaurantId));
      } catch (error) {
        console.error('Error deleting restaurant:', error);
      }
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      // Use custom category if selected, otherwise use predefined category
      const categoryValue = newMenuItem.category === 'custom' ? newMenuItem.customCategory : newMenuItem.category;

      const formData = new FormData();
      formData.append('name', newMenuItem.name);
      formData.append('description', newMenuItem.description);
      formData.append('price', newMenuItem.price);
      formData.append('category', categoryValue);
      formData.append('preparationTime', newMenuItem.preparationTime);
      formData.append('restaurantId', selectedRestaurant._id);
      formData.append('isAvailable', newMenuItem.availability);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await menuAPI.create(formData);
      setMenuItems([...menuItems, response.data]);
      setShowAddMenuItemModal(false);
      setNewMenuItem({
        name: '',
        description: '',
        price: '',
        category: '',
        customCategory: '',
        preparationTime: 15,
        availability: true
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...newUser,
        restaurantId: newUser.restaurantId || null
      };

      // For now, just add to local state (would normally call an API)
      setUsers([...users, { ...userData, _id: Date.now().toString() }]);
      setShowAddUserModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        restaurantId: ''
      });
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user._id !== userId));
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const toggleMenuItemAvailability = async (itemId, newAvailability) => {
    try {
      await menuAPI.update(itemId, { isAvailable: newAvailability });
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item._id === itemId ? { ...item, isAvailable: newAvailability } : item
        )
      );
    } catch (error) {
      console.error('Error updating menu item availability:', error);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      try {
        await menuAPI.delete(itemId);
        setMenuItems(prevItems => prevItems.filter(item => item._id !== itemId));
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(order => order.status === orderFilter);

  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage restaurants, menus, and orders</p>
          </div>
        </div>
      </header>

      {/* Real-time Notifications - Popup Modal */}
      {notifications.length > 0 && (
        <div className="notification-popup-overlay">
          <div className="notification-popup-container">
            <div className="notification-popup-header">
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <svg className="notification-popup-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div className="notification-popup-content">
                  <h3 className="notification-popup-title">{notifications[0].message}</h3>
                  <span className="notification-popup-time">
                    {new Date(notifications[0].timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setNotifications(prev => prev.slice(1))}
                className="notification-popup-close"
              >
                ×
              </button>
            </div>

            {/* Order Details */}
            {notifications[0].order && (
              <div className="notification-popup-details">
                <div className="notification-popup-info-grid">
                  {/* Table Info */}
                  <div>
                    <span className="notification-popup-info-label">Table:</span>
                    <span className="notification-popup-info-value">
                      {notifications[0].order.tableNumber}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <span className="notification-popup-info-label">Customer:</span>
                    <span className="notification-popup-info-value">
                      {notifications[0].order.customerName}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <span className="notification-popup-items-label">Items:</span>
                  {notifications[0].order.items.map((item, index) => (
                    <div key={index} className="notification-popup-item">
                      <span className="notification-popup-item-name">{item.name} x{item.quantity}</span>
                      <span className="notification-popup-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="notification-popup-total">
                  <span className="notification-popup-total-label">Total:</span>
                  <span className="notification-popup-total-value">
                    ${notifications[0].order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restaurant Selector */}
      <div className="admin-main">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Select Restaurant</h2>
          </div>
          <div className="admin-card-body">
            <div className="admin-form">
              <label className="admin-label">Restaurant</label>
              <select
                value={selectedRestaurant?._id || ''}
                onChange={(e) => {
                  const restaurant = restaurants.find(r => r._id === e.target.value);
                  setSelectedRestaurant(restaurant);
                }}
                className="admin-select"
              >
                <option value="">Select a restaurant...</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-main">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Management</h2>
          </div>
          <div className="admin-card-body">
            <nav className="admin-nav">
              <button
                onClick={() => setActiveTab('orders')}
                className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
              >
                Orders
                <span className="admin-tab-badge">
                  {orders.filter(order => order.status === 'pending').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`admin-tab ${activeTab === 'menu' ? 'active' : ''}`}
              >
                Menu
                <span className="admin-tab-badge">
                  {menuItems.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('qr')}
                className={`admin-tab ${activeTab === 'qr' ? 'active' : ''}`}
              >
                QR Codes
              </button>
              <button
                onClick={() => setActiveTab('cafe')}
                className={`admin-tab ${activeTab === 'cafe' ? 'active' : ''}`}
              >
                Cafe Management
                <span className="admin-tab-badge">
                  {restaurants.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
              >
                Users
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="admin-main">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Orders</h2>
            </div>
            <div className="admin-card-body">
              {!selectedRestaurant ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please select a restaurant to view orders</p>
                </div>
              ) : (
                <>
                  <div className="admin-form" style={{ marginBottom: '1.5rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-label">Filter Orders</label>
                      <select
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                        className="admin-select"
                      >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => fetchData()}
                        className="admin-btn admin-btn-primary"
                      >
                        Refresh Orders
                      </button>
                    </div>
                  </div>

                  <div className="admin-table">
                    <div className="admin-table-header">
                      <div className="flex justify-between items-center">
                        <span className="admin-card-title">Order Management</span>
                        <span className="text-sm text-gray-500">
                          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="admin-table-row">
                            <th className="admin-table-cell admin-table-cell-header">Order #</th>
                            <th className="admin-table-cell admin-table-cell-header">Customer</th>
                            <th className="admin-table-cell admin-table-cell-header">Table</th>
                            <th className="admin-table-cell admin-table-cell-header">Items</th>
                            <th className="admin-table-cell admin-table-cell-header">Total</th>
                            <th className="admin-table-cell admin-table-cell-header">Status</th>
                            <th className="admin-table-cell admin-table-cell-header">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map(order => (
                            <tr key={order._id} className="admin-table-row">
                              <td className="admin-table-cell">{order.orderNumber}</td>
                              <td className="admin-table-cell">{order.customerName}</td>
                              <td className="admin-table-cell">{order.tableNumber}</td>
                              <td className="admin-table-cell">
                                <div className="flex flex-col gap-1">
                                  {order.items.slice(0, 2).map((item, index) => (
                                    <div key={index} className="text-sm">
                                      {item.quantity}x {item.name}
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <div className="text-xs text-gray-500">
                                      +{order.items.length - 2} more items
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="admin-table-cell font-semibold">${order.total.toFixed(2)}</td>
                              <td className="admin-table-cell">
                                <span className={`status-badge status-${order.status}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="admin-table-cell">
                                <div className="flex" style={{ gap: '40px' }}>
                                  <button
                                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                                    className="admin-btn admin-btn-secondary text-sm"
                                  >
                                    Start Preparing
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(order._id, 'ready')}
                                    className="admin-btn admin-btn-success text-sm"
                                  >
                                    Mark Ready
                                  </button>
                                  <button
                                    onClick={() => setShowPrintReceipt(order)}
                                    className="admin-btn admin-btn-warning text-sm"
                                  >
                                    Print
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Menu Management</h2>
            </div>
            <div className="admin-card-body">
              {!selectedRestaurant ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please select a restaurant to manage menu</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowAddMenuItemModal(true)}
                      className="admin-btn admin-btn-primary"
                    >
                      Add Menu Item
                    </button>
                  </div>

                  {/* Existing Menu Items */}
                  {menuItems.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      {/* Category Tabs */}
                      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedCategoryTab('all')}
                          className={`admin-btn ${selectedCategoryTab === 'all' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          All
                        </button>
                        {Object.keys(groupMenuItemsByCategory(menuItems)).map(category => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategoryTab(category)}
                            className={`admin-btn ${selectedCategoryTab === category ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Filtered Menu Items */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
                        {menuItems
                          .filter(item => selectedCategoryTab === 'all' || item.category === selectedCategoryTab)
                          .map(item => (
                            <div key={item._id} className="admin-card" style={{ overflow: 'hidden', position: 'relative', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                              <button
                                onClick={() => handleDeleteMenuItem(item._id)}
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '10px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  zIndex: 10,
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 1)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.9)'}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ width: '100%', height: '180px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem' }}>
                                  🍽️
                                </div>
                              )}
                              <div className="admin-card-body" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                  <h3 className="admin-card-title" style={{ fontSize: '1.125rem', margin: 0 }}>{item.name}</h3>
                                  <span className="font-bold text-green-600" style={{ fontSize: '1.125rem' }}>₹{item.price.toFixed(2)}</span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2" style={{ fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description || 'No description'}</p>
                                {item.preparationTime && (
                                  <p className="text-gray-500 text-sm mb-3" style={{ fontSize: '0.875rem' }}>
                                    ⏱️ {item.preparationTime} min prep time
                                  </p>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                  <span className={`status-badge ${item.isAvailable ? 'status-ready' : 'status-cancelled'}`} style={{ fontSize: '0.875rem' }}>
                                    {item.isAvailable ? 'Available' : 'Unavailable'}
                                  </span>
                                  <button
                                    onClick={() => toggleMenuItemAvailability(item._id, !item.isAvailable)}
                                    className={`admin-btn ${item.isAvailable ? 'admin-btn-warning' : 'admin-btn-success'}`}
                                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                  >
                                    {item.isAvailable ? 'Disable' : 'Enable'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {showAddMenuItemModal && (
                    <div className="order-modal-overlay" onClick={() => setShowAddMenuItemModal(false)}>
                      <div className="order-modal" style={{ maxHeight: '100vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
                          <h3 className="admin-card-title" style={{ color: 'white', margin: 0 }}>Add New Menu Item</h3>
                        </div>
                        <div className="admin-card-body">
                          <form onSubmit={handleAddMenuItem} className="admin-form">
                            <div className="admin-form-group">
                              <label className="admin-label">Item Name</label>
                              <input
                                type="text"
                                placeholder="Item Name"
                                value={newMenuItem.name}
                                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                                className="admin-input"
                                required
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '1.25rem' }}>
                              <div className="admin-form-group" style={{ width: '30%', marginBottom: 0, flexShrink: 0 }}>
                                <label className="admin-label">Price</label>
                                <input
                                  type="number"
                                  placeholder="Price"
                                  value={newMenuItem.price}
                                  onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                                  className="admin-input"
                                  required
                                  style={{ width: '100%' }}
                                />
                              </div>
                              <div className="admin-form-group" style={{ width: '60%', marginBottom: 0, flexShrink: 0 }}>
                                <label className="admin-label">Category</label>
                                <select
                                  value={newMenuItem.category}
                                  onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value, customCategory: '' })}
                                  className="admin-select"
                                  style={{ width: '100%' }}
                                >
                                  <option value="">Select Category</option>
                                  <option value="appetizer">Appetizer</option>
                                  <option value="main">Main</option>
                                  <option value="dessert">Dessert</option>
                                  <option value="beverage">Beverage</option>
                                  <option value="other">Other</option>
                                  <option value="custom">+ Add Custom Category</option>
                                </select>
                              </div>
                            </div>
                            {newMenuItem.category === 'custom' && (
                              <div className="admin-form-group">
                                <label className="admin-label">Custom Category</label>
                                <input
                                  type="text"
                                  placeholder="Enter custom category"
                                  value={newMenuItem.customCategory}
                                  onChange={(e) => setNewMenuItem({ ...newMenuItem, customCategory: e.target.value })}
                                  required
                                  className="admin-input"
                                />
                              </div>
                            )}
                            <div className="admin-form-group">
                              <label className="admin-label">Item Image</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setImageFile(file);
                                    setImagePreview(URL.createObjectURL(file));
                                  }
                                }}
                                className="admin-input"
                              />
                              {imagePreview && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{ width: '100%', maxWidth: '200px', height: 'auto', borderRadius: '8px' }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-label">Preparation Time (minutes)</label>
                              <input
                                type="number"
                                placeholder="Preparation Time"
                                value={newMenuItem.preparationTime}
                                onChange={(e) => setNewMenuItem({ ...newMenuItem, preparationTime: e.target.value })}
                                className="admin-input"
                              />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-label">Description</label>
                              <textarea
                                placeholder="Description"
                                value={newMenuItem.description}
                                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                                className="admin-input"
                                rows="3"
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setShowAddMenuItemModal(false)}
                                className="admin-btn admin-btn-secondary"
                                style={{ marginRight: '1rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="admin-btn admin-btn-primary"
                              >
                                Add Menu Item
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {menuItems.length === 0 && !showAddMenuItemModal && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No menu items yet. Click "Add Menu Item" to get started.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* QR Codes Tab */}
        {activeTab === 'qr' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">QR Code Generator</h2>
            </div>
            <div className="admin-card-body">
              {!selectedRestaurant ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please select a restaurant to generate QR codes</p>
                </div>
              ) : (
                <>
                  <QRGenerator
                    restaurant={selectedRestaurant}
                    onGenerate={(qrCodes) => setGeneratedQRs(qrCodes)}
                  />

                  <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                    <div className="admin-card-header">
                      <h3 className="admin-card-title">QR Code Information</h3>
                    </div>
                    <div className="admin-card-body">
                      <div className="admin-form">
                        <div className="admin-form-group">
                          <label className="admin-label">Restaurant QR Code ID</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={selectedRestaurant.qrCodeId}
                              readOnly
                              className="admin-input"
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(`http://localhost:5173/menu/${selectedRestaurant.qrCodeId}`)}
                              className="admin-btn admin-btn-secondary"
                            >
                              Copy URL
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* Cafe Management Tab */}
        {activeTab === 'cafe' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Cafe Management</h2>
            </div>
            <div className="admin-card-body">
              <button
                onClick={() => setShowAddRestaurant(true)}
                className="admin-btn admin-btn-primary"
              >
                Add New Restaurant
              </button>
              {showAddRestaurant && (
                <div className="order-modal-overlay" onClick={() => setShowAddRestaurant(false)}>
                  <div className="order-modal" style={{ maxHeight: '100vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    <div className="admin-card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
                      <h3 className="admin-card-title" style={{ color: 'white', margin: 0 }}>Add New Restaurant</h3>
                    </div>
                    <div className="admin-card-body">
                      <form onSubmit={handleAddRestaurant} className="admin-form">
                        <div className="admin-form-group">
                          <label className="admin-label">Restaurant Name</label>
                          <input
                            type="text"
                            placeholder="Restaurant Name"
                            value={newRestaurant.name}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Email</label>
                          <input
                            type="email"
                            placeholder="Email"
                            value={newRestaurant.email}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Phone</label>
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={newRestaurant.phone}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Address</label>
                          <input
                            type="text"
                            placeholder="Address"
                            value={newRestaurant.address}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Description</label>
                          <textarea
                            placeholder="Description"
                            value={newRestaurant.description}
                            onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                            className="admin-input"
                            rows="3"
                          />
                        </div>
                        <div className="flex justify-end" style={{ marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => setShowAddRestaurant(false)}
                            className="admin-btn admin-btn-secondary"
                            style={{ marginRight: '1rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="admin-btn admin-btn-primary"
                          >
                            Add Restaurant
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {showEditRestaurant && editingRestaurant && (
                <div className="order-modal-overlay" onClick={() => setShowEditRestaurant(false)}>
                  <div className="order-modal" style={{ maxHeight: '100vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    <div className="admin-card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
                      <h3 className="admin-card-title" style={{ color: 'white', margin: 0 }}>Edit Restaurant</h3>
                    </div>
                    <div className="admin-card-body">
                      <form onSubmit={handleEditRestaurant} className="admin-form">
                        <div className="admin-form-group">
                          <label className="admin-label">Restaurant Name</label>
                          <input
                            type="text"
                            placeholder="Restaurant Name"
                            value={editingRestaurant.name}
                            onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Email</label>
                          <input
                            type="email"
                            placeholder="Email"
                            value={editingRestaurant.email}
                            onChange={(e) => setEditingRestaurant({ ...editingRestaurant, email: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Phone</label>
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={editingRestaurant.phone}
                            onChange={(e) => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Address</label>
                          <input
                            type="text"
                            placeholder="Address"
                            value={editingRestaurant.address}
                            onChange={(e) => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Description</label>
                          <textarea
                            placeholder="Description"
                            value={editingRestaurant.description}
                            onChange={(e) => setEditingRestaurant({ ...editingRestaurant, description: e.target.value })}
                            className="admin-input"
                            rows="3"
                          />
                        </div>
                        <div className="flex justify-end" style={{ marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => setShowEditRestaurant(false)}
                            className="admin-btn admin-btn-secondary"
                            style={{ marginRight: '1rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="admin-btn admin-btn-primary"
                          >
                            Update Restaurant
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Restaurant List */}
              <div className="admin-table">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="admin-table-row">
                        <th className="admin-table-cell admin-table-cell-header">Name</th>
                        <th className="admin-table-cell admin-table-cell-header">Email</th>
                        <th className="admin-table-cell admin-table-cell-header">Phone</th>
                        <th className="admin-table-cell admin-table-cell-header">Address</th>
                        <th className="admin-table-cell admin-table-cell-header">Description</th>
                        <th className="admin-table-cell admin-table-cell-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.map(restaurant => (
                        <tr key={restaurant._id} className="admin-table-row">
                          <td className="admin-table-cell font-semibold">{restaurant.name}</td>
                          <td className="admin-table-cell">{restaurant.email}</td>
                          <td className="admin-table-cell">{restaurant.phone}</td>
                          <td className="admin-table-cell">{restaurant.address}</td>
                          <td className="admin-table-cell">{restaurant.description}</td>
                          <td className="admin-table-cell">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingRestaurant(restaurant);
                                  setShowEditRestaurant(true);
                                }}
                                className="admin-btn admin-btn-secondary text-sm"
                                style={{ padding: '0.5rem 0.75rem' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRestaurant(restaurant._id)}
                                className="admin-btn admin-btn-danger text-sm"
                                style={{ padding: '0.5rem 0.75rem' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {restaurants.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No restaurants found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">User Management</h2>
            </div>
            <div className="admin-card-body">
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="admin-btn admin-btn-primary"
                >
                  Add New User
                </button>
              </div>

              {/* Users List */}
              {users.length > 0 ? (
                <div style={{ marginTop: '1.5rem' }}>
                  <table className="admin-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th className="admin-table-cell-header">Name</th>
                        <th className="admin-table-cell-header">Email</th>
                        <th className="admin-table-cell-header">Role</th>
                        <th className="admin-table-cell-header">Restaurant</th>
                        <th className="admin-table-cell-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id} className="admin-table-row">
                          <td className="admin-table-cell">{user.name}</td>
                          <td className="admin-table-cell">{user.email}</td>
                          <td className="admin-table-cell">
                            <span className={`status-badge ${user.role === 'admin' ? 'status-ready' : 'status-pending'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="admin-table-cell">{user.restaurantId ? restaurants.find(r => r._id === user.restaurantId)?.name || 'N/A' : 'All Restaurants'}</td>
                          <td className="admin-table-cell">
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="admin-btn admin-btn-danger"
                              style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No users found</p>
                </div>
              )}

              {showAddUserModal && (
                <div className="order-modal-overlay" onClick={() => setShowAddUserModal(false)}>
                  <div className="order-modal" style={{ maxHeight: '100vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    <div className="admin-card-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px 20px 0 0', borderBottom: 'none' }}>
                      <h3 className="admin-card-title" style={{ color: 'white', margin: 0 }}>Add New User</h3>
                    </div>
                    <div className="admin-card-body">
                      <form onSubmit={handleAddUser} className="admin-form">
                        <div className="admin-form-group">
                          <label className="admin-label">Name</label>
                          <input
                            type="text"
                            placeholder="User Name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Email</label>
                          <input
                            type="email"
                            placeholder="Email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Password</label>
                          <input
                            type="password"
                            placeholder="Password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            className="admin-input"
                            required
                          />
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Role</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="admin-select"
                          >
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="admin-form-group">
                          <label className="admin-label">Restaurant</label>
                          <select
                            value={newUser.restaurantId}
                            onChange={(e) => setNewUser({ ...newUser, restaurantId: e.target.value })}
                            className="admin-select"
                          >
                            <option value="">All Restaurants</option>
                            {restaurants.map(restaurant => (
                              <option key={restaurant._id} value={restaurant._id}>{restaurant.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end" style={{ marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            className="admin-btn admin-btn-secondary"
                            style={{ marginRight: '1rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="admin-btn admin-btn-primary"
                          >
                            Add User
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>


      {showPrintReceipt && (
        <PrintableReceipt
          order={showPrintReceipt}
          restaurant={selectedRestaurant}
          onClose={() => setShowPrintReceipt(null)}
        />
      )}

    </div>
  );
};

export default AdminDashboard;
