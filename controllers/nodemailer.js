const nodemailer = require("nodemailer");

const handler = async (req, res) => {
  if (req.method === "POST") {
    const { to, userName, confirmationLink } = req.body;

    let transporter = nodemailer.createTransport({
      service: "gmail", // You can use other services or SMTP settings
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333333; text-align: center;">Welcome to Our Service, ${userName}!</h2>
          <p style="color: #555555;">Thank you for signing up. Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; border-radius: 5px; text-decoration: none;">Confirm Email</a>
          </div>
          <p style="color: #555555;">If you did not sign up for this account, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <footer style="color: #999999; text-align: center;">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            <p>
              <a href="https://yourcompany.com" style="color: #007bff; text-decoration: none;">Visit our website</a> | 
              <a href="https://yourcompany.com/unsubscribe" style="color: #007bff; text-decoration: none;">Unsubscribe</a>
            </p>
          </footer>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"Your Company" <${process.env.EMAIL_USER}>`, // sender address
        to, // list of receivers
        subject: "Confirm Your Email", // Subject line
        html: htmlContent, // html body
      });

      res.status(200).json({ message: "Confirmation email sent successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};

module.exports = {
   handler
  };
  