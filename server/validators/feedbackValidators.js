import { z } from "zod";

const objectIdRegex =
  /^[0-9a-fA-F]{24}$/;

export const feedbackSchema = z.object({
  messageId: z
    .string()
    .regex(
      objectIdRegex,
      "Invalid message ID"
    ),

  rating: z
    .number()
    .int()
    .min(1)
    .max(5),

  helpful: z
    .boolean(),

  comment: z
    .string()
    .trim()
    .max(
      500,
      "Comment cannot exceed 500 characters"
    )
    .optional()
    .default("")
});