const nodemailer = require("nodemailer");
const config = require("config");

// Function to send email
function deliverEmail(toAddress, fromAddress, subject, content) {
  return new Promise((resolve, reject) => {
    // Set SMTP properties for sendig
    const smtpServer = config.get("smtp_server");
    const smtpPort = config.get("smtp_port");
    const smtpUser = config.get("smtp_user");
    const smtpPassword = config.get("smtp_password");
    // console.log(
    //   "Here in deliverEmail.js - smtpServer, smtpUser ",
    //   smtpServer,
    //   smtpUser,
    // );
    // Create a transporter using SMTP transport
    const transporter = nodemailer.createTransport({
      host: smtpServer, // Your SMTP server address
      port: smtpPort, // Your SMTP server port
      secure: false, // Set to true if using a secure connection (TLS/SSL)
      auth: {
        user: smtpUser, // Your email address
        pass: smtpPassword, // Your email password or API key
      },
    });

    // Setup email data
    const mailOptions = {
      from: fromAddress, // Sender address
      to: toAddress, // Recipient address
      subject: subject, // Subject line
      text: content, // Plain text body
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        // console.error("Error sending email:", error);
        reject({ deliverySuccess: false, error });
      } else {
        // console.log("Email sent:", info.response);
        resolve({ deliverySuccess: true, info });
      }
    });
  });
}

module.exports = { deliverEmail: deliverEmail };
