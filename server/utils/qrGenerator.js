import QRCode from 'qrcode';

export const generateQRCodeDataURI = async (text) => {
  try {
    const dataUri = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#121413',
        light: '#FFFFFF'
      }
    });
    return dataUri;
  } catch (err) {
    console.error('QR Code Generation Error:', err);
    throw err;
  }
};
