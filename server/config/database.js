import mongoose from "mongoose";

const connectDB = async () => {

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not configured"
    );
  }


  try {

    const connection =
      await mongoose.connect(
        process.env.MONGODB_URI,
        {
          serverSelectionTimeoutMS: 10000
        }
      );


    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );


    return connection;

  } catch (error) {

    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
};

export default connectDB;