import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as db from "../app/lib/database.js";
import { MOTOR_VEHICLE_ACT_RULES } from "../database/seeds/motor-vehicle-act-rules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

async function seedMotorVehicleActEmbeddings() {
  console.log("Starting embeddings seed...");

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
        (rule_id, rule_title, rule_text, section, embedding)
      VALUES ($1, $2, $3, $4, $5::vector)
      ON CONFLICT (rule_id) DO UPDATE SET 
        embedding = $5::vector, updated_at = CURRENT_TIMESTAMP`,
      [rule.ruleId, rule.ruleTitle, rule.ruleText, rule.section, formattedEmbedding]
    );

    console.log(`Embedded rule: ${rule.ruleId}`);
  }

  console.log("Embeddings seed completed!");
  await db.closePool();
}

seedMotorVehicleActEmbeddings().catch((error) => {
  console.error("Error seeding embeddings:", error);
  process.exit(1);
});
