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
  featureRegistry,
} from "@/lib/admin/feature-registry";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";


const requestSchema = z.object({
  siteId: z.string().min(1),
  featureKey: z.string().min(1),
  enabled: z.boolean(),
});


export async function POST(
  request: NextRequest
) {
  try {
    /* =======================================================
       REQUIRE MASTER ADMIN
    ======================================================= */

    const adminUser =
      await requireMasterAdmin();


    const body =
      requestSchema.parse(
        await request.json()
      );


    /* =======================================================
       VERIFY CAPABILITY DEFINITION
    ======================================================= */

    const definition =
      featureRegistry.find(
        (feature) =>
          feature.key ===
          body.featureKey
      );


    if (!definition) {
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
       UPDATE ENABLEMENT ONLY

       IMPORTANT:

       detected ≠ approved ≠ enabled

       This endpoint controls enabled state.

       It does NOT alter scanner detection or approval.
    ======================================================= */

    const {
      data: existingCapability,
      error: existingError,
    } = await supabase
      .from("site_capabilities")
      .select(
        "site_id, capability_key"
      )
      .eq(
        "site_id",
        body.siteId
      )
      .eq(
        "capability_key",
        body.featureKey
      )
      .maybeSingle();


    if (existingError) {
      console.error(
        "Capability lookup failed:",
        existingError.code
      );

      return NextResponse.json(
        {
          error:
            "Unable to read capability state.",
        },
        {
          status: 500,
        }
      );
    }


    if (existingCapability) {
      const {
        error: updateError,
      } = await supabase
        .from(
          "site_capabilities"
        )
        .update({
          enabled:
            body.enabled,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "site_id",
          body.siteId
        )
        .eq(
          "capability_key",
          body.featureKey
        );


      if (updateError) {
        console.error(
          "Capability update failed:",
          updateError.code
        );

        return NextResponse.json(
          {
            error:
              "Unable to update capability.",
          },
          {
            status: 500,
          }
        );
      }
    } else {
      const {
        error: insertError,
      } = await supabase
        .from(
          "site_capabilities"
        )
        .insert({
          site_id:
            body.siteId,

          capability_key:
            body.featureKey,

          detected:
            false,

          approved:
            false,

          enabled:
            body.enabled,

          confidence:
            "unsupported",

          confidence_score:
            0,

          detected_from:
            [],

          last_verified_at:
            null,

          updated_at:
            new Date().toISOString(),
        });


      if (insertError) {
        console.error(
          "Capability insert failed:",
          insertError.code
        );

        return NextResponse.json(
          {
            error:
              "Unable to create capability state.",
          },
          {
            status: 500,
          }
        );
      }
    }


    /* =======================================================
       AUDIT
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
          "capability.toggle",

        capability_key:
          body.featureKey,

        target_type:
          "site_capability",

        target_id:
          body.featureKey,

        success:
          true,

        metadata: {
          enabled:
            body.enabled,

          actorEmail:
            adminUser.email ??
            null,
        },
      });


    if (auditError) {
      console.error(
        "Capability audit log failed:",
        auditError.code
      );
    }


    return NextResponse.json({
      ok: true,

      siteId:
        body.siteId,

      featureKey:
        body.featureKey,

      enabled:
        body.enabled,
    });
  } catch (error) {
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


    if (
      error instanceof
      z.ZodError
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid capability request.",
        },
        {
          status: 400,
        }
      );
    }


    console.error(
      "LYNUX capability route failed:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Unable to update capability.",
      },
      {
        status: 500,
      }
    );
  }
}