import nodemailer from "nodemailer";

let transporter = null;

const initializeEmailTransporter = () => {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("Email service is disabled");

    return;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  console.log("Email transporter initialized");
};

const sendEmail = async ({
  to,
  subject,
  html
}) => {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("EMAIL DISABLED");
    console.log("To:", to);
    console.log("Subject:", subject);

    return {
      messageId: "email-disabled"
    };
  }

  if (!transporter) {
    throw new Error("Email transporter is not initialized");
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });

  return {
    messageId: info.messageId
  };
};

export {
  initializeEmailTransporter,
  sendEmail
};