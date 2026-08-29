import natural from "natural";

import Knowledge from "../models/Knowledge.js";
import { normalizeText } from "./nlpService.js";

const getSearchText = (item) => {
  return [
    item.title,
    item.question,
    item.answer,
    item.topic,
    ...(item.keywords || [])
  ].join(" ");
};

export const searchKnowledge = async ({
  query,
  subjectId = null,
  limit = 5
}) => {
  if (!query || !query.trim()) {
    return [];
  }

  const filter = {
    isActive: true
  };

  if (subjectId) {
    filter.subject = subjectId;
  }

  const knowledgeItems = await Knowledge.find(filter)
    .populate("subject", "name")
    .lean();

  if (!knowledgeItems.length) {
    return [];
  }

  const tfidf = new natural.TfIdf();

  const documents = knowledgeItems.map((item) => {
    const text = normalizeText(getSearchText(item));

    tfidf.addDocument(text);

    return {
      item,
      text
    };
  });

  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return [];
  }

  const results = [];

  tfidf.tfidfs(normalizedQuery, (index, score) => {
    results.push({
      item: documents[index].item,
      score
    });
  });

  return results
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};