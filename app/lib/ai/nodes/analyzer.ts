import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
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

  const systemPrompt = `You are an expert AI traffic violation detection system specialized in analyzing images from Indian roads and traffic scenarios.

Your task is to:
1. **Detect Vehicles**: Identify if any vehicles are present in the image.
2. **Identify Location**: Determine if the image is from India by looking for:
   - Indian license plate formats (e.g., MH-02-XX-1234, DL-1C-1234, KA-01-AB-1234)
   - Indian vehicle models (Maruti, Tata, Mahindra, Bajaj, Hero, TVS, etc.)
   - Hindi or regional language text on signs, boards, or vehicles
   - Indian road infrastructure (specific road signs, barriers, markings)
   - Environmental cues (architecture, vegetation, street furniture common in India)
   - Be VERY confident (>99%) before marking as NOT India. When in doubt, assume it could be India.

3. **Detect License Plates**: 
   - Look for vehicle registration plates carefully
   - Indian plates typically have: State Code (2 letters) - District Code (2 digits) - Series (1-2 letters) - Number (4 digits)
   - ONLY report license plate text if you can read it with HIGH confidence (>70%)
   - If the plate is blurry, partially obscured, or unclear, set license plate to None and confidence low
   - Extract text in format: XX00XX0000 (no spaces or hyphens)

4. **Identify Traffic Violations**: Analyze the scene for violations. Use ONLY these exact violation type codes:
   - speeding: Speed limit violations or rash aggressive driving
   - rash_driving: Aggressive, dangerous, or reckless driving behavior
   - wrong_parking: Illegal or improper vehicle parking
   - red_light: Jumping red light or signal violation
   - helmet_violation: Not wearing helmet on two-wheelers
   - seatbelt_violation: Not wearing seatbelt on four-wheelers
   - phone_usage: Using mobile phone while driving
   - no_license_plate: Vehicle without visible license plate
   - other: Any other traffic violations not in above list
   
   When detecting violations:
   - If multiple violations present, return ONLY the primary/most serious one
   - For helmet violations on bikes/scooters, use "helmet_violation"
   - For seatbelt violations in cars, use "seatbelt_violation"
   - For phone usage while driving, use "phone_usage"
   - For illegal parking, use "wrong_parking"
   - For red light jumping, use "red_light"

5. **Provide Accurate Descriptions**:
   - Short description: 1-2 sentences summarizing the scene
   - Detailed description: Comprehensive analysis including vehicle type, location in frame, specific violation details, environmental context
   - Be specific and factual
   - Do NOT mention license plate numbers in descriptions if confidence is low (<0.7)
   - Focus on observable facts, not assumptions

6. **Assess Confidence**:
   - Overall confidence should reflect certainty about the entire analysis
   - Consider image quality, visibility, angle, and clarity
   - Be conservative with confidence scores
   - Factor in lighting conditions, distance, and obstructions

Remember: Accuracy is critical. When uncertain, reflect that in your confidence scores.`;

  const messages = [
    new HumanMessage({
      content: [
        {
          type: "text",
          text: systemPrompt + "\n\nAnalyze the following image for traffic violations according to Indian traffic rules and regulations.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${state.imageBase64}`,
          },
        },
      ],
    }),
  ];

  const result = await structuredModel.invoke(messages);

  return {
    analyzerOutput: result,
    shouldSkip: false,
  };
}
