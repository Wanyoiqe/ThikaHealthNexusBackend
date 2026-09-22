const nodemailer = require('nodemailer');

async function sendConsentRequestEmail({ patientEmail, patientName, doctorName, purpose, frontendUrl }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const loginUrl = `${frontendUrl || process.env.FRONTEND_URL || 'http://localhost:8080'}/health-records`;

  const mailOptions = {
    from: `"Thika Integrated Health Records System" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: '🔒 Health Record Access Request',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f9; padding: 40px;">
        <div style="max-width: 640px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden;">

          <div style="background: linear-gradient(135deg, #0EA5E9, #0284C7); padding: 24px; text-align: center; color: #fff;">
            <h1 style="margin: 0; font-size: 22px;">Health Record Access Request</h1>
          </div>

          <div style="padding: 32px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Hi <strong>${patientName}</strong>,
            </p>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">
              <strong>Dr. ${doctorName}</strong> has requested access to your health records with the following purpose:
            </p>
            <blockquote style="border-left: 4px solid #0EA5E9; margin: 16px 0; padding: 12px 16px; background: #f0f9ff; color: #333; border-radius: 0 6px 6px 0;">
              ${purpose}
            </blockquote>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">
              Please log in to your account to <strong>approve or deny</strong> this request. You are in full control of your health data.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}"
                style="background-color: #0EA5E9; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block;">
                Review Request
              </a>
            </div>
            <p style="font-size: 13px; color: #999; line-height: 1.6;">
              If you did not expect this request, you can safely ignore this email or contact our support team.
            </p>
          </div>

          <div style="background-color: #f0f4f3; padding: 20px; text-align: center; color: #777; font-size: 13px;">
            <p style="margin: 0;">
              &copy; ${new Date().getFullYear()} <strong>Thika Integrated Health Records System</strong> — Your data, your control.
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
    console.error('Error sending consent request email:', error.message);
    return false;
  }
}

module.exports = { sendConsentRequestEmail };
