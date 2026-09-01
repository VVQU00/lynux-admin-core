import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  authenticateSiteConnector,
} from "@/lib/admin/connector-auth";

import {
  featureRegistry,
} from "@/lib/admin/feature-registry";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";

const requestSchema = z.object({
  capabilities: z.record(
    z.string(),
    z.boolean()
  ),
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
          ok: false,
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

    const supabase =
      createSupabaseAdminClient();

    const knownFeatures =
      new Map(
        featureRegistry.map(
          (feature) => [
            feature.key,
            feature,
          ]
        )
      );

    let synced = 0;

    for (
      const [
        featureKey,
        enabled,
      ] of Object.entries(
        body.capabilities
      )
    ) {
      const definition =
        knownFeatures.get(
          featureKey
        );

      if (!definition) {
        continue;
      }

      await supabase
        .from(
          "capability_registry"
        )
        .upsert(
          {
            key:
              definition.key,

            label:
              definition.label,

            description:
              definition.description,

            category:
              definition.category,

            dangerous:
              false,

            master_only:
              definition.masterOnly ===
              true,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict: "key",
          }
        );

      const {
        error:
          capabilityError,
      } = await supabase
        .from(
          "site_capabilities"
        )
        .upsert(
          {
            site_id:
              connector.siteId,

            capability_key:
              featureKey,

            detected: true,
            approved: true,
            enabled,

            confidence:
              "verified",

            confidence_score:
              100,

            detected_from: [
              "manifest",
            ],

            last_verified_at:
              new Date()
                .toISOString(),

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "site_id,capability_key",
          }
        );

      if (
        !capabilityError
      ) {
        synced++;
      }
    }

    await supabase
      .from("sites")
      .update({
        connection_status:
          "connected",

        health_status:
          "healthy",

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        connector.siteId
      );

    return NextResponse.json({
      ok: true,
      authenticated: true,
      siteId:
        connector.siteId,
      synced,
    });
  } catch (error) {
    console.error(
      "Capability sync failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid capability sync request.",
      },
      {
        status: 400,
      }
    );
  }
}