const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('📧 Email server is ready to send messages');
  }
});

const sendWelcomeEmail = async (email, name, accountNumber) => {
  try {
    const mailOptions = {
      from: `"CBI Bank" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to CBI Bank! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to CBI Bank!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name}!</h2>
            <p>Congratulations! Your account has been successfully created.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Account Details:</h3>
              <p><strong>Account Number:</strong> ${accountNumber}</p>
              <p><strong>Account Type:</strong> Savings Account</p>
              <p><strong>Welcome Bonus:</strong> ₹1,000</p>
            </div>
            <p>You can now:</p>
            <ul>
              <li>Transfer money to other accounts</li>
              <li>Create Fixed Deposits</li>
              <li>Request ATM Cards</li>
              <li>View transaction history</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Access Your Dashboard
              </a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>CBI Bank Team</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', email);
  } catch (error) {
    console.error('❌ Welcome email error:', error);
    throw error;
  }
};

const sendContactResponse = async (email, name, subject, responseMessage, ticketNumber) => {
  try {
    const mailOptions = {
      from: `"CBI Bank Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `Re: ${subject} [Ticket: ${ticketNumber}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>CBI Bank Support</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name},</h2>
            <p>Thank you for contacting CBI Bank. We have received your inquiry and here's our response:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Inquiry:</h3>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
            </div>
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3>Our Response:</h3>
              <p>${responseMessage}</p>
            </div>
            <p>If you need further assistance, please reply to this email or contact our support team.</p>
            <p>Best regards,<br>CBI Bank Support Team</p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>Ticket Number: ${ticketNumber}</p>
            <p>Support Email: ${process.env.EMAIL_FROM}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Contact response email sent to:', email);
  } catch (error) {
    console.error('❌ Contact response email error:', error);
    throw error;
  }
};

const sendTransactionAlert = async (email, name, transaction) => {
  try {
    const isCredit = transaction.type === 'credit';
    const color = isCredit ? '#10b981' : '#ef4444';
    const symbol = isCredit ? '+' : '-';

    const mailOptions = {
      from: `"CBI Bank Alerts" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `Transaction Alert: ${isCredit ? 'Money Received' : 'Money Sent'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
            <h1>Transaction Alert</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name},</h2>
            <p>A transaction has been processed on your account:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: ${color};">${symbol}₹${transaction.amount}</h3>
              <p><strong>Type:</strong> ${transaction.type}</p>
              <p><strong>Description:</strong> ${transaction.description}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Reference:</strong> ${transaction.reference}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/transactions" 
                 style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                View Transaction History
              </a>
            </div>
            <p>If you did not authorize this transaction, please contact us immediately.</p>
            <p>Best regards,<br>CBI Bank Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Transaction alert sent to:', email);
  } catch (error) {
    console.error('❌ Transaction alert error:', error);
    // Don't throw error for alerts, just log it
  }
};

module.exports = {
  sendWelcomeEmail,
  sendContactResponse,
  sendTransactionAlert
};