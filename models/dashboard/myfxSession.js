const mongoose = require("mongoose");

const myFxSession = new mongoose.Schema(
  {
    email : {
        type : String,
        default : null
    },
    password : {
        type : String,
        default : null
    },
    session : {
        type : String,
        required : true,
        default : ""
    },
  },
  {
    timestamps: true,
  }
);

const MyFxSession = mongoose.model("myfxsession", myFxSession);
module.exports = MyFxSession;
