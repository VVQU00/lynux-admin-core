import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  authenticateSiteConnector,
} from "@/lib/admin/connector-auth";

export async function POST(
  request: NextRequest
) {
  try {
    const result =
      await authenticateSiteConnector(
        request
      );

    if (!result.authenticated) {
      return NextResponse.json(
        {
          authenticated: false,
          reason: result.reason,
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        siteId: result.siteId,
        connectorId:
          result.connectorId,
        protocolVersion:
          result.protocolVersion,
        connectorVersion:
          result.connectorVersion,
      },
      {
        status: 200,
      }
    );
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
        error:
          "Connector authentication failed.",
      },
      {
        status: 500,
      }
    );
  }
}