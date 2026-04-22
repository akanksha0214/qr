import React, { useState } from 'react';

const QRGenerator = ({ restaurant, onGenerate }) => {
  const [numberOfTables, setNumberOfTables] = useState('');
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTableQRs = () => {
    if (!numberOfTables || numberOfTables < 1) {
      alert('Please enter a valid number of tables');
      return;
    }

    setIsGenerating(true);
    const qrCodes = [];

    for (let i = 1; i <= numberOfTables; i++) {
      const tableNumber = `Table ${i}`;
      const menuUrl = `http://localhost:5173/menu/${restaurant.qrCodeId}?table=${encodeURIComponent(tableNumber)}`;
      
      qrCodes.push({
        tableNumber,
        qrCodeId: `${restaurant.qrCodeId}-T${i}`,
        menuUrl,
        downloadUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(menuUrl)}`
      });
    }

    setGeneratedQRs(qrCodes);
    setIsGenerating(false);
    onGenerate(qrCodes);
  };

  const downloadQRCode = (qrCode) => {
    const link = document.createElement('a');
    link.href = qrCode.downloadUrl;
    link.download = `${qrCode.tableNumber.replace(' ', '-')}-QR.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllQRs = () => {
    generatedQRs.forEach((qrCode, index) => {
      setTimeout(() => downloadQRCode(qrCode), index * 500); // Delay to avoid overwhelming the browser
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Generate Table QR Codes</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Tables:
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            min="1"
            max="50"
            value={numberOfTables}
            onChange={(e) => setNumberOfTables(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter number of tables"
          />
          <button
            onClick={generateTableQRs}
            disabled={isGenerating || !numberOfTables}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isGenerating ? 'Generating...' : 'Generate QRs'}
          </button>
        </div>
      </div>

      {generatedQRs.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Generated QR Codes ({generatedQRs.length})</h4>
            <button
              onClick={downloadAllQRs}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Download All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedQRs.map((qrCode) => (
              <div key={qrCode.qrCodeId} className="border border-gray-200 rounded-lg p-4">
                <div className="text-center mb-3">
                  <img
                    src={qrCode.downloadUrl}
                    alt={`${qrCode.tableNumber} QR Code`}
                    className="w-32 h-32 mx-auto border border-gray-300"
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-center mb-2">{qrCode.tableNumber}</p>
                  <p className="text-gray-600 text-xs mb-2 break-all">
                    {qrCode.menuUrl}
                  </p>
                  <button
                    onClick={() => downloadQRCode(qrCode)}
                    className="w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
