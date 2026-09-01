import { NextRequest, NextResponse } from "next/server";

import {
  checkModuleSetting,
} from "@/lib/admin/enforcement";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const siteId =
      typeof body.siteId ===
      "string"
        ? body.siteId
        : "";

    const featureKey =
      typeof body.featureKey ===
      "string"
        ? body.featureKey
        : "";

    const settingKey =
      typeof body.settingKey ===
      "string"
        ? body.settingKey
        : "";

    if (
      !siteId ||
      !featureKey ||
      !settingKey
    ) {
      return NextResponse.json(
        {
          allowed: false,
          error:
            "Missing required fields.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await checkModuleSetting(
        siteId,
        featureKey,
        settingKey
      );

    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          reason:
            result.reason,
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        allowed: true,
        siteId:
          result.siteId,
        capability:
          result.capability,
        setting:
          result.setting,
      },
      {
        status: 200,
      }
    );
  } catch {
    return NextResponse.json(
      {
        allowed: false,
        error:
          "Invalid enforcement test request.",
      },
      {
        status: 400,
      }
    );
  }
}