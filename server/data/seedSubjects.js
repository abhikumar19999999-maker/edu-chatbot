import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/database.js";
import Subject from "../models/Subject.js";

dotenv.config();

const subjects = [
  {
    name: "Python",
    description: "Python programming, syntax, functions, OOP and modules.",
    icon: "🐍"
  },
  {
    name: "DBMS",
    description: "Database management systems, SQL, normalization and transactions.",
    icon: "🗄️"
  },
  {
    name: "Machine Learning",
    description: "Machine learning concepts, algorithms and model evaluation.",
    icon: "🤖"
  },
  {
    name: "Operating Systems",
    description: "Processes, threads, memory management, scheduling and file systems.",
    icon: "💻"
  },
  {
    name: "Computer Networks",
    description: "Networking fundamentals, protocols, TCP/IP and network security basics.",
    icon: "🌐"
  }
];

const seedSubjects = async () => {
  try {
    await connectDB();

    await Subject.deleteMany({});

    const createdSubjects = await Subject.insertMany(subjects);

    console.log(
      `${createdSubjects.length} subjects inserted successfully`
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Subject seeding failed:", error);

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedSubjects();