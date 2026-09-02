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
  checkModuleSetting,
} from "@/lib/admin/enforcement";


const requestSchema = z.object({
  siteId: z.string().min(1),
  featureKey: z.string().min(1),
  settingKey: z.string().min(1),
});


export async function POST(
  request: NextRequest
) {
  try {
    /* =======================================================
       REQUIRE MASTER ADMIN

       Enforcement diagnostics are an Admin Core capability
       and must not be exposed to unauthenticated callers.
    ======================================================= */

    await requireMasterAdmin();


    const body =
      requestSchema.parse(
        await request.json()
      );


    /* =======================================================
       CHECK ENFORCEMENT
    ======================================================= */

    const result =
      await checkModuleSetting(
        body.siteId,
        body.featureKey,
        body.settingKey
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
          allowed: false,
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
          allowed: false,
          error:
            "Invalid enforcement test request.",
        },
        {
          status: 400,
        }
      );
    }


    console.error(
      "LYNUX enforcement test failed:",
      error
    );


    return NextResponse.json(
      {
        allowed: false,
        error:
          "Unable to run enforcement test.",
      },
      {
        status: 500,
      }
    );
  }
}