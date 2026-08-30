import {
  pipeline
} from "@huggingface/transformers";

const MODEL =
  "Xenova/all-MiniLM-L6-v2";

let extractor = null;


// ==========================================
// LOAD EMBEDDING MODEL
// ==========================================

const getExtractor = async () => {
  if (extractor) {
    return extractor;
  }

  console.log(
    "Loading local embedding model..."
  );

  extractor = await pipeline(
    "feature-extraction",
    MODEL
  );

  console.log(
    "Embedding model loaded."
  );

  return extractor;
};


// ==========================================
// CREATE ONE EMBEDDING
// ==========================================

export const createEmbedding = async (
  text
) => {

  if (
    !text ||
    !text.trim()
  ) {
    throw new Error(
      "Embedding text cannot be empty"
    );
  }

  const model =
    await getExtractor();

  const output =
    await model(
      text.trim(),
      {
        pooling: "mean",
        normalize: true
      }
    );

  return Array.from(
    output.data
  );
};


// ==========================================
// CREATE MULTIPLE EMBEDDINGS
// ==========================================

export const createEmbeddings = async (
  texts
) => {

  if (
    !Array.isArray(texts) ||
    texts.length === 0
  ) {
    return [];
  }

  const model =
    await getExtractor();

  const output =
    await model(
      texts,
      {
        pooling: "mean",
        normalize: true
      }
    );

  const dimensions =
    output.dims;

  const vectorSize =
    dimensions[
      dimensions.length - 1
    ];

  const embeddings = [];

  for (
    let i = 0;
    i < texts.length;
    i++
  ) {

    const start =
      i * vectorSize;

    const end =
      start + vectorSize;

    embeddings.push(
      Array.from(
        output.data.slice(
          start,
          end
        )
      )
    );
  }

  return embeddings;
};