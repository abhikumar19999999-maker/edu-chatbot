export const detectIntent = (text = "") => {
  const query = text.toLowerCase().trim();

  if (!query) {
    return "general";
  }

  const definitionPatterns = [
    "what is",
    "what are",
    "define",
    "meaning of",
    "explain"
  ];

  const proceduralPatterns = [
    "how to",
    "how do",
    "steps",
    "procedure",
    "process"
  ];

  const conceptualPatterns = [
    "difference",
    "compare",
    "why",
    "advantages",
    "disadvantages",
    "types of",
    "concept"
  ];

  const numericalPatterns = [
    "calculate",
    "solve",
    "equation",
    "formula",
    "find the value"
  ];

  if (
    definitionPatterns.some((pattern) =>
      query.includes(pattern)
    )
  ) {
    return "definition";
  }

  if (
    proceduralPatterns.some((pattern) =>
      query.includes(pattern)
    )
  ) {
    return "procedural";
  }

  if (
    conceptualPatterns.some((pattern) =>
      query.includes(pattern)
    )
  ) {
    return "conceptual";
  }

  if (
    numericalPatterns.some((pattern) =>
      query.includes(pattern)
    )
  ) {
    return "numerical";
  }

  return "general";
};