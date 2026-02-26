export const TOOLS_RULES_VERSION = "2026.02.24";

export const FABRIC_RULES = {
  topAllowanceIn: 2,
  defaultHemAllowanceIn: 1.5,
  defaultSeamAllowanceIn: 0.5,
  defaultWastePercent: 8,
  defaultPatternRepeatIn: 0,
  standardRollYards: 50,
  maxWastePercent: 95,
};

export const EXTRUSION_RULES = {
  defaultBracketLeftDeductionIn: 0.25,
  defaultBracketRightDeductionIn: 0.25,
  defaultMotorSideDeductionIn: 0.375,
  defaultIdlerSideDeductionIn: 0.25,
  defaultEndcapAllowanceIn: 0.125,
  defaultSawKerfIn: 0.0625,
  defaultToleranceIn: 0.0625,
};

export const TOOLS_SUCCESS_METRICS = [
  {
    id: "reworkReductionPct",
    label: "Rework Reduction (%)",
    description: "Reduction in rework caused by cutting and sizing errors.",
  },
  {
    id: "prepTimeReductionPct",
    label: "Average Prep Time Reduction (%)",
    description: "Drop in order prep time after calculator adoption.",
  },
  {
    id: "firstPassQcPct",
    label: "First-Pass QC Rate (%)",
    description: "Percentage of jobs passing QC without rework.",
  },
  {
    id: "toolRunsPerDay",
    label: "Tool Runs / Day",
    description: "Daily usage volume across all factory-floor tools.",
  },
  {
    id: "activeStationsUsingTools",
    label: "Active Stations Using Tools",
    description: "Count of stations using at least one tool daily.",
  },
] as const;
