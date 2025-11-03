# Usage Examples

## Basic Usage - Server Action

In `app/routes/report/action.ts`, the chain is already integrated:

```typescript
import { streamViolationAnalysis } from "~/lib/ai/chain";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const results = [];
    for await (const event of streamViolationAnalysis(base64)) {
      results.push(event);
    }

    return { ok: true, analysis: results[results.length - 1] };
  }
}
```

## Server-Sent Events (SSE) Streaming

For real-time updates to the client:

```typescript
import { streamViolationAnalysis, type ChainStreamEvent } from "~/lib/ai/chain";

export async function loader() {
  const imageBase64 = "..."; // Your image

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const event of streamViolationAnalysis(imageBase64)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}
```

## Client-Side (React)

Consume the API:

```typescript
import { useFetcher } from "react-router";
import { useEffect, useState } from "react";

export function ViolationReporter() {
  const fetcher = useFetcher();
  const [analysis, setAnalysis] = useState(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    fetcher.submit(formData, {
      method: "POST",
      action: "/report",
      encType: "multipart/form-data",
    });
  };

  useEffect(() => {
    if (fetcher.data?.analysis) {
      setAnalysis(fetcher.data.analysis);
    }
  }, [fetcher.data]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" name="image" accept="image/*" required />
        <button type="submit" disabled={fetcher.state === "submitting"}>
          {fetcher.state === "submitting" ? "Analyzing..." : "Upload & Analyze"}
        </button>
      </form>

      {analysis && (
        <div className="mt-6">
          <h2>{analysis.violation?.title}</h2>
          <p>{analysis.violation?.description}</p>
          <p>
            Confidence: {(analysis.violation?.confidence * 100).toFixed(1)}%
          </p>

          {analysis.applicableRules?.length > 0 && (
            <div>
              <h3>Applicable Rules:</h3>
              <ul>
                {analysis.applicableRules.map((rule) => (
                  <li key={rule.ruleId}>
                    <strong>{rule.ruleTitle}</strong>
                    <p>{rule.ruleText}</p>
                    <small>Section {rule.section}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!analysis.validation?.isValid && (
            <div className="alert alert-warning">
              <p>Image validation issues:</p>
              <ul>
                {analysis.validation?.messages.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Direct Chain Usage

For programmatic access:

```typescript
import {
  createViolationAnalysisChain,
  streamViolationAnalysis,
} from "~/lib/ai/chain";

// Option 1: Using the streaming generator
async function analyzeImage(base64: string) {
  for await (const event of streamViolationAnalysis(base64)) {
    if (event.type === "final_result") {
      console.log("Analysis:", event.data);
      return event.data;
    }
  }
}

// Option 2: Direct chain invocation
async function analyzeDirectly(base64: string) {
  const chain = await createViolationAnalysisChain();

  const result = await chain.invoke({
    imageBase64: base64,
    analyzerOutput: null,
    vectorSearchResults: [],
    reportId: null,
    error: null,
    shouldSkip: false,
  });

  return result;
}

// Option 3: With event callback
async function analyzeWithCallback(base64: string) {
  const onEvent = (event) => {
    console.log(
      `[${event.type}] at ${new Date(event.timestamp).toISOString()}`
    );
  };

  for await (const event of streamViolationAnalysis(base64, onEvent)) {
    if (event.type === "error") {
      console.error("Analysis error:", event.data);
      return null;
    }
  }
}
```

## Testing Locally

### 1. Test with a sample image

```bash
# Convert image to base64 (macOS/Linux)
cat image.jpg | base64 > image.b64

# Or use Node.js
node -e "console.log(require('fs').readFileSync('image.jpg', 'base64'))"
```

### 2. Use curl to test the API

```bash
curl -X POST http://localhost:5173/report \
  -F "file=@traffic_violation.jpg"
```

### 3. Check database results

```bash
psql postgresql://thirdeye_user:password@localhost:5432/thirdeye

SELECT
  v.id,
  v.violation_type,
  v.ai_assessment_score,
  v.status,
  COUNT(r.id) as matched_rules
FROM violation_reports v
LEFT JOIN motor_vehicle_act_rules r ON v.notes LIKE '%' || r.rule_id || '%'
GROUP BY v.id
ORDER BY v.created_at DESC
LIMIT 10;
```

## Chain State Flow

```typescript
// Initial state
{
  imageBase64: "data:image/jpeg;base64,...",
  analyzerOutput: null,
  vectorSearchResults: [],
  reportId: null,
  error: null,
  shouldSkip: false
}

// After Analyzer node
{
  imageBase64: "...",
  analyzerOutput: {
    title: "Speeding violation",
    description: "Vehicle ABC123 traveling at 80 km/h in 60 km/h zone",
    violationTypes: "speeding",
    isIndia: true,
    vehicleDetected: true,
    violationDetected: true,
    licensePlateDetected: true,
    confidenceLevel: 0.92,
    vehicleNumber: "ABC123"
  },
  vectorSearchResults: [],
  reportId: null,
  error: null,
  shouldSkip: false
}

// After Vector Search node
{
  // ... previous state ...
  vectorSearchResults: [
    {
      ruleId: "mva-section-3",
      ruleTitle: "Driving at dangerous speed",
      ruleText: "...",
      section: "3",
      similarityScore: 0.87
    }
  ]
}

// After Database node
{
  // ... previous state ...
  reportId: "550e8400-e29b-41d4-a716-446655440000"
}

// After Formatter node (final)
{
  // ... previous state ...
  // Plus formatted output structure ready for display
}
```

## Error Handling Examples

### Invalid Image - No Vehicle Detected

```typescript
// Chain still completes, but skips to formatter
{
  analyzerOutput: {
    vehicleDetected: false,
    // ...
  },
  shouldSkip: true,
  reportId: null, // No DB write
  vectorSearchResults: [] // Empty
}

// Result to user:
{
  status: "incomplete",
  validation: {
    isValid: false,
    messages: ["No vehicle detected"]
  }
}
```

### External Validation

```typescript
async function validateBeforeChain(base64: string) {
  // Your custom validation
  if (base64.length < 1000) {
    return { error: "Image too small" };
  }

  return await analyzeImage(base64);
}
```

## Monitoring & Debugging

```typescript
// Enable detailed logging
for await (const event of streamViolationAnalysis(base64)) {
  console.log(`Event: ${event.type}`);
  console.log(`Node: ${event.node}`);
  console.log(`Timestamp: ${event.timestamp}`);
  console.log(`Data:`, event.data);
  console.log("---");
}
```

## Performance Optimization

```typescript
// Batch process multiple images
async function batchAnalyze(imageArray: string[]) {
  const results = await Promise.all(
    imageArray.map((img) =>
      (async () => {
        for await (const event of streamViolationAnalysis(img)) {
          if (event.type === "final_result") return event.data;
        }
      })()
    )
  );
  return results;
}
```
