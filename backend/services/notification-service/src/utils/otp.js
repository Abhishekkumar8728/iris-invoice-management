import crypto from "crypto";

const generateOtp = () => {
  const length = Number(process.env.OTP_LENGTH || 6);

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return crypto.randomInt(min, max + 1).toString();
};

const hashOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

export {
  generateOtp,
  hashOtp
};