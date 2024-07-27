const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const userRouter = require("./routes/userRoute");
const adminRouter = require("./routes/adminRoute");
// const providerRouter = require("./routes/providerRoute");
const { spawn } = require("child_process");

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

connectDB();
dotenv.config();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors(corsOptions));

// app.use("/provider", providerRouter);
app.use("/admin", adminRouter);
app.use("/", userRouter);

//CRON//

// const orderComplete = spawn("node", ["./controllers/cron"]);

// // orderComplete.stdout.on("data", (data) => {
// //   console.log(`stdout: ${data}`);
// // });

// // orderComplete.stderr.on("data", (data) => {
// //   console.error(`stderr: ${data}`);
// // });

// // orderComplete.on("close", (code) => {
// //   console.log(`Child process exited with code ${code}`);
// // });

const port = process.env.DB_URL?process.env.DB_URL:4000;
app.listen(port, () => console.log(`server is running in port ${port}`));
