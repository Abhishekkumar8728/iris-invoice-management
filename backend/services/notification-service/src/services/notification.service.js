import Notification from "../models/notification.model.js";
import {sendEmail} from "./email.service.js";
import invoiceApprovedTemplate from "../templates/invoice-approved.template.js";
import invoiceRejectedTemplate from "../templates/invoice-rejected.template.js";

const sendNotification = async ({
  type,
  channel,
  recipient,
  subject,
  template,
  payload,
  relatedEntity
}) => {

  const notification = await Notification.create({
    type,
    channel,
    recipient,
    subject,
    template,
    payload,
    relatedEntity
  });

  try {

    let emailSubject = subject;
    let emailHtml = "";

    switch (template) {

      case "invoice-approved":
        ({
          subject: emailSubject,
          html: emailHtml
        } = invoiceApprovedTemplate(payload));
        break;

      case "invoice-rejected":
        ({
          subject: emailSubject,
          html: emailHtml
        } = invoiceRejectedTemplate(payload));
        break;

      default:
        emailHtml = payload?.html || "<p>IRIS Notification</p>";
    }

    if (channel === "EMAIL") {

      await sendEmail({
        to: recipient,
        subject: emailSubject,
        html: emailHtml
      });
    }

    notification.status = "SENT";
    notification.sentAt = new Date();
    notification.attempts += 1;

    await notification.save();

    return notification;

  } catch (error) {

    notification.status = "FAILED";
    notification.failedAt = new Date();
    notification.attempts += 1;
    notification.errorMessage = error.message;

    await notification.save();

    throw error;
  }
};

const getNotificationHistory = async ({
  recipient,
  page = 1,
  limit = 20
}) => {

  const skip = (page - 1) * limit;

  const filter = {};

  if (recipient) {
    filter.recipient = recipient;
  }

  const [notifications, total] =
    await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter)
    ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export {
  sendNotification,
  getNotificationHistory
};