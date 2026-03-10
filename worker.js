const connectDB = require("./config/db");
connectDB();

require("./jobs/syncDashData")
require("./jobs/updateSession")