const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const employeeIdRegex =
  /^[A-Za-z0-9_-]{2,30}$/;

const mobileRegex =
  /^[6-9]\d{9}$/;

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


const error = (field, message) => ({
  field,
  message
});


export const validateLogin = (req) => {

  const {
    identifier,
    password
  } = req.body || {};

  const errors = [];

  if (
    typeof identifier !== "string" ||
    !identifier.trim()
  ) {
    errors.push(
      error(
        "identifier",
        "Employee ID or email is required."
      )
    );
  }

  if (
    typeof password !== "string" ||
    !password
  ) {
    errors.push(
      error(
        "password",
        "Password is required."
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
};


export const validateRegister = (req) => {

  const {
    employeeId,
    name,
    email,
    mobile,
    password,
    department
  } = req.body || {};

  const errors = [];

  if (
    typeof employeeId !== "string" ||
    !employeeIdRegex.test(employeeId.trim())
  ) {
    errors.push(
      error(
        "employeeId",
        "Invalid employee ID."
      )
    );
  }

  if (
    typeof name !== "string" ||
    name.trim().length < 2
  ) {
    errors.push(
      error(
        "name",
        "Name must contain at least 2 characters."
      )
    );
  }

  if (
    typeof email !== "string" ||
    !emailRegex.test(email.trim())
  ) {
    errors.push(
      error(
        "email",
        "A valid email address is required."
      )
    );
  }

  if (
    mobile !== undefined &&
    mobile !== null &&
    mobile !== "" &&
    (
      typeof mobile !== "string" ||
      !mobileRegex.test(mobile.trim())
    )
  ) {
    errors.push(
      error(
        "mobile",
        "Invalid mobile number."
      )
    );
  }

  if (
    typeof password !== "string" ||
    !passwordRegex.test(password)
  ) {
    errors.push(
      error(
        "password",
        "Password must contain at least 8 characters, including uppercase, lowercase and a number."
      )
    );
  }

  if (
    department !== undefined &&
    department !== null &&
    typeof department !== "string"
  ) {
    errors.push(
      error(
        "department",
        "Department must be a string."
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
};


export const validateForgotPassword = (req) => {

  const {
    email
  } = req.body || {};

  const errors = [];

  if (
    typeof email !== "string" ||
    !emailRegex.test(email.trim())
  ) {
    errors.push(
      error(
        "email",
        "A valid email address is required."
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
};


export const validateResetPassword = (req) => {

  const {
    email,
    otp,
    newPassword
  } = req.body || {};

  const errors = [];

  if (
    typeof email !== "string" ||
    !emailRegex.test(email.trim())
  ) {
    errors.push(
      error(
        "email",
        "A valid email address is required."
      )
    );
  }

  if (
    typeof otp !== "string" ||
    !/^\d{6}$/.test(otp.trim())
  ) {
    errors.push(
      error(
        "otp",
        "OTP must contain exactly 6 digits."
      )
    );
  }

  if (
    typeof newPassword !== "string" ||
    !passwordRegex.test(newPassword)
  ) {
    errors.push(
      error(
        "newPassword",
        "Password must contain at least 8 characters, including uppercase, lowercase and a number."
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
};