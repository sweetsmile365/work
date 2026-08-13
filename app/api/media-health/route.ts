import { NextResponse } from "next/server";

export const revalidate = 60 * 60 * 24;

const DAY = 60 * 60 * 24;

const stations = [
  {
    id: "workout-energy",
    urls: [
      "https://ice5.somafm.com/thetrip-128-mp3",
      "https://ice2.somafm.com/thetrip-128-mp3"
    ]
  },
  {
    id: "workout-groove",
    urls: [
      "https://ice5.somafm.com/beatblender-128-mp3",
      "https://ice2.somafm.com/beatblender-128-mp3"
    ]
  },
  {
    id: "yoga-flow",
    urls: [
      "https://ice5.somafm.com/groovesalad-128-mp3",
      "https://ice2.somafm.com/groovesalad-128-mp3"
    ]
  },
  {
    id: "yoga-deep",
    urls: [
      "https://ice5.somafm.com/dronezone-128-mp3",
      "https://ice6.somafm.com/dronezone-128-mp3"
    ]
  }
];

async function probe(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Range: "bytes=0-64",
        "Icy-MetaData": "0",
        "User-Agent": "FamilyScheduleHub/1.0 media-health"
      },
      next: { revalidate: DAY },
      signal: AbortSignal.timeout(4500)
    });

    const ok = response.ok || response.status === 206;
    try {
      await response.body?.cancel();
    } catch {
      // Ignore stream cancellation errors.
    }

    return ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const result = await Promise.all(
    stations.map(async (station) => {
      let healthy = false;
      let activeUrlIndex = 0;

      for (let index = 0; index < station.urls.length; index += 1) {
        if (await probe(station.urls[index])) {
          healthy = true;
          activeUrlIndex = index;
          break;
        }
      }

      return {
        id: station.id,
        healthy,
        activeUrlIndex
      };
    })
  );

  return NextResponse.json(
    {
      stations: result,
      checkedAt: new Date().toISOString(),
      refresh: "daily"
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=21600"
      }
    }
  );
}
