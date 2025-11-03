import type { Route } from "./+types/page";
import { streamViolationAnalysis } from "~/lib/ai/chain";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return { error: "No file provided" };
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const results: unknown[] = [];

    for await (const event of streamViolationAnalysis(base64)) {
      results.push(event);
    }

    const finalResult = results[results.length - 1];

    return {
      ok: true,
      analysis: finalResult,
    };
  }
}
