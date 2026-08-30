import "dotenv/config";

import mongoose from "mongoose";

import connectDB from "../config/database.js";
import Knowledge from "../models/Knowledge.js";

import {
  createEmbeddings
} from "../services/embeddingService.js";

import {
  buildKnowledgeText
} from "../services/knowledgeTextService.js";


const BATCH_SIZE = 20;


const generateEmbeddings = async () => {
  try {

    // Connect to MongoDB
    await connectDB();


    // Get active knowledge records
    const records =
      await Knowledge.find({
        isActive: true
      }).lean();


    // Check records
    if (!records.length) {

      console.log(
        "No knowledge records found."
      );

      await mongoose.connection.close();

      process.exit(0);
    }


    console.log(
      `Found ${records.length} knowledge records.`
    );


    // Process in batches
    for (
      let i = 0;
      i < records.length;
      i += BATCH_SIZE
    ) {

      const batch =
        records.slice(
          i,
          i + BATCH_SIZE
        );


      // Build text for embedding
      const texts =
        batch.map(
          buildKnowledgeText
        );


      console.log(
        `Generating embeddings ${
          i + 1
        }-${Math.min(
          i + BATCH_SIZE,
          records.length
        )}...`
      );


      // Generate embeddings
      const embeddings =
        await createEmbeddings(
          texts
        );


      // Save embeddings
      for (
        let j = 0;
        j < batch.length;
        j++
      ) {

        if (!embeddings[j]) {
          console.warn(
            `Embedding missing for record ${batch[j]._id}`
          );

          continue;
        }


        await Knowledge.updateOne(
          {
            _id: batch[j]._id
          },
          {
            $set: {
              embedding:
                embeddings[j]
            }
          }
        );
      }


      console.log(
        `Batch ${
          Math.floor(i / BATCH_SIZE) + 1
        } completed.`
      );
    }


    console.log(
      "All embeddings generated successfully."
    );


    await mongoose.connection.close();

    process.exit(0);

  } catch (error) {

    console.error(
      "Embedding generation failed:",
      error.message
    );

    console.error(error);

    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error(
        "Database close error:",
        closeError.message
      );
    }

    process.exit(1);
  }
};


generateEmbeddings();