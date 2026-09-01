import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  provisionSiteConnector,
} from "@/lib/admin/provision-connector";

const requestSchema = z.object({
  siteId: z.string().min(1),
});

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      requestSchema.parse(
        await request.json()
      );

    const connector =
      await provisionSiteConnector(
        body.siteId
      );

    return NextResponse.json(
      {
        ok: true,
        siteId:
          connector.siteId,
        connectorId:
          connector.connectorId,
        secret:
          connector.secret,
        protocolVersion:
          connector.protocolVersion,
        connectorVersion:
          connector.connectorVersion,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "LYNUX connector provisioning failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to provision connector.",
      },
      {
        status: 400,
      }
    );
  }
}