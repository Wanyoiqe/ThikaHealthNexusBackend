const { HospitalModel } = require('../models/hospital');

// Get all hospitals
const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await HospitalModel(req.sequelize).findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single hospital by ID
const getHospitalById = async (req, res) => {
  try {
    const hospital = await HospitalModel(req.sequelize).findByPk(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.status(200).json({ success: true, data: hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new hospital
const createHospital = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({ success: false, message: 'Hospital name is required' });
    }
    
    const hospital = await HospitalModel(req.sequelize).create({
      name,
      phone,
      location
    });
    
    res.status(201).json({ success: true, data: hospital, message: 'Hospital created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update hospital
const updateHospital = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const hospital = await HospitalModel(req.sequelize).findByPk(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    
    await hospital.update({
      name: name || hospital.name,
      phone: phone || hospital.phone,
      location: location || hospital.location
    });
    
    res.status(200).json({ success: true, data: hospital, message: 'Hospital updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete hospital
const deleteHospital = async (req, res) => {
  try {
    const hospital = await HospitalModel(req.sequelize).findByPk(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    
    await hospital.destroy();
    res.status(200).json({ success: true, message: 'Hospital deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital
};