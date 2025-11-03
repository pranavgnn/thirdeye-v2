import type { Route } from "./+types/page";

export async function action({ request }: Route.ActionArgs) {
  if (request.method === "POST") {
    const formData = await request.formData();
    const file = formData.get("file");
    console.log("uploaded image", file);
    return { ok: true };
  }
}
