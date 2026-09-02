"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  approveScannerCapability,
  rejectScannerCapability,
  resetScannerCapabilityReview,
} from "@/lib/admin/scanner/review-decisions";

import type {
  ScannerReviewSession,
} from "@/lib/admin/scanner/types";

type ScannerReviewPanelProps = {
  siteId: string;
  session: ScannerReviewSession | null;
};

type ReviewSaveState =
  | "idle"
  | "saving"
  | "saved"
  | "error";

function formatScore(
  score: number
) {
  return score.toFixed(4);
}

export function ScannerReviewPanel({
  siteId,
  session,
}: ScannerReviewPanelProps) {
  const [
    localSession,
    setLocalSession,
  ] = useState<ScannerReviewSession | null>(
    session
  );

  const [
    saveState,
    setSaveState,
  ] = useState<ReviewSaveState>(
    "idle"
  );

  useEffect(() => {
    setLocalSession(session);
    setSaveState("idle");
  }, [
    session,
    siteId,
  ]);

  if (!localSession) {
    return (
      <section className="scannerReviewPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">
              LYNUX Scanner
            </p>

            <h3>
              Capability Review
            </h3>
          </div>

          <p>
            No scanner review session
            is loaded for this site.
          </p>
        </div>

        <div className="notice">
          Run Scanner v1 to generate
          capability proposals for
          manual review.
        </div>
      </section>
    );
  }

  const pending =
    localSession.items.filter(
      (item) =>
        item.review.decision ===
        "pending"
    ).length;

  const approved =
    localSession.items.filter(
      (item) =>
        item.review.decision ===
        "approved"
    ).length;

  const rejected =
    localSession.items.filter(
      (item) =>
        item.review.decision ===
        "rejected"
    ).length;

  async function persistDecision({
    capabilityKey,
    decision,
    note,
  }: {
    capabilityKey: string;
    decision:
      | "pending"
      | "approved"
      | "rejected";
    note?: string | null;
  }) {
    setSaveState("saving");

    try {
      const response =
        await fetch(
          "/api/admin/scanner-review",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              siteId,
              capabilityKey,
              decision,
              note:
                note ?? null,
            }),
          }
        );

      if (!response.ok) {
        throw new Error();
      }

      setSaveState("saved");

      return true;
    } catch {
      setSaveState("error");

      return false;
    }
  }

  async function approveCapability(
    capabilityKey: string
  ) {
    const success =
      await persistDecision({
        capabilityKey,
        decision:
          "approved",
        note:
          "Approved in Scanner Review UI",
      });

    if (!success) {
      return;
    }

    setLocalSession(
      (current) => {
        if (!current) {
          return current;
        }

        return approveScannerCapability(
          current,
          capabilityKey,
          "Approved in Scanner Review UI"
        );
      }
    );
  }

  async function rejectCapability(
    capabilityKey: string
  ) {
    const success =
      await persistDecision({
        capabilityKey,
        decision:
          "rejected",
        note:
          "Rejected in Scanner Review UI",
      });

    if (!success) {
      return;
    }

    setLocalSession(
      (current) => {
        if (!current) {
          return current;
        }

        return rejectScannerCapability(
          current,
          capabilityKey,
          "Rejected in Scanner Review UI"
        );
      }
    );
  }

  async function resetCapability(
    capabilityKey: string
  ) {
    const success =
      await persistDecision({
        capabilityKey,
        decision:
          "pending",
        note:
          null,
      });

    if (!success) {
      return;
    }

    setLocalSession(
      (current) => {
        if (!current) {
          return current;
        }

        return resetScannerCapabilityReview(
          current,
          capabilityKey
        );
      }
    );
  }

  return (
    <section className="scannerReviewPanel">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">
            LYNUX Scanner
          </p>

          <h3>
            Capability Review
          </h3>
        </div>

        <p>
          Scanner proposals require
          manual approval before they
          can become Admin Core mappings.
        </p>
      </div>

      <div className="summaryGrid">
        <div className="metric">
          <div className="metricLabel">
            Detected
          </div>

          <div className="metricValue">
            {localSession.items.length}
          </div>
        </div>

        <div className="metric">
          <div className="metricLabel">
            Pending
          </div>

          <div className="metricValue">
            {pending}
          </div>
        </div>

        <div className="metric">
          <div className="metricLabel">
            Approved
          </div>

          <div className="metricValue">
            {approved}
          </div>
        </div>

        <div className="metric">
          <div className="metricLabel">
            Rejected
          </div>

          <div className="metricValue">
            {rejected}
          </div>
        </div>
      </div>

      <div className="featureTable">
        {localSession.items.map(
          (item) => {
            const proposal =
              item.proposal;

            const review =
              item.review;

            const strongestEvidence =
              [...proposal.evidence]
                .sort(
                  (a, b) =>
                    b.weight -
                    a.weight
                )
                .slice(0, 3);

            return (
              <div
                className="featureRow"
                key={
                  proposal.capabilityKey
                }
              >
                <div className="featureOpen">
                  <span className="featureName">
                    {
                      proposal.capabilityLabel
                    }
                  </span>

                  <span className="featureDesc">
                    {
                      proposal.capabilityKey
                    }
                    {" / "}
                    {
                      proposal.confidence
                    }
                    {" / "}
                    {formatScore(
                      proposal.confidenceScore
                    )}
                  </span>

                  <span className="featureMeta">
                    {
                      proposal.actions.length
                    }{" "}
                    detected actions
                  </span>

                  <div
                    style={{
                      marginTop:
                        "12px",

                      display:
                        "grid",

                      gap:
                        "6px",
                    }}
                  >
                    {strongestEvidence.map(
                      (
                        evidence,
                        index
                      ) => (
                        <span
                          key={`${evidence.filePath}-${evidence.line}-${index}`}
                          style={{
                            fontSize:
                              "11px",

                            opacity:
                              0.65,
                          }}
                        >
                          [
                          {
                            evidence.signalKind
                          }
                          ]{" "}
                          {
                            evidence.value
                          }
                          {" — "}
                          {
                            evidence.filePath
                          }
                          {evidence.line
                            ? `:${evidence.line}`
                            : ""}
                        </span>
                      )
                    )}
                  </div>

                  {review.note && (
                    <span
                      style={{
                        display:
                          "block",

                        marginTop:
                          "10px",

                        fontSize:
                          "10px",

                        opacity:
                          0.65,
                      }}
                    >
                      {review.note}
                    </span>
                  )}
                </div>

                <div
                  className="featureControl"
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "8px",

                    flexWrap:
                      "wrap",

                    justifyContent:
                      "flex-end",
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        "10px",

                      textTransform:
                        "uppercase",

                      letterSpacing:
                        "0.12em",
                    }}
                  >
                    {
                      review.decision
                    }
                  </span>

                  {review.decision ===
                    "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={
                          saveState ===
                          "saving"
                        }
                        onClick={() =>
                          approveCapability(
                            proposal.capabilityKey
                          )
                        }
                      >
                        APPROVE
                      </button>

                      <button
                        type="button"
                        disabled={
                          saveState ===
                          "saving"
                        }
                        onClick={() =>
                          rejectCapability(
                            proposal.capabilityKey
                          )
                        }
                      >
                        REJECT
                      </button>
                    </>
                  )}

                  {review.decision !==
                    "pending" && (
                    <button
                      type="button"
                      disabled={
                        saveState ===
                        "saving"
                      }
                      onClick={() =>
                        resetCapability(
                          proposal.capabilityKey
                        )
                      }
                    >
                      RESET
                    </button>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="notice">
        {saveState === "saving"
          ? "Saving scanner review..."
          : saveState === "error"
            ? "Scanner review save failed."
            : saveState === "saved"
              ? "Scanner review saved."
              : "Scanner review decisions are separate from capability enablement."}
      </div>
    </section>
  );
}