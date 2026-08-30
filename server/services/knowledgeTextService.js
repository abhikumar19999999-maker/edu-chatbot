export const buildKnowledgeText = (
  knowledge
) => {
  return [
    `Title: ${knowledge.title}`,
    `Question: ${knowledge.question}`,
    `Topic: ${knowledge.topic || ""}`,
    `Keywords: ${
      knowledge.keywords?.join(", ") || ""
    }`,
    `Answer: ${knowledge.answer}`
  ].join("\n");
};