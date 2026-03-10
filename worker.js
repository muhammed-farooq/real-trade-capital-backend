const connectDB = require("./config/db");
connectDB();
require("./cronjobs/myfxBookSession")

