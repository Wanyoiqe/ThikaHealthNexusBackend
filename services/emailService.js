const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmailOtp = async (email, otp) => {
  await transporter.sendMail({
    from: `"Thika Health Nexus" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your 2FA Code',
    text: `Your verification code is: ${otp}`,
  });
};