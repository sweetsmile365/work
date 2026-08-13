import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 24 * 30;

const MONTH = 60 * 60 * 24 * 30;

const references = [
  {
    id: "dad-kettlebell",
    audience: "dad",
    label: "Kettlebell movement reference",
    url: "https://global.schwinnfitness.com/en/selecttech/kettlebell-how-to-videos.html"
  },
  {
    id: "mom-yoga",
    audience: "mom",
    label: "Yoga & movement reference",
    url: "https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/yoga-and-movement/"
  },
  {
    id: "general-flexibility",
    audience: "mom",
    label: "Flexibility exercise reference",
    url: "https://www.nhs.uk/live-well/exercise/flexibility-exercises/"
  }
] as const;

function clean(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? clean(title.replace(/<[^>]+>/g, " ")) : "";
}

function extractDescription(html: string) {
  const match =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i
    );

  return match?.[1] ? clean(match[1]) : "";
}

async function inspect(reference: (typeof references)[number]) {
  try {
    const response = await fetch(reference.url, {
      headers: {
        "User-Agent": "FamilyScheduleHub/1.0 fitness-reference"
      },
      next: { revalidate: MONTH },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      return {
        ...reference,
        healthy: false,
        title: reference.label,
        description: ""
      };
    }

    const html = await response.text();

    return {
      ...reference,
      healthy: true,
      title: extractTitle(html) || reference.label,
      description: extractDescription(html)
    };
  } catch {
    return {
      ...reference,
      healthy: false,
      title: reference.label,
      description: ""
    };
  }
}

export async function GET() {
  const items = await Promise.all(references.map(inspect));

  return NextResponse.json(
    {
      items,
      updatedAt: new Date().toISOString(),
      refresh: "monthly",
      policy:
        "reference_only: never auto-replace the approved 15-minute routine"
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=2592000, stale-while-revalidate=86400"
      }
    }
  );
}
