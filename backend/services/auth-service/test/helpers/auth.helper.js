import request from "supertest";

export const createTestUser = async (
  app,
  overrides = {}
) => {
  const timestamp = Date.now();

  const user = {
    employeeId: `TEST${timestamp}`,
    name: "Test User",
    email: `test${timestamp}@example.com`,
    mobile: "9876543210",
    password: "TestPassword123",
    department: "Finance",
    ...overrides,
  };

  const response = await request(app)
    .post("/api/v1/auth/register")
    .send(user);

  return {
    user,
    response,
  };
};

export const loginTestUser = async (
  app,
  identifier,
  password
) => {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({
      identifier,
      password,
    });

  return response;
};