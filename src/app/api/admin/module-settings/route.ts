import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { moduleSettingsRegistry } from "@/lib/admin/module-settings";
import { createSupabaseAdminClient } from "@/lib/admin/supabase/server";

const requestSchema = z.object({
  siteId: z.string().min(1),
  featureKey: z.string().min(1),
  settingKey: z.string().min(1),
  enabled: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());

    const featureSettings =
      moduleSettingsRegistry[body.featureKey] ?? [];

    const definition = featureSettings.find(
      (setting) => setting.key === body.settingKey
    );

    if (!definition) {
      return NextResponse.json(
        {
          error: "Unknown module setting.",
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

    const { error: settingError } = await supabase
      .from("module_settings")
      .upsert(
        {
          site_id: body.siteId,
          feature_key: body.featureKey,
          setting_key: body.settingKey,
          enabled: body.enabled,
          dangerous: definition.danger === true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "site_id,feature_key,setting_key",
        }
      );

    if (settingError) {
      console.error(
        "Module setting write failed:",
        settingError.code
      );

      return NextResponse.json(
        {
          error: "Unable to update module setting.",
        },
        {
          status: 500,
        }
      );
    }

    await supabase.from("audit_logs").insert({
      site_id: body.siteId,
      actor_id: "master",
      action: "module-setting.toggle",
      capability_key: body.featureKey,
      target_type: "module_setting",
      target_id: `${body.featureKey}.${body.settingKey}`,
      success: true,
      metadata: {
        settingKey: body.settingKey,
        enabled: body.enabled,
        dangerous: definition.danger === true,
      },
    });

    return NextResponse.json({
      ok: true,
      siteId: body.siteId,
      featureKey: body.featureKey,
      settingKey: body.settingKey,
      enabled: body.enabled,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Invalid module setting request.",
      },
      {
        status: 400,
      }
    );
  }
}