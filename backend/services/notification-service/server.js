import "dotenv/config";

import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";
import {initializeEmailTransporter} from "./src/services/email.service.js";

const PORT =
  process.env.PORT || 4004;

const startServer = async () => {

  await connectDatabase();

  initializeEmailTransporter();

  app.listen(
    PORT,
    () => {
      console.log(
        `Notification Service running on port ${PORT}`
      );
    }
  );
};

startServer();