import client from "./internal-client.service.js";

const notifyInvoiceStatus = async ({
  type,
  recipient,
  template,
  invoice,
  rejectionReason,
  requestId
}) => {

  const payload = {
    invoiceNumber:
      invoice.invoiceNumber,

    vendorName:
      invoice.vendor.name,

    totalAmount:
      invoice.amounts.totalAmount,

    rejectionReason
  };

  const response =
    await client.post(
      `${process.env.NOTIFICATION_SERVICE_URL}/api/v1/internal/notifications/send`,
      {
        type,
        channel: "EMAIL",
        recipient,
        template,
        payload,

        relatedEntity: {
          entityType: "INVOICE",
          entityId:
            invoice._id.toString()
        }
      },
      {
        requestId
      }
    );

  return response.data;
};

export {
  notifyInvoiceStatus
};