import internalClient from "./internal-client.service.js";

const sendOtp = async ({
  userId,
  email,
  purpose,
  requestId
}) => {

  const response =
    await internalClient.post(
      `${process.env.NOTIFICATION_SERVICE_URL}/api/v1/internal/notifications/otp/send`,
      {
        userId,
        identifier: email,
        purpose
      },
      {
        requestId
      }
    );

  return response.data.data;
};

const verifyOtp = async ({
  email,
  purpose,
  otp,
  requestId
}) => {

  const response =
    await internalClient.post(
      `${process.env.NOTIFICATION_SERVICE_URL}/api/v1/internal/notifications/otp/verify`,
      {
        identifier: email,
        purpose,
        otp
      },
      {
        requestId
      }
    );

  return response.data.data;
};

export {
  sendOtp,
  verifyOtp
};