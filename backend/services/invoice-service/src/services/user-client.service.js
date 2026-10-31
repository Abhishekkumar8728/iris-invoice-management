import client from "./internal-client.service.js";

const getUserByEmployeeId =
  async ({
    employeeId,
    requestId
  }) => {

    const response =
      await client.get(
        `${process.env.USER_SERVICE_URL}/api/v1/internal/users/employee/${encodeURIComponent(employeeId)}`,
        {
          requestId
        }
      );

    return response.data.data;
  };

export {
  getUserByEmployeeId
};