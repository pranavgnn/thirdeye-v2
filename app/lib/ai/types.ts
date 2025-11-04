import { z } from "zod";

export const AnalyzerOutputSchema = z.object({
  title: z.string().describe("Brief title of the violation"),
  description: z.string().describe("Detailed description of the violation"),
  violationTypes: z
    .string()
    .describe(
      "Comma-separated list of violation types (e.g., speeding, rash_driving)"
    ),
  isIndia: z.boolean().describe("Whether the violation occurred in India"),
  vehicleDetected: z.boolean().describe("Whether a vehicle was detected"),
  violationDetected: z.boolean().describe("Whether a violation was detected"),
  licensePlateDetected: z
    .boolean()
    .describe("Whether a license plate was detected"),
  confidenceLevel: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence level of the analysis (0-1)"),
  vehicleNumber: z
    .string()
    .optional()
    .describe("Detected vehicle number if available"),
});

export type AnalyzerOutput = z.infer<typeof AnalyzerOutputSchema>;

export const VectorSearchResultSchema = z.object({
  ruleId: z.string().describe("ID of the motor vehicle act rule"),
  ruleTitle: z.string().describe("Title of the rule"),
  ruleText: z.string().describe("Full text of the rule"),
  section: z.string().describe("Section number in Motor Vehicle Act"),
  category: z.string().describe("Category of violation"),
  fineAmountRupees: z
    .number()
    .describe("Fine amount in rupees for this violation"),
  similarityScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Similarity score with the violation"),
});

export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;

export const ChainStateSchema = z.object({
  imageBase64: z.string().describe("Base64 encoded image"),
  analyzerOutput: AnalyzerOutputSchema.nullable().default(null),
  vectorSearchResults: z.array(VectorSearchResultSchema).default([]),
  reportId: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
  shouldSkip: z.boolean().default(false),
  formattedAnalysis: z.any().nullable().default(null),
});

export type ChainState = z.infer<typeof ChainStateSchema>;
