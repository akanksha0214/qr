const crypto = require('crypto');

function generateQRCodeId() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

function generateQRCodeUrl(qrCodeId) {
  // This would typically be your frontend URL
  return `https://your-domain.com/menu/₹{qrCodeId}`;
}

module.exports = {
  generateQRCodeId,
  generateQRCodeUrl
};
