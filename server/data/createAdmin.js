import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "../config/database.js";
import User from "../models/User.js";

dotenv.config();

const adminData = {
  name: "EduBot Admin",
  email: "admin@edubot.com",
  password: "Admin@123456"
};

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin =
      await User.findOne({
        email: adminData.email
      });

    if (existingAdmin) {
      console.log(
        "Admin account already exists."
      );

      await mongoose.connection.close();
      process.exit(0);
    }

    const hashedPassword =
      await bcrypt.hash(
        adminData.password,
        12
      );

    await User.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: "admin",
      isActive: true
    });

    console.log(
      "Admin account created successfully."
    );

    console.log(
      `Email: ${adminData.email}`
    );

    console.log(
      `Password: ${adminData.password}`
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "Admin creation failed:",
      error
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

createAdmin();