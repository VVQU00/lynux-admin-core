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
  updateScannerReviewDecision,
} from "@/lib/admin/scanner/review-persistence";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";


const requestSchema = z.object({
  siteId: z
    .string()
    .min(1),

  capabilityKey: z
    .string()
    .min(1),

  decision: z.enum([
    "pending",
    "approved",
    "rejected",
  ]),

  note: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
});


export async function POST(
  request: NextRequest
) {
  try {
    /* =======================================================
       REQUIRE MASTER ADMIN

       Do this BEFORE touching the service-role client.
    ======================================================= */

    const adminUser =
      await requireMasterAdmin();


    const body =
      requestSchema.parse(
        await request.json()
      );


    const supabase =
      createSupabaseAdminClient();


    /* =======================================================
       VERIFY SITE
    ======================================================= */

    const {
      data: site,
      error: siteError,
    } = await supabase
      .from("sites")
      .select("id")
      .eq(
        "id",
        body.siteId
      )
      .maybeSingle();


    if (
      siteError ||
      !site
    ) {
      return NextResponse.json(
        {
          error:
            "Site not found.",
        },
        {
          status: 404,
        }
      );
    }


    /* =======================================================
       VERIFY CANONICAL CAPABILITY
    ======================================================= */

    const {
      data: capability,
      error: capabilityError,
    } = await supabase
      .from(
        "capability_registry"
      )
      .select("key")
      .eq(
        "key",
        body.capabilityKey
      )
      .maybeSingle();


    if (
      capabilityError ||
      !capability
    ) {
      return NextResponse.json(
        {
          error:
            "Unknown capability.",
        },
        {
          status: 400,
        }
      );
    }


    /* =======================================================
       UPDATE REVIEW

       detected ≠ approved ≠ enabled
    ======================================================= */

    await updateScannerReviewDecision(
      supabase,
      {
        siteId:
          body.siteId,

        capabilityKey:
          body.capabilityKey,

        decision:
          body.decision,

        note:
          body.note ??
          null,
      }
    );


    /* =======================================================
       AUDIT LOG

       actor_id now uses the authenticated Supabase user id.
    ======================================================= */

    const {
      error: auditError,
    } = await supabase
      .from("audit_logs")
      .insert({
        site_id:
          body.siteId,

        actor_id:
          adminUser.id,

        action:
          "scanner-review.decision",

        capability_key:
          body.capabilityKey,

        target_type:
          "scanner_capability_review",

        target_id:
          body.capabilityKey,

        success:
          true,

        metadata: {
          decision:
            body.decision,

          note:
            body.note ??
            null,

          actorEmail:
            adminUser.email ??
            null,
        },
      });


    if (auditError) {
      console.error(
        "Scanner review audit log failed:",
        auditError.code
      );
    }


    return NextResponse.json({
      ok: true,

      siteId:
        body.siteId,

      capabilityKey:
        body.capabilityKey,

      decision:
        body.decision,
    });
  } catch (error) {
    /* =======================================================
       AUTH ERRORS
    ======================================================= */

    if (
      error instanceof
      AdminAuthError
    ) {
      return NextResponse.json(
        {
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
          error:
            "Invalid scanner review request.",
        },
        {
          status: 400,
        }
      );
    }


    console.error(
      "LYNUX scanner review route failed:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Unable to update scanner review.",
      },
      {
        status: 500,
      }
    );
  }
}