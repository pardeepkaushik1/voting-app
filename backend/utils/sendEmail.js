const transporter = require("../config/mailer");

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Voting App - Email Verification OTP",
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP for email verification is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `,
  });
};

module.exports = sendOTPEmail;