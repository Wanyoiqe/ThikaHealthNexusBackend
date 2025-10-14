const nodemailer = require('nodemailer');

async function sendOnboardingEmail(user) {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // you can switch to any provider or SMTP host
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let name = `${user.first_name}`;
  if (user.last_name) {
    name += ` ${user.last_name}`;
  }

  const frontEndUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"Thika Health Nexus" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🎉 Welcome to Thika Health Nexus!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f9; padding: 40px;">
        <div style="max-width: 640px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden;">
          
          <div style="background: linear-gradient(135deg, #27ae60, #16a085); padding: 24px; text-align: center; color: #fff;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">Welcome to Thika Health Nexus</h1>
          </div>

          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Hi <strong>${name}</strong>,
            </p>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">
              We’re thrilled to have you join <strong>Thika Health Nexus</strong> — a secure and modern way to manage your health records across clinics in Thika. 
            </p>

            <p style="font-size: 15px; color: #555; line-height: 1.7;">
              You can now log in, view your records, and share them with healthcare providers safely and easily.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontEndUrl}/auth/login"
                style="background-color: #27ae60; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">
                Log in to Your Account
              </a>
            </div>

            <p style="font-size: 14px; color: #777; line-height: 1.6;">
              If you have any questions, simply reply to this email and our team will be happy to help. 💚
            </p>
          </div>

          <div style="background-color: #f0f4f3; padding: 20px; text-align: center; color: #777; font-size: 13px;">
            <p style="margin: 0;">
              &copy; ${new Date().getFullYear()} <strong>Thika Health Nexus</strong><br/>
              Empowering healthcare through secure digital records.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending onboarding email:', error);
    return false;
  }
}

module.exports = { sendOnboardingEmail };