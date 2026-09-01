import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { featureRegistry } from "@/lib/admin/feature-registry";
import { createSupabaseAdminClient } from "@/lib/admin/supabase/server";

const requestSchema = z.object({
  siteId: z.string().min(1),
  featureKey: z.string().min(1),
  enabled: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());

    const definition = featureRegistry.find(
      (feature) => feature.key === body.featureKey
    );

    if (!definition) {
      return NextResponse.json(
        {
          error: "Unknown capability.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id")
      .eq("id", body.siteId)
      .maybeSingle();

    if (siteError || !site) {
      return NextResponse.json(
        {
          error: "Site not found.",
        },
        {
          status: 404,
        }
      );
    }

    const { error: registryError } = await supabase
      .from("capability_registry")
      .upsert(
        {
          key: definition.key,
          label: definition.label,
          description: definition.description,
          category: definition.category,
          dangerous: false,
          master_only: definition.masterOnly === true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "key",
        }
      );

    if (registryError) {
      console.error(
        "Capability registry write failed:",
        registryError.code
      );

      return NextResponse.json(
        {
          error: "Unable to register capability.",
        },
        {
          status: 500,
        }
      );
    }

    const { error: capabilityError } = await supabase
      .from("site_capabilities")
      .upsert(
        {
          site_id: body.siteId,
          capability_key: body.featureKey,

          detected: true,
          approved: true,
          enabled: body.enabled,

          confidence: "verified",
          confidence_score: 100,

          detected_from: ["registry"],

          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "site_id,capability_key",
        }
      );

    if (capabilityError) {
      console.error(
        "Site capability write failed:",
        capabilityError.code
      );

      return NextResponse.json(
        {
          error: "Unable to update capability.",
        },
        {
          status: 500,
        }
      );
    }

    await supabase.from("audit_logs").insert({
      site_id: body.siteId,
      actor_id: "master",
      action: "capability.toggle",
      capability_key: body.featureKey,
      target_type: "site_capability",
      target_id: body.featureKey,
      success: true,
      metadata: {
        enabled: body.enabled,
      },
    });

    return NextResponse.json({
      ok: true,
      siteId: body.siteId,
      featureKey: body.featureKey,
      enabled: body.enabled,
    });
  } catch (error) {
    console.error("Capability API rejected request.");

    return NextResponse.json(
      {
        error: "Invalid capability request.",
      },
      {
        status: 400,
      }
    );
  }
}