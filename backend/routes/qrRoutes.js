const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { generateQRCodeUrl } = require('../utils/qrGenerator');

// Get QR code URL for a restaurant
router.get('/:qrCodeId/url', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ 
      qrCodeId: req.params.qrCodeId,
      isActive: true 
    });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    const qrUrl = generateQRCodeUrl(restaurant.qrCodeId);
    res.json({ 
      qrCodeId: restaurant.qrCodeId,
      restaurantName: restaurant.name,
      qrUrl 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate QR code
router.get('/:qrCodeId/validate', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ 
      qrCodeId: req.params.qrCodeId,
      isActive: true 
    });
    
    if (!restaurant) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Invalid or inactive QR code' 
      });
    }
    
    res.json({ 
      valid: true, 
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        description: restaurant.description
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
