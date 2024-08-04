const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const morgan = require("morgan");
const cors = require("cors");
const app = express();
const userRouter = require("./routes/userRoute");
const adminRouter = require("./routes/adminRoute");
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

app.use("/admin", adminRouter);
app.use("/", userRouter);


const port = process.env.DB_URL?process.env.DB_URL:4000;
app.listen(port, () => console.log(`server is running in port ${port}`));
