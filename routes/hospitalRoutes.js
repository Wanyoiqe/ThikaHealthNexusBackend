const express = require('express');
const { sequelize } = require('../models'); // Make sure this path is correct
const { HospitalModel } = require('../models/hospital');

const router = express.Router();

// GET all hospitals
router.get('/', async (req, res) => {
  console.log('GET /api/admin/hospitals');
  try {
    const Hospital = HospitalModel(sequelize);
    const hospitals = await Hospital.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: hospitals,
      count: hospitals.length
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET single hospital
router.get('/:id', async (req, res) => {
  try {
    const Hospital = HospitalModel(sequelize);
    const hospital = await Hospital.findByPk(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      data: hospital
    });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// CREATE hospital
router.post('/', async (req, res) => {
  console.log('POST /api/admin/hospitals - Body:', req.body);
  
  const { name, phone, location } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Hospital name is required'
    });
  }
  
  try {
    const Hospital = HospitalModel(sequelize);
    
    const newHospital = await Hospital.create({
      name: name.trim(),
      phone: phone || null,
      location: location || null
    });
    
    console.log('Hospital created in database:', newHospital.toJSON());
    
    res.status(201).json({
      success: true,
      data: newHospital,
      message: 'Hospital created successfully'
    });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// UPDATE hospital
router.put('/:id', async (req, res) => {
  console.log('PUT /api/admin/hospitals/:id - ID:', req.params.id);
  console.log('Update data:', req.body);
  
  const { name, phone, location } = req.body;
  
  try {
    const Hospital = HospitalModel(sequelize);
    const hospital = await Hospital.findByPk(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    await hospital.update({
      name: name || hospital.name,
      phone: phone !== undefined ? phone : hospital.phone,
      location: location !== undefined ? location : hospital.location
    });
    
    res.json({
      success: true,
      data: hospital,
      message: 'Hospital updated successfully'
    });
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE hospital
router.delete('/:id', async (req, res) => {
  console.log('DELETE /api/admin/hospitals/:id - ID:', req.params.id);
  
  try {
    const Hospital = HospitalModel(sequelize);
    const hospital = await Hospital.findByPk(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    await hospital.destroy();
    
    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hospital:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;