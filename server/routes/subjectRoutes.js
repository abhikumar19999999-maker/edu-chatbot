import express from "express";

import {
  getSubjects,
  getSubjectById
} from "../controllers/subjectController.js";

const router = express.Router();

router.get("/", getSubjects);

router.get("/:id", getSubjectById);

export default router;