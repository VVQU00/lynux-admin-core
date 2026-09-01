import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  authenticateSiteConnector,
} from "@/lib/admin/connector-auth";

import {
  checkModuleSetting,
} from "@/lib/admin/enforcement";

const requestSchema = z.object({
  featureKey: z.string().min(1),
  settingKey: z.string().min(1),
});

export async function POST(
  request: NextRequest
) {
  try {
    const connector =
      await authenticateSiteConnector(
        request
      );

    if (!connector.authenticated) {
      return NextResponse.json(
        {
          allowed: false,
          authenticated: false,
          reason: connector.reason,
        },
        {
          status: 401,
        }
      );
    }

    const body =
      requestSchema.parse(
        await request.json()
      );

    const enforcement =
      await checkModuleSetting(
        connector.siteId,
        body.featureKey,
        body.settingKey
      );

    if (!enforcement.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          authenticated: true,
          siteId: connector.siteId,
          capability:
            body.featureKey,
          setting:
            body.settingKey,
          reason:
            enforcement.reason,
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json(
      {
        allowed: true,
        authenticated: true,
        siteId:
          connector.siteId,
        connectorId:
          connector.connectorId,
        capability:
          enforcement.capability,
        setting:
          enforcement.setting,
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
          "Invalid connector authorization request.",
      },
      {
        status: 400,
      }
    );
  }
}