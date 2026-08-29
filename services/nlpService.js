import natural from "natural";

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const stopWords = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "were",
  "what",
  "why",
  "how",
  "when",
  "where",
  "which",
  "who",
  "in",
  "on",
  "of",
  "to",
  "for",
  "and",
  "or",
  "with",
  "about",
  "me",
  "please",
  "can",
  "you",
  "tell"
]);

export const preprocessText = (text = "") => {
  const tokens = tokenizer
    .tokenize(text.toLowerCase())
    .filter((token) => /^[a-zA-Z0-9]+$/.test(token))
    .filter((token) => !stopWords.has(token))
    .map((token) => stemmer.stem(token));

  return tokens;
};

export const normalizeText = (text = "") => {
  return preprocessText(text).join(" ");
};