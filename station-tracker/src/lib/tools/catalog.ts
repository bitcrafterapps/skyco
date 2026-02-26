export type ToolTier = 1 | 2 | 3;

export type ToolCategory =
  | "cutting"
  | "motorization"
  | "electrical"
  | "qc"
  | "planning"
  | "materials";

export type FactoryTool = {
  id: string;
  name: string;
  slug: string;
  tier: ToolTier;
  category: ToolCategory;
  priority: number;
  summary: string;
  route: string;
  status: "ready" | "planned";
};

export const TOOL_CATEGORIES: Array<{ id: ToolCategory; label: string }> = [
  { id: "cutting", label: "Cutting" },
  { id: "motorization", label: "Motorization" },
  { id: "electrical", label: "Electrical" },
  { id: "qc", label: "QC" },
  { id: "planning", label: "Planning" },
  { id: "materials", label: "Materials" },
];

export const FACTORY_TOOLS: FactoryTool[] = [
  {
    id: "fabric-calculator",
    name: "Fabric Calculator",
    slug: "fabric",
    tier: 1,
    category: "cutting",
    priority: 1,
    summary: "Calculate panel cuts, required yardage, roll yield, and scrap.",
    route: "/admin/tools/fabric",
    status: "ready",
  },
  {
    id: "extrusion-calculator",
    name: "Extrusion / Tube Cut Calculator",
    slug: "extrusion",
    tier: 1,
    category: "cutting",
    priority: 2,
    summary: "Calculate exact cut lengths with deduction and tolerance checks.",
    route: "/admin/tools/extrusion",
    status: "ready",
  },
  {
    id: "motor-sizing-calculator",
    name: "Motor Sizing Calculator",
    slug: "motor-sizing",
    tier: 1,
    category: "motorization",
    priority: 3,
    summary: "Recommend motor torque and family with safety margin.",
    route: "/admin/tools/motor-sizing",
    status: "ready",
  },
  {
    id: "bom-quick-calc",
    name: "Material Requirement Calculator (BOM Quick Calc)",
    slug: "bom-quick",
    tier: 1,
    category: "materials",
    priority: 4,
    summary: "Estimate fabric, tubes, brackets, motors, and accessories.",
    route: "/admin/tools/bom-quick",
    status: "ready",
  },
  {
    id: "production-time-estimator",
    name: "Production Time Estimator",
    slug: "time-estimator",
    tier: 1,
    category: "planning",
    priority: 5,
    summary: "Estimate labor minutes per station and total build hours.",
    route: "/admin/tools/time-estimator",
    status: "ready",
  },
  {
    id: "bracket-selector",
    name: "Bracket & Mounting Selector",
    slug: "bracket-selector",
    tier: 2,
    category: "materials",
    priority: 6,
    summary: "Select bracket sets by mount type, load, and dimensions.",
    route: "/admin/tools/bracket-selector",
    status: "ready",
  },
  {
    id: "electrical-load-calc",
    name: "Power / Electrical Load Calculator",
    slug: "electrical-load",
    tier: 2,
    category: "electrical",
    priority: 7,
    summary: "Aggregate amperage by zone and flag over-capacity circuits.",
    route: "/admin/tools/electrical-load",
    status: "ready",
  },
  {
    id: "packaging-freight-estimator",
    name: "Packaging Dimension & Freight Estimator",
    slug: "packaging-freight",
    tier: 2,
    category: "planning",
    priority: 8,
    summary: "Estimate packaging footprint, weight, and freight class.",
    route: "/admin/tools/packaging-freight",
    status: "ready",
  },
  {
    id: "qc-tolerance-checker",
    name: "QC Tolerance Checker",
    slug: "qc-tolerance",
    tier: 2,
    category: "qc",
    priority: 9,
    summary: "Automated tolerance pass/fail checks for station QA.",
    route: "/admin/tools/qc-tolerance",
    status: "ready",
  },
  {
    id: "batch-optimization-planner",
    name: "Batch Optimization Planner",
    slug: "batch-optimization",
    tier: 3,
    category: "planning",
    priority: 10,
    summary: "Group jobs to minimize setup, tooling, and material changeovers.",
    route: "/admin/tools/batch-optimization",
    status: "ready",
  },
  {
    id: "scrap-yield-analytics",
    name: "Scrap & Yield Analytics Tool",
    slug: "scrap-yield",
    tier: 3,
    category: "qc",
    priority: 11,
    summary: "Track waste, yield trends, and operator/station deltas.",
    route: "/admin/tools/scrap-yield",
    status: "ready",
  },
  {
    id: "capacity-simulator",
    name: "What-if Capacity Simulator",
    slug: "capacity-simulator",
    tier: 3,
    category: "planning",
    priority: 12,
    summary: "Model throughput and backlog impacts for staffing/equipment changes.",
    route: "/admin/tools/capacity-simulator",
    status: "ready",
  },
];

export function getToolsByTier(tier: ToolTier): FactoryTool[] {
  return FACTORY_TOOLS.filter((tool) => tool.tier === tier).sort(
    (a, b) => a.priority - b.priority
  );
}
