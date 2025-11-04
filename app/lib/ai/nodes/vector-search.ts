import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as db from "~/lib/database";
import type { ChainState } from "../types";
import { VectorSearchResultSchema } from "../types";
import { z } from "zod";

export async function vectorSearchNode(
  state: ChainState
): Promise<Partial<ChainState>> {
  if (state.shouldSkip || !state.analyzerOutput) {
    return { vectorSearchResults: [] };
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
  });

  const violationText =
    `${state.analyzerOutput.title} ${state.analyzerOutput.description} ${state.analyzerOutput.violationTypes}`.toLowerCase();

  const violationEmbedding = await embeddings.embedQuery(violationText);
  const formattedEmbedding = `[${violationEmbedding.join(",")}]`;

  const query = `
    SELECT 
      rule_id,
      rule_title,
      rule_text,
      section,
      category,
      fine_amount_rupees,
      1 - (embedding <=> $1::vector) as similarity_score
    FROM motor_vehicle_act_rules
    WHERE 1 - (embedding <=> $1::vector) > 0.3
    ORDER BY similarity_score DESC
    LIMIT 5
  `;

  const results = await db.getMany<{
    rule_id: string;
    rule_title: string;
    rule_text: string;
    section: string;
    category: string;
    fine_amount_rupees: number;
    similarity_score: number;
  }>(query, [formattedEmbedding]);

  const vectorSearchResults = results.map((r) => ({
    ruleId: r.rule_id,
    ruleTitle: r.rule_title,
    ruleText: r.rule_text,
    section: r.section,
    category: r.category,
    fineAmountRupees: r.fine_amount_rupees,
    similarityScore: r.similarity_score,
  }));

  return { vectorSearchResults };
}
