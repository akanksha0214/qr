const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { generateQRCodeId } = require('../utils/qrGenerator');

const sampleData = async () => {
  try {
    // Clear existing data
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});

    // Create sample restaurant
    const restaurant = new Restaurant({
      name: 'The Digital Bistro',
      description: 'Modern cuisine with a tech twist',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      phone: '+1-555-0123',
      email: 'info@digitalbistro.com',
      qrCodeId: generateQRCodeId(),
      isActive: true
    });

    const savedRestaurant = await restaurant.save();
    console.log('Created restaurant:', savedRestaurant.name);

    // Create sample menu items
    const menuItems = [
      {
        restaurantId: savedRestaurant._id,
        name: 'Truffle Fries',
        description: 'Crispy fries topped with truffle oil and parmesan',
        price: 12.99,
        category: 'appetizer',
        preparationTime: 10,
        ingredients: ['potatoes', 'truffle oil', 'parmesan', 'parsley'],
        allergens: ['dairy']
      },
      {
        restaurantId: savedRestaurant._id,
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with caesar dressing and croutons',
        price: 9.99,
        category: 'appetizer',
        preparationTime: 8,
        ingredients: ['romaine lettuce', 'caesar dressing', 'croutons', 'parmesan'],
        allergens: ['dairy', 'gluten', 'anchovies']
      },
      {
        restaurantId: savedRestaurant._id,
        name: 'Grilled Salmon',
        description: 'Atlantic salmon with lemon butter sauce and seasonal vegetables',
        price: 24.99,
        category: 'main',
        preparationTime: 20,
        ingredients: ['salmon', 'lemon', 'butter', 'vegetables', 'herbs'],
        allergens: ['dairy', 'fish']
      },
      {
        restaurantId: savedRestaurant._id,
        name: 'Ribeye Steak',
        description: '12oz ribeye steak with garlic mashed potatoes',
        price: 32.99,
        category: 'main',
        preparationTime: 25,
        ingredients: ['beef', 'potatoes', 'garlic', 'butter', 'herbs'],
        allergens: ['dairy']
      },
      {
        restaurantId: savedRestaurant._id,
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        price: 8.99,
        category: 'dessert',
        preparationTime: 12,
        ingredients: ['chocolate', 'butter', 'eggs', 'flour', 'ice cream'],
        allergens: ['dairy', 'eggs', 'gluten']
      },
      {
        restaurantId: savedRestaurant._id,
        name: 'Craft Beer',
        description: 'Local brewery selection',
        price: 6.99,
        category: 'beverage',
        preparationTime: 2,
        ingredients: ['beer'],
        allergens: ['gluten']
      },
      {
        restaurantId: savedRestaurant._id,
        name: 'Fresh Lemonade',
        description: 'House-made lemonade with fresh mint',
        price: 4.99,
        category: 'beverage',
        preparationTime: 3,
        ingredients: ['lemon', 'water', 'sugar', 'mint'],
        allergens: []
      }
    ];

    const savedMenuItems = await MenuItem.insertMany(menuItems);
    console.log(`Created ₹{savedMenuItems.length} menu items`);

    console.log('Sample data created successfully!');
    console.log(`QR Code ID: ₹{savedRestaurant.qrCodeId}`);
    console.log(`Menu URL: http://localhost:3000/menu/₹{savedRestaurant.qrCodeId}`);

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

module.exports = sampleData;
