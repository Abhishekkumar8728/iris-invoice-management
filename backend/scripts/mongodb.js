import net from "node:net";

export const assertMongoDBAvailable = async () => {
  const host = "127.0.0.1";
  const port = Number(process.env.MONGO_PORT || 27017);

  await new Promise((resolve, reject) => {
    const socket = new net.Socket();

    socket.setTimeout(2000);
    socket.once("connect", () => {
      socket.destroy();
      resolve();
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error(`MongoDB connection timed out at ${host}:${port}`));
    });
    socket.once("error", (error) => {
      reject(
        new Error(
          `MongoDB is not reachable at ${host}:${port}: ${error.message}`,
        ),
      );
    });
    socket.connect(port, host);
  });
};
