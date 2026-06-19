exports.welcomeTemplate = ({ name, email, password }) => {
  return `
    <h2>Welcome to Billing Software</h2>
    <p>Hello ${name},</p>
    <p>Your account has been created successfully.</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>Password:</b> ${password}</p>
    <p>Please login and change your password.</p>
  `;
};

exports.forgotPasswordTemplate = ({ name, otp }) => {
  return `
    <h2>Password Reset OTP</h2>
    <p>Hello ${name},</p>
    <p>Your OTP is:</p>
    <h1>${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
  `;
};

exports.invoiceTemplate = ({ customerName, invoiceNumber, grandTotal }) => {
  return `
    <h2>Invoice Generated</h2>
    <p>Hello ${customerName},</p>
    <p>Your invoice has been generated.</p>
    <p><b>Invoice No:</b> ${invoiceNumber}</p>
    <p><b>Total Amount:</b> ₹${grandTotal}</p>
  `;
};