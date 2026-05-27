import { NextResponse } from "next/server"
import OpenAI from "openai"
import { loadOuterEnv } from "@/lib/loadOuterEnv"

type ExplainRequest = {
  principle: Record<string, unknown>
  industry: string
  implementation_type: string
}

function asObject(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function fillUserTemplate(template: string, industry: string, implementationType: string): string {
  return template
    .replaceAll("{{ industry }}", industry)
    .replaceAll("{{industry}}", industry)
    .replaceAll("{{ implementation_type }}", implementationType)
    .replaceAll("{{implementation_type}}", implementationType)
}

export async function POST(request: Request) {
  loadOuterEnv()

  let body: ExplainRequest
  try {
    body = (await request.json()) as ExplainRequest
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.principle || !body.industry || !body.implementation_type) {
    return NextResponse.json(
      { error: "Missing required fields: principle, industry, implementation_type" },
      { status: 400 },
    )
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 })
  }

  const explainPrompt = asObject(body.principle.explain_prompt)
  const systemPrompt = asString(explainPrompt?.system).trim()
  const userTemplate = asString(explainPrompt?.user_template).trim()

  if (!systemPrompt || !userTemplate) {
    return NextResponse.json(
      { error: "Principle is missing explain_prompt.system or explain_prompt.user_template" },
      { status: 400 },
    )
  }

  const prompt = {
    system: systemPrompt,
    user: fillUserTemplate(userTemplate, body.industry, body.implementation_type).trim(),
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.DEFAULT_MODEL || "gpt-4o"

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content ?? ""
    let parsed: { use_case_background?: string; issue_detail?: string }
    try {
      parsed = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: "Model returned non-JSON output", raw: content },
        { status: 502 },
      )
    }

    return NextResponse.json({
      use_case_background: parsed.use_case_background ?? "",
      issue_detail: parsed.issue_detail ?? "",
    })
  } catch (e) {
    console.error("OpenAI error:", e)
    return NextResponse.json(
      { error: "OpenAI request failed", details: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    )
  }
}
