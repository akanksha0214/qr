const express = require('express');
const router = express.Router();
const CafeDetails = require('../models/CafeDetails');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get cafe details by restaurant ID
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const cafeDetails = await CafeDetails.findOne({ restaurantId: req.params.restaurantId });
    if (!cafeDetails) {
      return res.status(404).json({ message: 'Cafe details not found' });
    }
    res.json(cafeDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cafe details by ID
router.get('/:id', async (req, res) => {
  try {
    const cafeDetails = await CafeDetails.findById(req.params.id);
    if (!cafeDetails) {
      return res.status(404).json({ message: 'Cafe details not found' });
    }
    res.json(cafeDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create cafe details
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const cafeDetailsData = { ...req.body };
    if (req.file) {
      cafeDetailsData.logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    const cafeDetails = new CafeDetails(cafeDetailsData);
    const savedCafeDetails = await cafeDetails.save();
    res.status(201).json(savedCafeDetails);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update cafe details
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const cafeDetailsData = { ...req.body, updatedAt: Date.now() };
    if (req.file) {
      cafeDetailsData.logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.existingLogo && typeof req.body.existingLogo === 'string' && req.body.existingLogo !== '{}') {
      cafeDetailsData.logo = req.body.existingLogo;
    }
    const cafeDetails = await CafeDetails.findByIdAndUpdate(
      req.params.id,
      cafeDetailsData,
      { new: true, runValidators: true }
    );
    if (!cafeDetails) {
      return res.status(404).json({ message: 'Cafe details not found' });
    }
    res.json(cafeDetails);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update cafe details by restaurant ID (with upsert)
router.put('/restaurant/:restaurantId', upload.single('logo'), async (req, res) => {
  try {
    const cafeDetailsData = { ...req.body, updatedAt: Date.now() };
    if (req.file) {
      cafeDetailsData.logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.existingLogo && typeof req.body.existingLogo === 'string' && req.body.existingLogo !== '{}') {
      cafeDetailsData.logo = req.body.existingLogo;
    }
    const cafeDetails = await CafeDetails.findOneAndUpdate(
      { restaurantId: req.params.restaurantId },
      cafeDetailsData,
      { new: true, runValidators: true, upsert: true }
    );
    res.json(cafeDetails);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete cafe details
router.delete('/:id', async (req, res) => {
  try {
    const cafeDetails = await CafeDetails.findByIdAndDelete(req.params.id);
    if (!cafeDetails) {
      return res.status(404).json({ message: 'Cafe details not found' });
    }
    res.json({ message: 'Cafe details deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
