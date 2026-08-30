import { z } from "zod";

const objectIdRegex =
  /^[0-9a-fA-F]{24}$/;

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),

  conversationId: z
    .string()
    .regex(objectIdRegex, "Invalid conversation ID")
    .optional(),

  subjectId: z
    .string()
    .regex(objectIdRegex, "Invalid subject ID")
    .optional()
});