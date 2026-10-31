import { v4 as uuidv4 } from "uuid";

const MAX_REQUEST_ID_LENGTH = 100;

const requestIdMiddleware = (
  req,
  res,
  next
) => {
  const incomingRequestId =
    req.headers["x-request-id"];

  const isValidRequestId =
    typeof incomingRequestId === "string" &&
    incomingRequestId.length > 0 &&
    incomingRequestId.length <=
      MAX_REQUEST_ID_LENGTH;

  const requestId =
    isValidRequestId
      ? incomingRequestId
      : uuidv4();

  req.requestId = requestId;

  res.setHeader(
    "x-request-id",
    requestId
  );

  next();
};

export default requestIdMiddleware;