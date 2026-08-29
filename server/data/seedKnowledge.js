import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/database.js";
import Subject from "../models/Subject.js";
import Knowledge from "../models/Knowledge.js";

dotenv.config();

const knowledgeData = {
  Python: [
    {
      title: "Python Introduction",
      question: "What is Python?",
      answer:
        "Python is a high-level, interpreted and general-purpose programming language known for its simple syntax and readability. It is widely used in web development, data science, automation, artificial intelligence and machine learning.",
      keywords: ["python", "programming", "language", "interpreted"],
      topic: "Python Basics",
      difficulty: "beginner"
    },
    {
      title: "Python Variables",
      question: "What is a variable in Python?",
      answer:
        "A variable in Python is a name that refers to an object stored in memory. Python uses dynamic typing, so the type of a variable is determined automatically at runtime.",
      keywords: ["variable", "python", "datatype", "memory"],
      topic: "Python Basics",
      difficulty: "beginner"
    },
    {
      title: "Python Functions",
      question: "What is a function in Python?",
      answer:
        "A function is a reusable block of code designed to perform a specific task. Python functions are defined using the def keyword and can accept parameters and return values.",
      keywords: ["function", "def", "parameter", "return"],
      topic: "Functions",
      difficulty: "beginner"
    },
    {
      title: "Python List",
      question: "What is a list in Python?",
      answer:
        "A list is an ordered and mutable collection in Python. It can contain multiple values, including values of different data types, and is created using square brackets.",
      keywords: ["list", "collection", "mutable", "array"],
      topic: "Data Structures",
      difficulty: "beginner"
    },
    {
      title: "Python OOP",
      question: "What is object oriented programming in Python?",
      answer:
        "Object-oriented programming in Python is a programming approach based on classes and objects. It supports concepts such as encapsulation, inheritance, polymorphism and abstraction.",
      keywords: ["oops", "class", "object", "inheritance", "polymorphism"],
      topic: "Object Oriented Programming",
      difficulty: "intermediate"
    }
  ],

  DBMS: [
    {
      title: "DBMS Introduction",
      question: "What is DBMS?",
      answer:
        "A Database Management System is software used to create, store, organize, retrieve and manage data in databases. Examples include MySQL, PostgreSQL and MongoDB.",
      keywords: ["dbms", "database", "data", "management"],
      topic: "DBMS Basics",
      difficulty: "beginner"
    },
    {
      title: "Database Normalization",
      question: "What is normalization in DBMS?",
      answer:
        "Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity. It commonly involves normal forms such as 1NF, 2NF and 3NF.",
      keywords: ["normalization", "redundancy", "1nf", "2nf", "3nf"],
      topic: "Normalization",
      difficulty: "intermediate"
    },
    {
      title: "Primary Key",
      question: "What is a primary key?",
      answer:
        "A primary key is a column or combination of columns that uniquely identifies each record in a table. A primary key cannot contain duplicate values.",
      keywords: ["primary", "key", "unique", "table", "record"],
      topic: "Keys",
      difficulty: "beginner"
    },
    {
      title: "SQL",
      question: "What is SQL?",
      answer:
        "SQL stands for Structured Query Language. It is used to create, read, update and delete data in relational databases and to define and manage database structures.",
      keywords: ["sql", "query", "database", "relational"],
      topic: "SQL",
      difficulty: "beginner"
    },
    {
      title: "Transactions",
      question: "What is a transaction in DBMS?",
      answer:
        "A transaction is a sequence of database operations treated as a single logical unit of work. Database transactions are commonly described using ACID properties: atomicity, consistency, isolation and durability.",
      keywords: ["transaction", "acid", "atomicity", "consistency"],
      topic: "Transactions",
      difficulty: "intermediate"
    }
  ],

  "Machine Learning": [
    {
      title: "Machine Learning",
      question: "What is machine learning?",
      answer:
        "Machine learning is a branch of artificial intelligence in which computers learn patterns from data to make predictions or decisions without being explicitly programmed for every case.",
      keywords: ["machine", "learning", "ai", "data", "prediction"],
      topic: "ML Basics",
      difficulty: "beginner"
    },
    {
      title: "Supervised Learning",
      question: "What is supervised learning?",
      answer:
        "Supervised learning is a machine learning approach in which a model learns from labelled training data. Common supervised learning tasks include classification and regression.",
      keywords: ["supervised", "labelled", "classification", "regression"],
      topic: "Learning Types",
      difficulty: "beginner"
    },
    {
      title: "Unsupervised Learning",
      question: "What is unsupervised learning?",
      answer:
        "Unsupervised learning works with data that does not have labelled outputs. The algorithm attempts to discover hidden patterns or structures, such as clusters, within the data.",
      keywords: ["unsupervised", "clustering", "patterns", "unlabelled"],
      topic: "Learning Types",
      difficulty: "beginner"
    },
    {
      title: "Training Data",
      question: "What is training data in machine learning?",
      answer:
        "Training data is the dataset used to teach a machine learning model. The model uses patterns in the training data to learn relationships that can later be applied to new data.",
      keywords: ["training", "data", "model", "dataset"],
      topic: "ML Basics",
      difficulty: "beginner"
    },
    {
      title: "Overfitting",
      question: "What is overfitting in machine learning?",
      answer:
        "Overfitting occurs when a machine learning model learns the training data too closely, including noise and specific patterns, and therefore performs poorly on unseen data.",
      keywords: ["overfitting", "model", "training", "generalization"],
      topic: "Model Evaluation",
      difficulty: "intermediate"
    }
  ],

  "Operating Systems": [
    {
      title: "Operating System",
      question: "What is an operating system?",
      answer:
        "An operating system is system software that manages computer hardware and provides services to application programs. It manages resources such as CPU, memory, storage and devices.",
      keywords: ["operating", "system", "os", "hardware", "software"],
      topic: "OS Basics",
      difficulty: "beginner"
    },
    {
      title: "Process",
      question: "What is a process in operating system?",
      answer:
        "A process is a program that is currently being executed. A process has its own execution state and may contain resources such as memory and open files.",
      keywords: ["process", "program", "execution", "cpu"],
      topic: "Processes",
      difficulty: "beginner"
    },
    {
      title: "Thread",
      question: "What is a thread?",
      answer:
        "A thread is the smallest unit of execution within a process. Multiple threads of the same process can share resources while performing different execution tasks.",
      keywords: ["thread", "process", "execution", "multithreading"],
      topic: "Processes and Threads",
      difficulty: "beginner"
    },
    {
      title: "CPU Scheduling",
      question: "What is CPU scheduling?",
      answer:
        "CPU scheduling is the process used by an operating system to select which ready process should receive CPU time. Common algorithms include FCFS, SJF, Round Robin and Priority Scheduling.",
      keywords: ["cpu", "scheduling", "fcfs", "sjf", "round robin"],
      topic: "CPU Scheduling",
      difficulty: "intermediate"
    },
    {
      title: "Deadlock",
      question: "What is deadlock in operating system?",
      answer:
        "Deadlock is a situation in which two or more processes are permanently waiting for resources held by one another, so none of the processes can continue.",
      keywords: ["deadlock", "process", "resource", "waiting"],
      topic: "Deadlocks",
      difficulty: "intermediate"
    }
  ],

  "Computer Networks": [
    {
      title: "Computer Network",
      question: "What is a computer network?",
      answer:
        "A computer network is a collection of interconnected devices that communicate and share data and resources using communication protocols.",
      keywords: ["network", "computer", "communication", "devices"],
      topic: "Networking Basics",
      difficulty: "beginner"
    },
    {
      title: "TCP",
      question: "What is TCP?",
      answer:
        "TCP, or Transmission Control Protocol, is a connection-oriented transport protocol that provides reliable and ordered delivery of data between applications.",
      keywords: ["tcp", "transport", "reliable", "connection"],
      topic: "Transport Layer",
      difficulty: "beginner"
    },
    {
      title: "UDP",
      question: "What is UDP?",
      answer:
        "UDP, or User Datagram Protocol, is a connectionless transport protocol that provides faster communication without guaranteeing delivery, ordering or retransmission.",
      keywords: ["udp", "transport", "connectionless", "datagram"],
      topic: "Transport Layer",
      difficulty: "beginner"
    },
    {
      title: "IP Address",
      question: "What is an IP address?",
      answer:
        "An IP address is a logical address assigned to a device on a network. It helps identify the device and allows data to be routed to the correct destination.",
      keywords: ["ip", "address", "network", "routing"],
      topic: "Network Layer",
      difficulty: "beginner"
    },
    {
      title: "HTTP",
      question: "What is HTTP?",
      answer:
        "HTTP stands for Hypertext Transfer Protocol. It is an application-layer protocol used for communication between clients and servers, especially for web resources.",
      keywords: ["http", "web", "protocol", "client", "server"],
      topic: "Application Layer",
      difficulty: "beginner"
    }
  ]
};

const seedKnowledge = async () => {
  try {
    await connectDB();

    await Knowledge.deleteMany({});

    let totalInserted = 0;

    for (const [subjectName, entries] of Object.entries(knowledgeData)) {
      const subject = await Subject.findOne({
        name: subjectName
      });

      if (!subject) {
        console.log(`Subject not found: ${subjectName}`);
        continue;
      }

      const documents = entries.map((entry) => ({
        ...entry,
        subject: subject._id,
        source: "EduBot Knowledge Base"
      }));

      const inserted = await Knowledge.insertMany(documents);

      totalInserted += inserted.length;
    }

    console.log(
      `${totalInserted} knowledge records inserted successfully`
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Knowledge seeding failed:", error);

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedKnowledge();