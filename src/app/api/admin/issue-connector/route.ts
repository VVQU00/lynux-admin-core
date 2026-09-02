import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  AdminAuthError,
  requireMasterAdmin,
} from "@/lib/admin/auth/require-master-admin";

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
    /* =======================================================
       REQUIRE MASTER ADMIN

       Connector credentials must never be issued from an
       unauthenticated request.
    ======================================================= */

    await requireMasterAdmin();


    const body =
      requestSchema.parse(
        await request.json()
      );


    /* =======================================================
       PROVISION CONNECTOR

       provisionSiteConnector() remains responsible for
       generating, storing, rotating, and returning the
       connector credentials.

       The raw secret may only be returned from this trusted
       master-admin authenticated route.
    ======================================================= */

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
    /* =======================================================
       AUTHORIZATION ERRORS
    ======================================================= */

    if (
      error instanceof
      AdminAuthError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            error.message,
        },
        {
          status:
            error.status,
        }
      );
    }


    /* =======================================================
       VALIDATION ERRORS
    ======================================================= */

    if (
      error instanceof
      z.ZodError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid connector provisioning request.",
        },
        {
          status: 400,
        }
      );
    }


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
        status: 500,
      }
    );
  }
}