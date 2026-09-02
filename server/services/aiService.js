// ==========================================
// Local response service
// ==========================================
// No external AI API or API key is required.
// Responses are generated from retrieved knowledge-base content.

const cleanText = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .trim();

export const generateAIResponse = async ({
  question,
  context = "",
  history = []
}) => {
  const cleanQuestion = cleanText(question);

  if (!cleanQuestion) {
    throw new Error("Question cannot be empty");
  }

  // Keep the same function signature so the chat service remains compatible.
  void history;

  if (!context || context === "No relevant academic content was found.") {
    return "I couldn't find enough information in my educational knowledge base to answer that accurately. Please try rephrasing your question or selecting a relevant subject.";
  }

  // The retrieval service supplies the authoritative answer text.
  // Return the first source's content rather than calling an external model.
  const sourceMatch = context.match(/Content:\s*([\s\S]*?)(?:\nSimilarity Score:|$)/i);
  const answer = cleanText(sourceMatch?.[1] || "");

  if (!answer) {
    return "I found a related topic, but there is not enough answer content in the knowledge base yet. Please try another question.";
  }

  return answer;
};