import { successResponse, errorResponse } from "../utils/response.js";
import { getChatbotResponse } from "../services/chatbot.service.js";

const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return errorResponse(
        res,
        "Message is required",
        400
      );
    }

    const response = await getChatbotResponse(
      message,
      req.user
    );

    return successResponse(
      res,
      response,
      "Chatbot response generated successfully"
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      error.statusCode || 500
    );
  }
};

export {
  chat,
};