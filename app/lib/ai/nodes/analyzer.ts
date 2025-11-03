import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AnalyzerOutputSchema,
  type ChainState,
} from "../types";

export async function analyzerNode(state: ChainState): Promise<Partial<ChainState>> {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.3,
  });

  const structuredModel = model.withStructuredOutput(AnalyzerOutputSchema);

  const prompt = `Analyze this traffic violation image and provide structured output.

Extract the following information:
1. Title: A brief, clear title of the violation
2. Description: Detailed description of what's happening
3. ViolationTypes: Comma-separated list of violation types from this list: speeding, rash_driving, wrong_parking, red_light, helmet_violation, seatbelt_violation, phone_usage, no_license_plate, other
4. IsIndia: Whether this is in India (check for Indian road signs, license plates, etc.)
5. VehicleDetected: Whether a vehicle is clearly visible
6. ViolationDetected: Whether a traffic violation is actually occurring
7. LicensePlateDetected: Whether a vehicle license plate is visible
8. ConfidenceLevel: Your confidence in the detection (0-1 scale)
9. VehicleNumber: The license plate number if readable

Be accurate and conservative with your assessment. Return 0 confidence for low-quality images.`;

  const result = await structuredModel.invoke(prompt);

  return {
    analyzerOutput: result,
    shouldSkip: false,
  };
}
