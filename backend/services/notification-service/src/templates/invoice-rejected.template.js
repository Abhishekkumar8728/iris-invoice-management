const invoiceRejectedTemplate = ({
  invoiceNumber,
  vendorName,
  rejectionReason
}) => {
  return {
    subject: `Invoice ${invoiceNumber} Rejected`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

        <h2>Invoice Rejected</h2>

        <p>Hello,</p>

        <p>
          Your invoice requires correction before it can be processed.
        </p>

        <table cellpadding="8">

          <tr>
            <td><strong>Invoice Number</strong></td>
            <td>${invoiceNumber}</td>
          </tr>

          <tr>
            <td><strong>Vendor</strong></td>
            <td>${vendorName}</td>
          </tr>

          <tr>
            <td><strong>Reason</strong></td>
            <td>${rejectionReason}</td>
          </tr>

        </table>

        <p>
          Please review and resubmit the invoice.
        </p>

        <p>
          Regards,<br>
          IRIS Invoice System
        </p>

      </div>
    `
  };
};

export default invoiceRejectedTemplate;