import {
  defaultBatchOptimizationInput,
  defaultBomQuickInput,
  defaultBracketSelectorInput,
  defaultCapacitySimulatorInput,
  defaultElectricalLoadInput,
  defaultMotorSizingInput,
  defaultPackagingFreightInput,
  defaultProductionTimeInput,
  defaultQcToleranceInput,
  defaultScrapYieldInput,
} from "./calculators";

export type ToolFieldType = "number" | "select" | "boolean";

export type ToolFieldDefinition = {
  key: string;
  label: string;
  type: ToolFieldType;
  step?: string;
  options?: Array<{ value: string; label: string }>;
};

export type ToolResultDefinition = {
  key: string;
  label: string;
  suffix?: string;
  tone?: "default" | "good" | "warn";
};

export type ToolDefinition = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  assumptions: string[];
  fields: ToolFieldDefinition[];
  results: ToolResultDefinition[];
  defaultInput: Record<string, number | string | boolean>;
};

const MOTOR = defaultMotorSizingInput();
const BOM = defaultBomQuickInput();
const TIME = defaultProductionTimeInput();
const BRACKET = defaultBracketSelectorInput();
const ELECTRICAL = defaultElectricalLoadInput();
const PACKAGING = defaultPackagingFreightInput();
const QC = defaultQcToleranceInput();
const BATCH = defaultBatchOptimizationInput();
const SCRAP = defaultScrapYieldInput();
const CAPACITY = defaultCapacitySimulatorInput();

