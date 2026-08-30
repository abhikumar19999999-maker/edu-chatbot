// ==========================================
// retrievalService.js
// ==========================================

import natural from "natural";
import mongoose from "mongoose";

import Knowledge from "../models/Knowledge.js";

import {
  createEmbedding
} from "./embeddingService.js";

import {
  normalizeText
} from "./nlpService.js";


// ==========================================
// CONFIGURATION
// ==========================================

const VECTOR_INDEX_NAME =
  "knowledge_vector_index";

const VECTOR_PATH =
  "embedding";

const VECTOR_DIMENSIONS = 384;

const DEFAULT_LIMIT = 5;

const DEFAULT_NUM_CANDIDATES = 50;


// ==========================================
// HELPER
// ==========================================

const normalizeLimit = (limit) => {
  const parsed = Number(limit);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    Math.max(Math.floor(parsed), 1),
    20
  );
};


// ==========================================
// TF-IDF KEYWORD SEARCH
// ==========================================

const keywordSearch = async ({
  query,
  subjectId = null,
  limit = DEFAULT_LIMIT
}) => {
  try {
    const safeLimit =
      normalizeLimit(limit);

    const filter = {
      isActive: true
    };


    // -------------------------------
    // Subject filter
    // -------------------------------

    if (subjectId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          subjectId
        )
      ) {
        console.warn(
          "Invalid subjectId for TF-IDF search:",
          subjectId
        );

        return [];
      }

      filter.subject =
        new mongoose.Types.ObjectId(
          subjectId
        );
    }


    // -------------------------------
    // Get knowledge
    // -------------------------------

    const knowledgeItems =
      await Knowledge.find(filter)
        .populate(
          "subject",
          "name icon"
        )
        .lean();


    if (!knowledgeItems.length) {
      return [];
    }


    // -------------------------------
    // Create TF-IDF model
    // -------------------------------

    const tfidf =
      new natural.TfIdf();


    const documents =
      knowledgeItems.map(
        (item) => {

          const searchableText = [
            item.title || "",
            item.question || "",
            item.answer || "",
            item.topic || "",
            ...(item.keywords || [])
          ].join(" ");


          tfidf.addDocument(
            normalizeText(
              searchableText
            )
          );


          return item;
        }
      );


    // -------------------------------
    // Normalize query
    // -------------------------------

    const normalizedQuery =
      normalizeText(query);


    if (!normalizedQuery) {
      return [];
    }


    // -------------------------------
    // Calculate scores
    // -------------------------------

    const results = [];


    tfidf.tfidfs(
      normalizedQuery,
      (index, score) => {

        if (score > 0) {

          results.push({
            item:
              documents[index],

            score:
              Number(score)
          });

        }
      }
    );


    // -------------------------------
    // Sort
    // -------------------------------

    return results
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(
        0,
        safeLimit
      );

  } catch (error) {

    console.error(
      "TF-IDF search failed:",
      error
    );

    return [];
  }
};


// ==========================================
// VECTOR SEARCH
// ==========================================

const vectorSearch = async ({
  query,
  subjectId = null,
  limit = DEFAULT_LIMIT
}) => {

  const safeLimit =
    normalizeLimit(limit);


  // ========================================
  // Create query embedding
  // ========================================

  const queryEmbedding =
    await createEmbedding(
      query
    );


  // ========================================
  // Validate embedding dimensions
  // ========================================

  if (
    !Array.isArray(queryEmbedding) ||
    queryEmbedding.length !==
      VECTOR_DIMENSIONS
  ) {

    throw new Error(
      `Query embedding must contain ${VECTOR_DIMENSIONS} dimensions. Received ${
        queryEmbedding?.length || 0
      }.`
    );
  }


  // ========================================
  // Build Vector Search filter
  // ========================================

  const vectorFilter = {
    isActive: true
  };


  if (subjectId) {

    if (
      !mongoose.Types.ObjectId.isValid(
        subjectId
      )
    ) {
      throw new Error(
        "Invalid subjectId"
      );
    }

    vectorFilter.subject =
      new mongoose.Types.ObjectId(
        subjectId
      );
  }


  // ========================================
  // Number of candidates
  // ========================================

  const numCandidates =
    Math.max(
      DEFAULT_NUM_CANDIDATES,
      safeLimit * 10
    );


  // ========================================
  // Aggregation pipeline
  // ========================================

  const pipeline = [

    // --------------------------------------
    // VECTOR SEARCH
    // --------------------------------------

    {
      $vectorSearch: {

        index:
          VECTOR_INDEX_NAME,

        path:
          VECTOR_PATH,

        queryVector:
          queryEmbedding,

        numCandidates,

        limit:
          safeLimit,

        filter:
          vectorFilter
      }
    },


    // --------------------------------------
    // Add similarity score
    // --------------------------------------

    {
      $set: {
        vectorScore: {
          $meta:
            "vectorSearchScore"
        }
      }
    },


    // --------------------------------------
    // Populate subject manually
    // --------------------------------------

    {
      $lookup: {

        from:
          "subjects",

        localField:
          "subject",

        foreignField:
          "_id",

        as:
          "subjectData"
      }
    },


    // --------------------------------------
    // Convert subject array to object
    // --------------------------------------

    {
      $unwind: {

        path:
          "$subjectData",

        preserveNullAndEmptyArrays:
          true
      }
    },


    // --------------------------------------
    // Return required fields
    // --------------------------------------

    {
      $project: {

        title: 1,

        question: 1,

        answer: 1,

        keywords: 1,

        topic: 1,

        difficulty: 1,

        source: 1,

        isActive: 1,

        subject: {

          _id:
            "$subjectData._id",

          name:
            "$subjectData.name",

          icon:
            "$subjectData.icon"
        },

        score:
          "$vectorScore"
      }
    }
  ];


  // ========================================
  // Execute search
  // ========================================

  const results =
    await Knowledge.aggregate(
      pipeline
    );


  // ========================================
  // Normalize result format
  // ========================================

  return results.map(
    (item) => ({
      item,
      score:
        Number(
          item.score || 0
        )
    })
  );
};


// ==========================================
// HYBRID SEARCH
// ==========================================

export const searchKnowledge = async ({
  query,
  subjectId = null,
  limit = DEFAULT_LIMIT
}) => {

  const cleanQuery =
    query?.trim();


  if (!cleanQuery) {
    return [];
  }


  const safeLimit =
    normalizeLimit(limit);


  // ========================================
  // Try semantic/vector search first
  // ========================================

  try {

    const vectorResults =
      await vectorSearch({
        query:
          cleanQuery,

        subjectId,

        limit:
          safeLimit
      });


    console.log(
      `Vector search returned ${vectorResults.length} result(s).`
    );


    if (
      vectorResults.length > 0
    ) {
      return vectorResults;
    }

  } catch (error) {

    console.warn(
      "Vector search unavailable. Falling back to TF-IDF:",
      error.message
    );
  }


  // ========================================
  // TF-IDF fallback
  // ========================================

  const keywordResults =
    await keywordSearch({
      query:
        cleanQuery,

      subjectId,

      limit:
        safeLimit
    });


  console.log(
    `TF-IDF search returned ${keywordResults.length} result(s).`
  );


  return keywordResults;
};


// ==========================================
// EXPORT VECTOR SEARCH FOR TESTING
// ==========================================

export {
  vectorSearch,
  keywordSearch
};