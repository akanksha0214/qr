import React from 'react';

const PrintableReceipt = ({ order, restaurant, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order || !restaurant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Print Styles */}
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-receipt, .print-receipt * {
              visibility: visible;
            }
            .print-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
          .print-receipt {
            padding: 20px;
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-subtitle {
            font-size: 12px;
            margin-bottom: 3px;
          }
          .order-info {
            margin-bottom: 15px;
            font-size: 12px;
          }
          .order-info div {
            margin-bottom: 3px;
          }
          .items-list {
            margin-bottom: 15px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
          }
          .item-name {
            flex: 1;
          }
          .item-qty {
            margin-right: 10px;
          }
          .item-price {
            text-align: right;
            min-width: 50px;
          }
          .total-section {
            border-top: 2px dashed #000;
            padding-top: 10px;
            margin-bottom: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
          }
          .grand-total {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
          }
          .receipt-footer {
            text-align: center;
            font-size: 11px;
            margin-top: 20px;
            border-top: 2px dashed #000;
            padding-top: 10px;
          }
        `}</style>

        {/* Printable Receipt Content */}
        <div className="print-receipt">
          <div className="receipt-header">
            <div className="receipt-title">{restaurant.name}</div>
            <div className="receipt-subtitle">{restaurant.address}</div>
            <div className="receipt-subtitle">{restaurant.phone}</div>
          </div>

          <div className="order-info">
            <div><strong>ORDER #: {order._id.slice(-8).toUpperCase()}</strong></div>
            <div>Date & Time: {formatDate(order.createdAt)}</div>
            <div>Table {order.tableNumber} | {order.customerName}</div>
          </div>

          <div className="items-list">
            <div style={{fontWeight: 'bold', marginBottom: '8px', fontSize: '12px'}}>ORDER ITEMS:</div>
            {order.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-name">{item.name}</div>
                <div className="item-qty">{item.quantity}x</div>
                <div className="item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="total-section">
            <div className="total-row">
              <div>Subtotal:</div>
              <div>₹{order.subtotal.toFixed(2)}</div>
            </div>
            <div className="total-row">
              <div>Tax (10%):</div>
              <div>₹{order.tax.toFixed(2)}</div>
            </div>
            <div className="total-row grand-total">
              <div>TOTAL:</div>
              <div>₹{order.total.toFixed(2)}</div>
            </div>
          </div>

          <div className="receipt-footer">
            <div>Thank you for your order!</div>
            <div>Please come again</div>
          </div>
        </div>

        {/* Control Buttons (Hidden when printing) */}
        <div className="no-print p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintableReceipt;
