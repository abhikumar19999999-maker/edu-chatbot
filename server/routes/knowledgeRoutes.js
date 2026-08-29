import express from "express";

import {
  getKnowledgeBySubject,
  searchKnowledgeController
} from "../controllers/knowledgeController.js";

const router = express.Router();

router.get(
  "/subject/:subjectId",
  getKnowledgeBySubject
);

router.post(
  "/search",
  searchKnowledgeController
);

export default router;