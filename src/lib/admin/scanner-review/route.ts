import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  z,
} from "zod";

import {
  updateScannerReviewDecision,
} from "@/lib/admin/scanner/review-persistence";

import {
  createSupabaseAdminClient,
} from "@/lib/admin/supabase/server";

const requestSchema =
  z.object({
    siteId:
      z.string().min(1),

    capabilityKey:
      z.string().min(1),

    decision:
      z.enum([
        "pending",
        "approved",
        "rejected",
      ]),

    note:
      z.string()
        .trim()
        .max(500)
        .nullable()
        .optional(),
  });

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      requestSchema.parse(
        await request.json()
      );

    const supabase =
      createSupabaseAdminClient();

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
          body.note ?? null,
      }
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
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
        status: 400,
      }
    );
  }
}