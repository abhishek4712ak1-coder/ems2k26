import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.DB_URL) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const connection = await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      family: 4,
    });

    if(connection){
        const readyState = 1;
    }

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );

    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);


    process.exit(1);
  }
};

// Handle unexpected connection errors
mongoose.connection.on("error", (error) => {
  console.error("MongoDB runtime error:", error.message);
});

// Handle connection loss
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

// Handle successful reconnection
mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});


export default connectDB;