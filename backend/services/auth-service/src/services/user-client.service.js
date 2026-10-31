import internalClient from "./internal-client.service.js";

const createUserProfile = async ({
  employeeId,
  name,
  email,
  mobile,
  role,
  department,
  designation,
  requestId,
}) => {
  const payload = {
    employeeId,
    name,
    email,
    mobile,
    role,
    department,
    designation,
  };

  const response = await internalClient.post(
    `${process.env.USER_SERVICE_URL}/api/v1/internal/users`,
    payload,
    {
      requestId,
    }
  );

  return response.data.data;
};


export { createUserProfile };