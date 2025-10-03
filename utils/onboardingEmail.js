const nodemailer = require('nodemailer');

async function sendOnboardingEmail(recipientEmail) {
    // Configure transporter (use your SMTP credentials)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your email provider
        auth: {
            user: process.env.EMAIL_USER, // your email address
            pass: process.env.EMAIL_PASS, // your email password or app password
        },
    });

    const mailOptions = {
        from: `"Thika Health Nexus" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: 'Welcome to Thika Health Nexus!',
        html: `
            <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px;">
                <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #eee; padding: 24px;">
                    <h2 style="color: #2c3e50;">Welcome to Thika Health Nexus!</h2>
                    <p style="font-size: 16px; color: #444;">
                        Dear user,<br>
                        Thank you for joining <b>Thika Health Nexus</b>. We're excited to have you onboard!
                    </p>
                    <p style="font-size: 15px; color: #555;">
                        If you have any questions, feel free to reply to this email.<br>
                        <br>
                        Best regards,<br>
                        <span style="color: #27ae60;">Thika Health Nexus Team</span>
                    </p>
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