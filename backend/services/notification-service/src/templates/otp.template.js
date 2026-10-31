const otpTemplate = ({ otp, purpose }) => {
  let purposeText = "verification";

  if (purpose === "PASSWORD_RESET") {
    purposeText = "password reset";
  }

  if (purpose === "LOGIN") {
    purposeText = "login";
  }

  return {
    subject: `IRIS - Your OTP for ${purposeText}`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        
        <h2>IRIS Invoice Management System</h2>

        <p>Hello,</p>

        <p>
          Your OTP for <strong>${purposeText}</strong> is:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 25px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.
        </p>

        <p>
          Do not share this OTP with anyone.
        </p>

        <p>
          Regards,<br>
          IRIS System
        </p>

      </div>
    `
  };
};

export default otpTemplate;