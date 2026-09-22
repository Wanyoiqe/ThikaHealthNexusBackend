const bcrypt = require('bcryptjs');
const { Op } = require("sequelize");
const { User, Patient, Provider, Appointment, Specialization } = require("../models");

const specializations = [
  { id: '1', name: 'cardiology' },
  { id: '2', name: 'dermatology' },
  { id: '3', name: 'neurology' },
  { id: '4', name: 'pediatrics' },
  { id: '5', name: 'psychiatry' },
  { id: '6', name: 'radiology' },
  { id: '7', name: 'oncology' },
  { id: '8', name: 'gynecology' },
  { id: '9', name: 'orthopedics' },
  { id: '10', name: 'general_medicine' },
];

// Add a new doctor
exports.addDoctor = async (req, res) => {
  try {
    console.log('📥 Request has reached addDoctor controller');
    const { firstName, lastName, email, phone, password, gender, specialization } = req.body;

    // Validate required fields properly
    if (!firstName || !lastName || !password || !specialization || !email || !phone) {
      return res.status(400).json({
        message: "First name, last name, email, phone number, password, and specialization are required",
      });
    }

    // Match specialization name to its ID
    // Try to find the specialization in the DB (specializations table uses UUID primary keys)
    let specializationRecord = await Specialization.findOne({ where: { name: specialization } });
    // If it doesn't exist, create it so the provider can reference a valid specialization_id
    if (!specializationRecord) {
      specializationRecord = await Specialization.create({ name: specialization });
    }
    const specialization_id = specializationRecord.specialization_id;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "A user with that email already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      role: 'doctor',
      password: hashedPassword,
    });

    const name = `${firstName} ${lastName}`.trim();

    // Create corresponding Provider entry
    const provider = await Provider.create({
      user_id: user.user_id,
      name,
      specialization_id,
    });

    console.log("✅ Doctor created:", user.email);

    return res.status(201).json({
      result_code: 1,
      message: "Doctor added successfully",
      user,
      provider,
    });

  } catch (error) {
    console.error("❌ Error adding doctor:", error);
    res.status(500).json({ message: "Failed to add doctor" });
  }
};

// Export specializations list
exports.specializations = specializations;

// ✅ (Optional) Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const providers = await Provider.findAll({
      where: { is_deleted: false },
    });
    res.status(200).json({ doctors: providers });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Failed to get doctors" });
  }
};

// ============= NEW FUNCTION: UPDATE DOCTOR =============
exports.updateDoctor = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { first_name, last_name, email, phone, specialization } = req.body;
    
    console.log('📝 Updating doctor:', providerId);
    console.log('Update data:', req.body);
    
    // Find the provider with associated user
    const provider = await Provider.findByPk(providerId, {
      include: [{ model: User, as: 'user' }]
    });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        result_code: 0,
        message: 'Doctor not found'
      });
    }
    
    // Update user information if provided
    if (provider.user) {
      const userUpdateData = {};
      if (first_name) userUpdateData.first_name = first_name;
      if (last_name) userUpdateData.last_name = last_name;
      if (email) userUpdateData.email = email;
      if (phone) userUpdateData.phone_number = phone;
      
      if (Object.keys(userUpdateData).length > 0) {
        await provider.user.update(userUpdateData);
      }
    }
    
    // Update provider information
    const providerUpdateData = {};
    if (first_name || last_name) {
      providerUpdateData.name = `${first_name || provider.user?.first_name} ${last_name || provider.user?.last_name}`.trim();
    }
    
    // Update specialization if provided
    if (specialization) {
      let specializationRecord = await Specialization.findOne({ where: { name: specialization.toLowerCase() } });
      if (!specializationRecord) {
        specializationRecord = await Specialization.create({ name: specialization.toLowerCase() });
      }
      providerUpdateData.specialization_id = specializationRecord.specialization_id;
    }
    
    if (Object.keys(providerUpdateData).length > 0) {
      await provider.update(providerUpdateData);
    }
    
    // Fetch updated provider with user
    const updatedProvider = await Provider.findByPk(providerId, {
      include: [{ model: User, as: 'user' }]
    });
    
    console.log('✅ Doctor updated successfully');
    
    return res.status(200).json({
      success: true,
      result_code: 1,
      message: 'Doctor updated successfully',
      data: {
        provider_id: updatedProvider.provider_id,
        user_id: updatedProvider.user?.user_id,
        first_name: updatedProvider.user?.first_name,
        last_name: updatedProvider.user?.last_name,
        full_name: updatedProvider.name,
        email: updatedProvider.user?.email,
        phone_number: updatedProvider.user?.phone_number,
        specialization: specialization || updatedProvider.specialization?.name
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating doctor:', error);
    res.status(500).json({
      success: false,
      result_code: 0,
      message: 'Failed to update doctor',
      error: error.message
    });
  }
};

// ============= NEW FUNCTION: DELETE DOCTOR (SOFT DELETE) =============
exports.deleteDoctor = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    console.log('🗑️ Deleting doctor:', providerId);
    
    // Find the provider
    const provider = await Provider.findByPk(providerId, {
      include: [{ model: User, as: 'user' }]
    });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        result_code: 0,
        message: 'Doctor not found'
      });
    }
    
    // Soft delete - mark as deleted and inactive
    await provider.update({
      is_deleted: true,
      is_active: false
    });
    
    // Also soft delete the user
    if (provider.user) {
      await provider.user.update({
        is_deleted: true,
        isActive: false
      });
    }
    
    console.log('✅ Doctor deleted successfully');
    
    return res.status(200).json({
      success: true,
      result_code: 1,
      message: 'Doctor removed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      result_code: 0,
      message: 'Failed to delete doctor',
      error: error.message
    });
  }
};

