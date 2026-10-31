import "dotenv/config";

import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";

const PORT =
  process.env.PORT || 4003;

const startServer =
  async () => {
    try {
      await connectDatabase();

      app.listen(
        PORT,
        () => {
          console.log(
            `Invoice Service running on port ${PORT}`
          );
        }
      );
    } catch (error) {
      console.error(
        "Failed to start Invoice Service:",
        error
      );

      process.exit(1);
    }
  };

startServer();