import { ExpressApp } from "./express-app";
import { logger } from "./utils";
import * as dotenv from 'dotenv';
import { ConnectWithDB } from "./db";

dotenv.config();
const PORT = process.env.PORT || 3000;

export const StartServer = async () => {
  const expressApp = await ExpressApp();
  expressApp.listen(PORT, () => {
    logger.info(`App is listening to ${PORT}`);
  });
  ConnectWithDB();
  process.on("uncaughtException", async (err) => {
    logger.error(err);
    process.exit(1);
  });
};

StartServer().then(() => {
  logger.info("server is up");
});