export const DYNAMIC_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    id: "motor-sizing-calculator",
    slug: "motor-sizing",
    title: "Motor Sizing Calculator",
    subtitle: "Recommend torque class and motor family with margin guidance",
    assumptions: [
      "Duty cycle and lift type apply multiplier factors.",
      "Output is a planning recommendation, not engineering certification.",
      "Safety margin under 15% should use next motor size.",
    ],
    fields: [
      { key: "finishedWidthIn", label: 'Finished Width (")', type: "number", step: "0.01" },
      { key: "finishedDropIn", label: 'Finished Drop (")', type: "number", step: "0.01" },
      { key: "fabricWeightOzSqYd", label: "Fabric Weight (oz/sq yd)", type: "number", step: "0.01" },
      { key: "tubeDiameterIn", label: 'Tube Diameter (")', type: "number", step: "0.01" },
      {
        key: "liftType",
        label: "Lift Type",
        type: "select",
        options: [
          { value: "standard", label: "Standard" },
          { value: "blackout", label: "Blackout" },
          { value: "dual", label: "Dual Layer" },
        ],
      },
      { key: "dutyCyclePercent", label: "Duty Cycle (%)", type: "number", step: "1" },
    ],
    results: [
      { key: "areaSqFt", label: "Shade Area", suffix: " sq ft" },
      { key: "requiredTorqueNm", label: "Required Torque", suffix: " Nm" },
      { key: "recommendedMotorFamily", label: "Recommended Motor Family" },
      { key: "safetyMarginPercent", label: "Safety Margin", suffix: "%" },
      { key: "warning", label: "Recommendation Note", tone: "warn" },
    ],
    defaultInput: MOTOR,
  },
  {
    id: "bom-quick-calc",
    slug: "bom-quick",
    title: "Material Requirement Calculator (BOM Quick Calc)",
    subtitle: "Generate a fast, order-level material estimate",
    assumptions: [
      "Hardware multipliers assume standard single-shade assemblies.",
      "Fabric estimate uses simplified panel and cut length logic.",
      "Use as pre-production planning, then confirm against job BOM.",
    ],
    fields: [
      { key: "quantity", label: "Quantity", type: "number", step: "1" },
      { key: "widthIn", label: 'Finished Width (")', type: "number", step: "0.01" },
      { key: "dropIn", label: 'Finished Drop (")', type: "number", step: "0.01" },
      { key: "rollWidthIn", label: 'Roll Width (")', type: "number", step: "0.01" },
      { key: "motorized", label: "Motorized", type: "boolean" },
      {
        key: "controlType",
        label: "Control Type",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "remote", label: "Remote" },
          { value: "wired", label: "Wired" },
        ],
      },
    ],
    results: [
      { key: "fabricYards", label: "Fabric Estimate", suffix: " yd" },
      { key: "tubeCount", label: "Tubes" },
      { key: "bracketSets", label: "Bracket Sets" },
      { key: "fastenerCount", label: "Fasteners" },
      { key: "hemBarCount", label: "Hem Bars" },
      { key: "motorCount", label: "Motors" },
      { key: "controlCount", label: "Controls" },
    ],
    defaultInput: BOM,
  },
  {
    id: "production-time-estimator",
    slug: "time-estimator",
    title: "Production Time Estimator",
    subtitle: "Estimate station labor and total line time by order mix",
    assumptions: [
      "Complexity factor scales average build time.",
      "Setup overhead is applied once per run.",
      "Estimated days assume a single 8-hour line schedule.",
    ],
    fields: [
      { key: "quantity", label: "Order Quantity", type: "number", step: "1" },
      {
        key: "complexity",
        label: "Complexity",
        type: "select",
        options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
        ],
      },
      { key: "stationCount", label: "Station Count", type: "number", step: "1" },
      { key: "setupMinutes", label: "Setup Minutes", type: "number", step: "1" },
      { key: "avgMinutesPerUnit", label: "Avg Minutes / Unit", type: "number", step: "0.1" },
    ],
    results: [
      { key: "totalLaborMinutes", label: "Total Labor", suffix: " min" },
      { key: "minutesPerStation", label: "Labor / Station", suffix: " min" },
      { key: "lineHours", label: "Line Hours", suffix: " hr" },
      { key: "estimatedDaysAt8Hours", label: "Estimated Days", suffix: " d" },
    ],
    defaultInput: TIME,
  },
  {
    id: "bracket-selector",
    slug: "bracket-selector",
    title: "Bracket & Mounting Selector",
    subtitle: "Recommend bracket type and anchoring strategy",
    assumptions: [
      "Selection blends span, drop, weight class, and exposure.",
      "Drywall + outdoor combinations receive caution warnings.",
      "Always validate with local engineering/safety requirements.",
    ],
    fields: [
      {
        key: "mountingSurface",
        label: "Mounting Surface",
        type: "select",
        options: [
          { value: "drywall", label: "Drywall" },
          { value: "wood", label: "Wood" },
          { value: "metal", label: "Metal" },
          { value: "concrete", label: "Concrete" },
        ],
      },
      { key: "finishedWidthIn", label: 'Finished Width (")', type: "number", step: "0.01" },
      { key: "finishedDropIn", label: 'Finished Drop (")', type: "number", step: "0.01" },
      {
        key: "weightClass",
        label: "Weight Class",
        type: "select",
        options: [
          { value: "light", label: "Light" },
          { value: "medium", label: "Medium" },
          { value: "heavy", label: "Heavy" },
        ],
      },
      { key: "outdoorExposure", label: "Outdoor Exposure", type: "boolean" },
    ],
    results: [
      { key: "recommendedBracket", label: "Recommended Bracket" },
      { key: "anchorType", label: "Anchor Type" },
      { key: "minFastenersPerSide", label: "Min Fasteners / Side" },
      { key: "loadRatingLb", label: "Estimated Load Rating", suffix: " lb" },
      { key: "warnings", label: "Warnings", tone: "warn" },
    ],
    defaultInput: BRACKET,
  },
  {
    id: "electrical-load-calc",
    slug: "electrical-load",
    title: "Power / Electrical Load Calculator",
    subtitle: "Aggregate motor/control load and circuit utilization",
    assumptions: [
      "Breaker planning uses 80% continuous load rule.",
      "Diversity factor accounts for non-simultaneous operation.",
      "Result is planning guidance; final design needs electrical review.",
    ],
    fields: [
      { key: "motorCount", label: "Motor Count", type: "number", step: "1" },
      { key: "motorAmps", label: "Motor Amps (each)", type: "number", step: "0.01" },
      { key: "controlAmps", label: "Control Load Amps", type: "number", step: "0.01" },
      { key: "zoneCount", label: "Zone Count", type: "number", step: "1" },
      { key: "breakerRatingAmps", label: "Breaker Rating (A)", type: "number", step: "1" },
      { key: "diversityFactorPercent", label: "Diversity Factor (%)", type: "number", step: "1" },
    ],
    results: [
      { key: "totalConnectedAmps", label: "Connected Load", suffix: " A" },
      { key: "diversifiedAmps", label: "Diversified Load", suffix: " A" },
      { key: "ampsPerZone", label: "Amps / Zone", suffix: " A" },
      { key: "breakerUtilizationPercent", label: "Breaker Utilization", suffix: "%" },
      { key: "recommendedCircuits", label: "Recommended Circuits" },
      { key: "overCapacity", label: "Over Capacity" },
    ],
    defaultInput: ELECTRICAL,
  },
  {
    id: "packaging-freight-estimator",
    slug: "packaging-freight",
    title: "Packaging Dimension & Freight Estimator",
    subtitle: "Estimate package dimensions, weight, and freight class",
    assumptions: [
      "Dimensional weight uses divisor 139.",
      "Palletized shipments include baseline pallet tare weight.",
      "Freight class output is approximate planning guidance.",
    ],
    fields: [
      { key: "quantity", label: "Quantity", type: "number", step: "1" },
      { key: "widthIn", label: 'Unit Width (")', type: "number", step: "0.01" },
      { key: "dropIn", label: 'Unit Length (")', type: "number", step: "0.01" },
      { key: "depthIn", label: 'Unit Depth (")', type: "number", step: "0.01" },
      { key: "unitWeightLb", label: "Unit Weight (lb)", type: "number", step: "0.01" },
      { key: "paddingIn", label: 'Padding (")', type: "number", step: "0.01" },
      { key: "palletized", label: "Palletized", type: "boolean" },
    ],
    results: [
      { key: "cartonLengthIn", label: "Carton Length", suffix: '"' },
      { key: "cartonWidthIn", label: "Carton Width", suffix: '"' },
      { key: "cartonHeightIn", label: "Carton Height", suffix: '"' },
      { key: "packageWeightLb", label: "Package Weight", suffix: " lb" },
      { key: "dimensionalWeightLb", label: "Dimensional Weight", suffix: " lb" },
      { key: "freightClass", label: "Freight Class" },
    ],
    defaultInput: PACKAGING,
  },
  {
    id: "qc-tolerance-checker",
    slug: "qc-tolerance",
    title: "QC Tolerance Checker",
    subtitle: "Pass/fail checks for cut, drop, and squareness tolerances",
    assumptions: [
      "Deviations use absolute difference from target values.",
      "Overall pass requires all dimensions pass individually.",
      "Tolerance thresholds should reflect station SOP.",
    ],
    fields: [
      { key: "targetCutIn", label: 'Target Cut (")', type: "number", step: "0.001" },
      { key: "actualCutIn", label: 'Actual Cut (")', type: "number", step: "0.001" },
      { key: "targetDropIn", label: 'Target Drop (")', type: "number", step: "0.001" },
      { key: "actualDropIn", label: 'Actual Drop (")', type: "number", step: "0.001" },
      { key: "targetSquareIn", label: 'Target Square (")', type: "number", step: "0.001" },
      { key: "actualSquareIn", label: 'Actual Square (")', type: "number", step: "0.001" },
      { key: "cutToleranceIn", label: 'Cut Tolerance (")', type: "number", step: "0.001" },
      { key: "dropToleranceIn", label: 'Drop Tolerance (")', type: "number", step: "0.001" },
      { key: "squareToleranceIn", label: 'Square Tolerance (")', type: "number", step: "0.001" },
    ],
    results: [
      { key: "cutDeviationIn", label: "Cut Deviation", suffix: '"' },
      { key: "dropDeviationIn", label: "Drop Deviation", suffix: '"' },
      { key: "squareDeviationIn", label: "Square Deviation", suffix: '"' },
      { key: "cutPass", label: "Cut Pass", tone: "good" },
      { key: "dropPass", label: "Drop Pass", tone: "good" },
      { key: "squarePass", label: "Square Pass", tone: "good" },
      { key: "overallPass", label: "Overall Pass", tone: "warn" },
    ],
    defaultInput: QC,
  },
  {
    id: "batch-optimization-planner",
    slug: "batch-optimization",
    title: "Batch Optimization Planner",
    subtitle: "Optimize batch size and changeover overhead",
    assumptions: [
      "Family complexity blends fabric, tube, and motor variation.",
      "Changeover time is a fixed average per transition.",
      "Planner output is best used for shift-level sequencing.",
    ],
    fields: [
      { key: "ordersCount", label: "Orders Count", type: "number", step: "1" },
      { key: "fabricFamilies", label: "Fabric Families", type: "number", step: "1" },
      { key: "tubeFamilies", label: "Tube Families", type: "number", step: "1" },
      { key: "motorFamilies", label: "Motor Families", type: "number", step: "1" },
      { key: "changeoverMinutes", label: "Changeover Minutes", type: "number", step: "1" },
      { key: "avgBuildMinutes", label: "Avg Build Minutes", type: "number", step: "0.1" },
    ],
    results: [
      { key: "weightedFamilies", label: "Weighted Families" },
      { key: "recommendedBatchSize", label: "Recommended Batch Size" },
      { key: "estimatedChangeovers", label: "Estimated Changeovers" },
      { key: "changeoverMinutesTotal", label: "Changeover Total", suffix: " min" },
      { key: "projectedLineHours", label: "Projected Line Hours", suffix: " hr" },
    ],
    defaultInput: BATCH,
  },
  {
    id: "scrap-yield-analytics",
    slug: "scrap-yield",
    title: "Scrap & Yield Analytics Tool",
    subtitle: "Track scrap, rework, and quality score trends",
    assumptions: [
      "Rates are calculated as percentages of produced units.",
      "Fabric yield compares consumed fabric to scrap material.",
      "Quality score is a blended operational indicator.",
    ],
    fields: [
      { key: "producedUnits", label: "Produced Units", type: "number", step: "1" },
      { key: "scrapUnits", label: "Scrap Units", type: "number", step: "1" },
      { key: "reworkUnits", label: "Rework Units", type: "number", step: "1" },
      { key: "fabricUsedYards", label: "Fabric Used (yd)", type: "number", step: "0.01" },
      { key: "fabricScrapYards", label: "Fabric Scrap (yd)", type: "number", step: "0.01" },
    ],
    results: [
      { key: "scrapRatePercent", label: "Scrap Rate", suffix: "%" },
      { key: "yieldRatePercent", label: "Yield Rate", suffix: "%" },
      { key: "reworkRatePercent", label: "Rework Rate", suffix: "%" },
      { key: "fabricYieldPercent", label: "Fabric Yield", suffix: "%" },
      { key: "qualityScore", label: "Quality Score" },
    ],
    defaultInput: SCRAP,
  },
  {
    id: "capacity-simulator",
    slug: "capacity-simulator",
    title: "What-if Capacity Simulator",
    subtitle: "Model backlog clear time under staffing and shift changes",
    assumptions: [
      "OEE reduces theoretical capacity to effective capacity.",
      "Estimated clear time assumes constant throughput.",
      "Additional operators are computed against a 5-day horizon.",
    ],
    fields: [
      { key: "backlogOrders", label: "Backlog Orders", type: "number", step: "1" },
      { key: "avgMinutesPerOrder", label: "Avg Minutes / Order", type: "number", step: "0.1" },
      { key: "operators", label: "Operators", type: "number", step: "1" },
      { key: "shiftHours", label: "Shift Hours", type: "number", step: "0.5" },
      { key: "shiftsPerDay", label: "Shifts / Day", type: "number", step: "1" },
      { key: "oeePercent", label: "OEE (%)", type: "number", step: "1" },
    ],
    results: [
      { key: "effectiveMinutesPerDay", label: "Effective Minutes / Day", suffix: " min" },
      { key: "dailyCapacityOrders", label: "Daily Capacity", suffix: " orders" },
      { key: "daysToClearBacklog", label: "Days to Clear Backlog", suffix: " d" },
      { key: "utilizationPercent", label: "Utilization", suffix: "%" },
      { key: "additionalOperatorsNeeded", label: "Additional Operators Needed" },
    ],
    defaultInput: CAPACITY,
  },
];

export function getDynamicToolBySlug(slug: string): ToolDefinition | null {
  return DYNAMIC_TOOL_DEFINITIONS.find((tool) => tool.slug === slug) ?? null;
}

export function getDynamicToolById(id: string): ToolDefinition | null {
  return DYNAMIC_TOOL_DEFINITIONS.find((tool) => tool.id === id) ?? null;
}
