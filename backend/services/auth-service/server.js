import "dotenv/config";

import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";

const PORT =
  process.env.PORT || 4001;

const startServer = async () => {
  await connectDatabase();

  app.listen(
    PORT,
    () => {
      console.log(
        `Auth Service running on port ${PORT}`
      );
    }
  );
};

startServer();