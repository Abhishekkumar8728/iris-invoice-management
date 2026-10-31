import "dotenv/config";

import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";

const PORT =
  process.env.PORT || 4002;

const startServer =
  async () => {
    try {
      await connectDatabase();

      app.listen(
        PORT,
        () => {
          console.log(
            `User Service running on port ${PORT}`
          );
        }
      );
    } catch (error) {
      console.error(
        "Failed to start User Service:",
        error
      );

      process.exit(1);
    }
  };

startServer();