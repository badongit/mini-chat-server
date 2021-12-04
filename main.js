const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const configuration = require("./configs/configuration");
const connectDB = require("./configs/database");
const router = require("./routes");
const fileupload = require("express-fileupload");
const chatServer = require("./socket/chatServer");
const cleanTempSchedule = require("./helpers/cleanTempSchedule");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: "./public/tmp",
  })
);

app.use(express.static("public"));

connectDB();
router(app);
cleanTempSchedule();

const port = configuration.PORT;

const server = app.listen(port, () => {
  console.log(`Server running at port: ${port}`);
});

chatServer.listen(server);

process.on("unhandledRejection", (error, promise) => {
  console.log(`Error: ${error.message}`);

  server.close(() => process.exit(1));
});
