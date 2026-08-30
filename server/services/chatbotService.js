import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import {
  searchKnowledge
} from "./retrievalService.js";

import {
  detectIntent
} from "./intentService.js";

import {
  generateAIResponse
} from "./aiService.js";

export const processChatMessage = async ({
  userId,
  conversationId,
  message,
  subjectId
}) => {
  // ==========================================
  // 1. Validate message
  // ==========================================
  if (!message || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  const cleanMessage = message.trim();

  // ==========================================
  // 2. Find existing conversation
  // ==========================================
  let conversation;

  if (conversationId) {
    conversation = await Conversation.findOne({
      _id: conversationId,
      user: userId,
      isActive: true
    });
  }

  // ==========================================
  // 3. Create new conversation if needed
  // ==========================================
  if (!conversation) {
    conversation = await Conversation.create({
      user: userId,
      subject: subjectId || null,
      title: cleanMessage.substring(0, 60),
      lastMessageAt: new Date()
    });
  }

  // ==========================================
  // 4. Detect intent
  // ==========================================
  const intent = detectIntent(cleanMessage);

  // ==========================================
  // 5. Retrieve relevant knowledge
  // ==========================================
  const results = await searchKnowledge({
    query: cleanMessage,
    subjectId: subjectId || conversation.subject,
    limit: 3
  });

  // ==========================================
  // 6. Get previous messages
  // ==========================================
  const previousMessages = await Message.find({
    conversation: conversation._id
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  previousMessages.reverse();

  // ==========================================
  // 7. Build academic context
  // ==========================================
  const context = results.length
    ? results
        .map((result, index) => {
          const item = result.item;

          return `
SOURCE ${index + 1}
Title: ${item.title}
Topic: ${item.topic || "General"}
Subject: ${item.subject?.name || "Academic"}
Content:
${item.answer}
Similarity Score:
${result.score.toFixed(4)}
          `;
        })
        .join("\n")
    : "No relevant academic content was found.";

  // ==========================================
  // 8. Determine matched source
  // ==========================================
  const bestMatch =
    results.length > 0
      ? results[0].item
      : null;

  const retrievalScore =
    results.length > 0
      ? results[0].score
      : 0;

  let detectedSubject =
    conversation.subject || subjectId || null;

  if (bestMatch?.subject?._id) {
    detectedSubject = bestMatch.subject._id;
  }

  // ==========================================
  // 9. Generate AI response
  // ==========================================
  let answer;

  try {
    answer = await generateAIResponse({
      question: cleanMessage,
      context,
      history: previousMessages
    });
  } catch (error) {
    console.error(
      "AI response generation failed:",
      error.message
    );

    // Safe fallback
    if (bestMatch) {
      answer = bestMatch.answer;
    } else {
      answer =
        "I couldn't find enough information in my educational knowledge base to answer that accurately. Please try rephrasing your question.";
    }
  }

  // ==========================================
  // 10. Save user message
  // ==========================================
  const userMessage = await Message.create({
    conversation: conversation._id,
    sender: "user",
    content: cleanMessage,
    intent,
    subject: detectedSubject
  });

  // ==========================================
  // 11. Save bot message
  // ==========================================
  const botMessage = await Message.create({
    conversation: conversation._id,
    sender: "bot",
    content: answer,
    intent,
    subject: detectedSubject,
    sourceKnowledge: bestMatch?._id || null,
    retrievalScore
  });

  // ==========================================
  // 12. Update conversation
  // ==========================================
  conversation.subject =
    detectedSubject || conversation.subject;

  conversation.lastMessageAt = new Date();

  await conversation.save();

  // ==========================================
  // 13. Return result
  // ==========================================
  return {
    conversation,
    userMessage,
    botMessage,
    answer,
    intent,
    subject: detectedSubject,
    retrievalScore,
    source: bestMatch
      ? {
          id: bestMatch._id,
          title: bestMatch.title,
          topic: bestMatch.topic
        }
      : null
  };
};