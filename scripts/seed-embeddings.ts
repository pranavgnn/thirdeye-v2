import { config } from "dotenv";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as db from "../app/lib/database.js";
import { MOTOR_VEHICLE_ACT_RULES } from "../database/seeds/motor-vehicle-act-rules.js";

config();

async function seedMotorVehicleActEmbeddings() {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
  });

  for (const rule of MOTOR_VEHICLE_ACT_RULES) {
    const embedding = await embeddings.embedQuery(
      `${rule.ruleTitle} ${rule.ruleText}`
    );

    const formattedEmbedding = `[${embedding.join(",")}]`;

    await db.insert(
      `INSERT INTO motor_vehicle_act_rules 
        (rule_id, rule_title, rule_text, section, category, fine_amount_rupees, embedding)
      VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
      ON CONFLICT (rule_id) DO UPDATE SET 
        embedding = $7::vector, 
        category = $5,
        fine_amount_rupees = $6,
        updated_at = CURRENT_TIMESTAMP`,
      [
        rule.ruleId,
        rule.ruleTitle,
        rule.ruleText,
        rule.section,
        rule.category,
        rule.fineAmountRupees,
        formattedEmbedding
      ]
    );
  }

  await db.closePool();
}

seedMotorVehicleActEmbeddings().catch((error) => {
  console.error("Error seeding embeddings:", error);
  process.exit(1);
});
