const mongoose = require("mongoose");
const configuration = require("./configuration");

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(configuration.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected");
  } catch (error) {
    console.log(`Error to connect MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