// ============= NEW FUNCTION: GET SINGLE DOCTOR BY ID =============
exports.getDoctorById = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    console.log('🔍 Fetching doctor:', providerId);
    
    const provider = await Provider.findByPk(providerId, {
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['user_id', 'first_name', 'last_name', 'email', 'phone_number', 'profileUrl']
        },
        {
          model: Specialization,
          as: 'specialization',
          attributes: ['specialization_id', 'name']
        }
      ],
      where: { is_deleted: false }
    });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        result_code: 0,
        message: 'Doctor not found'
      });
    }
    
    const doctorData = {
      provider_id: provider.provider_id,
      user_id: provider.user?.user_id,
      first_name: provider.user?.first_name,
      last_name: provider.user?.last_name,
      full_name: provider.name,
      email: provider.user?.email,
      phone_number: provider.user?.phone_number,
      specialization: provider.specialization?.name || 'General Practice',
      profileUrl: provider.user?.profileUrl,
      is_active: provider.is_active
    };
    
    return res.status(200).json({
      success: true,
      result_code: 1,
      data: doctorData
    });
    
  } catch (error) {
    console.error('❌ Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      result_code: 0,
      message: 'Failed to fetch doctor',
      error: error.message
    });
  }
};

exports.getDoctorsPatients = async (req, res, next) => {
  try {
    console.log('Fetching all doctors patients ...');
    const providerId = req.user.provider.provider_id;
    const doctorUserId = req.user && req.user.user_id;
    if (!doctorUserId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    let provider, appointments, patients;
    if(providerId){
      provider = await Provider.findOne({
        where: { provider_id: providerId, is_deleted: false, is_active: true },
      });
      appointments = await Appointment.findAll({
        where: { provider_id: provider.provider_id },
        order: [['date_time', 'DESC']],
      });
    } else {
      provider = await Provider.findOne({
        where: { user_id: doctorUserId, is_deleted: false, is_active: true },
      });
      appointments = await Appointment.findAll({
        where: { provider_id: provider.provider_id },
        order: [['date_time', 'DESC']],
      });
    }

    if (!appointments.length) {
      return res.status(200).json({
        result_code: 1,
        patients: [],
      });
    }

    const patientIds = [...new Set(appointments.map(app => app.patient_id))];
    console.log('Unique patient IDs:', patientIds);

    const allPatients = await Patient.findAll({
      where: {
        patient_id: { [Op.in]: patientIds },
        is_deleted: false,
      },
    });

    patients = allPatients.map((p) => {
      return {
        patient_id: p.patient_id,
        first_name: p.name.split(' ')[0],
        last_name: p.name.split(' ').slice(1).join(' ') || '',
        full_name: p.name,
        totalVisits: appointments.filter(app => app.patient_id === p.patient_id).length,
        lastVisit: appointments
          .filter(app => app.patient_id === p.patient_id)
          .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))[0].date_time
      };
    });

    if (!patients.length) {
      return res.status(200).json({
        result_code: 1,
        patients: [],
      });
    }
    
    return res.status(200).json({ result_code: 1, patients });
  } catch (err) {
    console.error('Error in getDoctorsPatients:', err);
    return next(err);
  }
};

exports.getReceptionistDashboardDetails = async (req, res, next) => {
  try {
    const patientCount = await Patient.count({
      where: { is_deleted: false },
    });

    const staffCount = await Provider.count({
      where: { is_deleted: false, is_active: true },
    });
    const appointmentCount = await Appointment.count({
      where: { status: { [Op.ne]: 'cancelled' } },
    });

    const appointmentCountToday = await Appointment.count({
      where: {
        status: { [Op.ne]: 'cancelled' },
        date_time: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    const data = {
      patientCount,
      staffCount,
      appointmentCount,
      appointmentCountToday,
    };
    return res.status(200).json({ result_code: 1, data });
  } catch (err) {
    console.error('Error in getReceptionistDashboardDetails:', err);
    return next(err);
  }
};