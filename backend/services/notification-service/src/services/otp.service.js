import OTP from "../models/otp.model.js";
import Notification from "../models/notification.model.js";
import {generateOtp, hashOtp} from "../utils/otp.js";
import otpTemplate from "../templates/otp.template.js";
import {sendEmail} from "./email.service.js";

const createOtp = async ({
  userId,
  identifier,
  purpose
}) => {
  const normalizedIdentifier = identifier.toLowerCase();
  const cooldownSeconds = Number(
    process.env.OTP_SEND_COOLDOWN_SECONDS || 60
  );
  const recentOtp = await OTP.findOne({
    identifier: normalizedIdentifier,
    purpose,
    createdAt: {
      $gte: new Date(Date.now() - cooldownSeconds * 1000)
    },
    used: false
  });

  if (recentOtp) {
    throw new Error(
      "Please wait before requesting another OTP"
    );
  }

  await OTP.updateMany(
    {
      identifier: normalizedIdentifier,
      purpose,
      used: false
    },
    {
      $set: {
        used: true
      }
    }
  );

  const otp = generateOtp();

  const otpHash = hashOtp(otp);

  const expiryMinutes =
    Number(process.env.OTP_EXPIRY_MINUTES || 10);

  const expiresAt = new Date(
    Date.now() + expiryMinutes * 60 * 1000
  );

  const otpDocument = await OTP.create({
    userId,
    identifier: identifier.toLowerCase(),
    otpHash,
    purpose,
    expiresAt,
    maxAttempts: Number(
      process.env.OTP_MAX_ATTEMPTS || 5
    )
  });

  const template = otpTemplate({
    otp,
    purpose
  });

  const notification = await Notification.create({
    type: purpose === "PASSWORD_RESET"
      ? "PASSWORD_RESET"
      : "OTP",

    channel: "EMAIL",

    recipient: identifier,

    subject: template.subject,

    template: "otp",

    payload: {
      purpose
    },

    relatedEntity: {
      entityType: "OTP",
      entityId: otpDocument._id.toString()
    }
  });

  try {

    await sendEmail({
      to: identifier,
      subject: template.subject,
      html: template.html
    });

    notification.status = "SENT";
    notification.sentAt = new Date();
    notification.attempts += 1;

    await notification.save();

  } catch (error) {

    notification.status = "FAILED";
    notification.failedAt = new Date();
    notification.attempts += 1;
    notification.errorMessage = error.message;

    await notification.save();

    throw error;
  }

  const result = {
    otpId: otpDocument._id
  };

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_RETURN_OTP === "true"
  ) {
    result.devOtp = otp;
  }

  return result;
};

const verifyOtp = async ({
  identifier,
  purpose,
  otp
}) => {

  const otpDocument = await OTP.findOne({
    identifier: identifier.toLowerCase(),
    purpose,
    used: false
  }).sort({
    createdAt: -1
  });

  if (!otpDocument) {
    throw new Error("OTP not found or already used");
  }

  if (otpDocument.expiresAt < new Date()) {
    otpDocument.used = true;

    await otpDocument.save();

    throw new Error("OTP has expired");
  }

  if (otpDocument.attempts >= otpDocument.maxAttempts) {
    otpDocument.used = true;

    await otpDocument.save();

    throw new Error("Maximum OTP attempts exceeded");
  }

  const otpHash = hashOtp(otp);

  otpDocument.attempts += 1;

  if (otpHash !== otpDocument.otpHash) {
    await otpDocument.save();

    throw new Error("Invalid OTP");
  }

  otpDocument.used = true;
  otpDocument.verifiedAt = new Date();

  await otpDocument.save();

  return {
    verified: true,
    otpId: otpDocument._id
  };
};

export {
  createOtp,
  verifyOtp
};