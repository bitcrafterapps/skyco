import { EXTRUSION_RULES, FABRIC_RULES } from "./rules";

export type FabricCalculatorInput = {
  shadeType: string;
  finishedWidthIn: number;
  finishedDropIn: number;
  rollWidthIn: number;
  quantity: number;
  seamAllowanceIn: number;
  hemAllowanceIn: number;
  patternRepeatIn: number;
  wastePercent: number;
};

export type FabricCalculatorResult = {
  panelCount: number;
  cutLengthPerPanelIn: number;
  totalCutLengthIn: number;
  requiredYards: number;
  requiredYardsWithWaste: number;
  estimatedScrapPercent: number;
  yieldPerStandardRoll: number;
  formulaSummary: string;
};

export type ExtrusionCalculatorInput = {
  finishedWidthIn: number;
  bracketLeftDeductionIn: number;
  bracketRightDeductionIn: number;
  motorSideDeductionIn: number;
  idlerSideDeductionIn: number;
  endcapAllowanceIn: number;
  sawKerfIn: number;
  toleranceIn: number;
};

export type ExtrusionCalculatorResult = {
  netCutLengthIn: number;
  toleranceMinIn: number;
  toleranceMaxIn: number;
  totalDeductionsIn: number;
  qcTargetIn: number;
  formulaSummary: string;
};

export type MotorSizingInput = {
  finishedWidthIn: number;
  finishedDropIn: number;
  fabricWeightOzSqYd: number;
  tubeDiameterIn: number;
  liftType: "standard" | "blackout" | "dual";
  dutyCyclePercent: number;
};

export type MotorSizingResult = {
  areaSqFt: number;
  requiredTorqueNm: number;
  recommendedMotorFamily: string;
  safetyMarginPercent: number;
  warning: string;
  formulaSummary: string;
};

export type BomQuickInput = {
  quantity: number;
  widthIn: number;
  dropIn: number;
  rollWidthIn: number;
  motorized: boolean;
  controlType: "none" | "remote" | "wired";
};

export type BomQuickResult = {
  fabricYards: number;
  tubeCount: number;
  bracketSets: number;
  fastenerCount: number;
  hemBarCount: number;
  motorCount: number;
  controlCount: number;
  formulaSummary: string;
};

export type ProductionTimeInput = {
  quantity: number;
  complexity: "low" | "medium" | "high";
  stationCount: number;
  setupMinutes: number;
  avgMinutesPerUnit: number;
};

export type ProductionTimeResult = {
  totalLaborMinutes: number;
  minutesPerStation: number;
  lineHours: number;
  estimatedDaysAt8Hours: number;
  formulaSummary: string;
};

export type BracketSelectorInput = {
  mountingSurface: "drywall" | "wood" | "metal" | "concrete";
  finishedWidthIn: number;
  finishedDropIn: number;
  weightClass: "light" | "medium" | "heavy";
  outdoorExposure: boolean;
};

export type BracketSelectorResult = {
  recommendedBracket: string;
  anchorType: string;
  minFastenersPerSide: number;
  loadRatingLb: number;
  warnings: string;
  formulaSummary: string;
};

export type ElectricalLoadInput = {
  motorCount: number;
  motorAmps: number;
  controlAmps: number;
  zoneCount: number;
  breakerRatingAmps: number;
  diversityFactorPercent: number;
};

export type ElectricalLoadResult = {
  totalConnectedAmps: number;
  diversifiedAmps: number;
  ampsPerZone: number;
  breakerUtilizationPercent: number;
  overCapacity: boolean;
  recommendedCircuits: number;
  formulaSummary: string;
};

export type PackagingFreightInput = {
  quantity: number;
  widthIn: number;
  dropIn: number;
  depthIn: number;
  unitWeightLb: number;
  paddingIn: number;
  palletized: boolean;
};

export type PackagingFreightResult = {
  cartonLengthIn: number;
  cartonWidthIn: number;
  cartonHeightIn: number;
  packageWeightLb: number;
  totalShipmentWeightLb: number;
  dimensionalWeightLb: number;
  freightClass: string;
  formulaSummary: string;
};

export type QcToleranceInput = {
  targetCutIn: number;
  actualCutIn: number;
  targetDropIn: number;
  actualDropIn: number;
  targetSquareIn: number;
  actualSquareIn: number;
  cutToleranceIn: number;
  dropToleranceIn: number;
  squareToleranceIn: number;
};

export type QcToleranceResult = {
  cutDeviationIn: number;
  dropDeviationIn: number;
  squareDeviationIn: number;
  cutPass: boolean;
  dropPass: boolean;
  squarePass: boolean;
  overallPass: boolean;
  formulaSummary: string;
};

export type BatchOptimizationInput = {
  ordersCount: number;
  fabricFamilies: number;
  tubeFamilies: number;
  motorFamilies: number;
  changeoverMinutes: number;
  avgBuildMinutes: number;
};

export type BatchOptimizationResult = {
  weightedFamilies: number;
  recommendedBatchSize: number;
  estimatedChangeovers: number;
  changeoverMinutesTotal: number;
  projectedLineHours: number;
  formulaSummary: string;
};

export type ScrapYieldInput = {
  producedUnits: number;
  scrapUnits: number;
  reworkUnits: number;
  fabricUsedYards: number;
  fabricScrapYards: number;
};

export type ScrapYieldResult = {
  scrapRatePercent: number;
  yieldRatePercent: number;
  reworkRatePercent: number;
  fabricYieldPercent: number;
  qualityScore: number;
  formulaSummary: string;
};

export type CapacitySimulatorInput = {
  backlogOrders: number;
  avgMinutesPerOrder: number;
  operators: number;
  shiftHours: number;
  shiftsPerDay: number;
  oeePercent: number;
};

export type CapacitySimulatorResult = {
  effectiveMinutesPerDay: number;
  dailyCapacityOrders: number;
  daysToClearBacklog: number;
  utilizationPercent: number;
  additionalOperatorsNeeded: number;
  formulaSummary: string;
};

export function calculateFabric(input: FabricCalculatorInput): FabricCalculatorResult {
  const effectiveWidth = Math.max(1, input.finishedWidthIn);
  const panelCount = Math.max(
    1,
    Math.ceil(
      (effectiveWidth + Math.max(0, input.seamAllowanceIn)) /
        Math.max(1, input.rollWidthIn)
    )
  );

  const basePanelLength =
    Math.max(0, input.finishedDropIn) +
    Math.max(0, input.hemAllowanceIn) +
    FABRIC_RULES.topAllowanceIn;

  const repeat = Math.max(0, input.patternRepeatIn);
  const cutLengthPerPanelIn =
    repeat > 0 ? Math.ceil(basePanelLength / repeat) * repeat : basePanelLength;

  const totalCutLengthIn = panelCount * cutLengthPerPanelIn * Math.max(1, input.quantity);
  const requiredYards = totalCutLengthIn / 36;

  const widthUsedIn = effectiveWidth + Math.max(0, input.seamAllowanceIn) * (panelCount - 1);
  const widthCapacityIn = panelCount * Math.max(1, input.rollWidthIn);
  const widthScrapPercent = widthCapacityIn > 0 ? ((widthCapacityIn - widthUsedIn) / widthCapacityIn) * 100 : 0;
  const baseWaste = Math.max(0, Math.min(input.wastePercent, FABRIC_RULES.maxWastePercent));
  const estimatedScrapPercent = Math.max(0, Math.min(95, baseWaste + Math.max(0, widthScrapPercent * 0.5)));
  const requiredYardsWithWaste = requiredYards * (1 + estimatedScrapPercent / 100);

  const rollInches = FABRIC_RULES.standardRollYards * 36;
  const singleShadeInches = panelCount * cutLengthPerPanelIn;
  const yieldPerStandardRoll =
    singleShadeInches > 0 ? Math.max(0, Math.floor(rollInches / singleShadeInches)) : 0;

  return {
    panelCount,
    cutLengthPerPanelIn: round3(cutLengthPerPanelIn),
    totalCutLengthIn: round3(totalCutLengthIn),
    requiredYards: round3(requiredYards),
    requiredYardsWithWaste: round3(requiredYardsWithWaste),
    estimatedScrapPercent: round2(estimatedScrapPercent),
    yieldPerStandardRoll,
    formulaSummary:
      "Panels = ceil((FinishedWidth + SeamAllowance) / RollWidth), CutLength = Drop + Hem + TopAllowance (rounded to pattern repeat), RequiredYards = Panels * CutLength * Quantity / 36",
  };
}

export function calculateExtrusion(
  input: ExtrusionCalculatorInput
): ExtrusionCalculatorResult {
  const totalDeductionsIn =
    Math.max(0, input.bracketLeftDeductionIn) +
    Math.max(0, input.bracketRightDeductionIn) +
    Math.max(0, input.motorSideDeductionIn) +
    Math.max(0, input.idlerSideDeductionIn) +
    Math.max(0, input.endcapAllowanceIn) +
    Math.max(0, input.sawKerfIn);

  const netCutLengthIn = Math.max(0, input.finishedWidthIn - totalDeductionsIn);
  const tol = Math.max(0, input.toleranceIn);
  const toleranceMinIn = Math.max(0, netCutLengthIn - tol);
  const toleranceMaxIn = netCutLengthIn + tol;

  return {
    netCutLengthIn: round3(netCutLengthIn),
    toleranceMinIn: round3(toleranceMinIn),
    toleranceMaxIn: round3(toleranceMaxIn),
    totalDeductionsIn: round3(totalDeductionsIn),
    qcTargetIn: round3(netCutLengthIn),
    formulaSummary:
      "NetCutLength = FinishedWidth - (BracketLeft + BracketRight + MotorSide + IdlerSide + Endcap + SawKerf), ToleranceRange = NetCutLength ± Tolerance",
  };
}

export function defaultFabricInput(): FabricCalculatorInput {
  return {
    shadeType: "roller",
    finishedWidthIn: 72,
    finishedDropIn: 84,
    rollWidthIn: 118,
    quantity: 1,
    seamAllowanceIn: FABRIC_RULES.defaultSeamAllowanceIn,
    hemAllowanceIn: FABRIC_RULES.defaultHemAllowanceIn,
    patternRepeatIn: FABRIC_RULES.defaultPatternRepeatIn,
    wastePercent: FABRIC_RULES.defaultWastePercent,
  };
}

export function defaultExtrusionInput(): ExtrusionCalculatorInput {
  return {
    finishedWidthIn: 72,
    bracketLeftDeductionIn: EXTRUSION_RULES.defaultBracketLeftDeductionIn,
    bracketRightDeductionIn: EXTRUSION_RULES.defaultBracketRightDeductionIn,
    motorSideDeductionIn: EXTRUSION_RULES.defaultMotorSideDeductionIn,
    idlerSideDeductionIn: EXTRUSION_RULES.defaultIdlerSideDeductionIn,
    endcapAllowanceIn: EXTRUSION_RULES.defaultEndcapAllowanceIn,
    sawKerfIn: EXTRUSION_RULES.defaultSawKerfIn,
    toleranceIn: EXTRUSION_RULES.defaultToleranceIn,
  };
}

export function calculateMotorSizing(input: MotorSizingInput): MotorSizingResult {
  const areaSqFt = (Math.max(1, input.finishedWidthIn) * Math.max(1, input.finishedDropIn)) / 144;
  const weightFactor = Math.max(0.1, input.fabricWeightOzSqYd / 12);
  const liftFactor =
    input.liftType === "dual" ? 1.35 : input.liftType === "blackout" ? 1.2 : 1;
  const tubeFactor = Math.max(0.75, 2 / Math.max(1.1, input.tubeDiameterIn));
  const dutyFactor = Math.max(1, Math.min(1.35, input.dutyCyclePercent / 100 + 0.35));

  const requiredTorqueNm = areaSqFt * weightFactor * 1.8 * liftFactor * tubeFactor * dutyFactor;
  const recommendedMotorFamily =
    requiredTorqueNm <= 6 ? "S35 (6 Nm)" : requiredTorqueNm <= 10 ? "S45 (10 Nm)" : requiredTorqueNm <= 20 ? "S45 (20 Nm)" : "S55 (30+ Nm)";
  const ratedTorque =
    recommendedMotorFamily.includes("30") ? 30 : recommendedMotorFamily.includes("20") ? 20 : recommendedMotorFamily.includes("10") ? 10 : 6;
  const safetyMarginPercent = ((ratedTorque - requiredTorqueNm) / requiredTorqueNm) * 100;
  const warning =
    safetyMarginPercent < 15
      ? "Low safety margin. Consider next motor size for reliability."
      : "Torque margin is within preferred operating range.";

  return {
    areaSqFt: round3(areaSqFt),
    requiredTorqueNm: round3(requiredTorqueNm),
    recommendedMotorFamily,
    safetyMarginPercent: round2(safetyMarginPercent),
    warning,
    formulaSummary:
      "RequiredTorque = AreaSqFt * FabricWeightFactor * LiftFactor * TubeFactor * DutyFactor",
  };
}

export function defaultMotorSizingInput(): MotorSizingInput {
  return {
    finishedWidthIn: 72,
    finishedDropIn: 84,
    fabricWeightOzSqYd: 14,
    tubeDiameterIn: 1.75,
    liftType: "standard",
    dutyCyclePercent: 60,
  };
}

export function calculateBomQuick(input: BomQuickInput): BomQuickResult {
  const quantity = Math.max(1, Math.floor(input.quantity));
  const panelCount = Math.max(1, Math.ceil(input.widthIn / Math.max(1, input.rollWidthIn)));
  const cutIn = input.dropIn + FABRIC_RULES.topAllowanceIn + FABRIC_RULES.defaultHemAllowanceIn;
  const fabricYards = (panelCount * cutIn * quantity) / 36;

  const motorCount = input.motorized ? quantity : 0;
  const controlCount = input.controlType === "none" ? 0 : quantity;

  return {
    fabricYards: round3(fabricYards),
    tubeCount: quantity,
    bracketSets: quantity,
    fastenerCount: quantity * 8,
    hemBarCount: quantity,
    motorCount,
    controlCount,
    formulaSummary:
      "FabricYards = PanelsPerUnit * CutLength * Quantity / 36, hardware counts are quantity-based multipliers",
  };
}

export function defaultBomQuickInput(): BomQuickInput {
  return {
    quantity: 10,
    widthIn: 72,
    dropIn: 84,
    rollWidthIn: 118,
    motorized: true,
    controlType: "remote",
  };
}

export function calculateProductionTime(input: ProductionTimeInput): ProductionTimeResult {
  const complexityFactor =
    input.complexity === "high" ? 1.35 : input.complexity === "medium" ? 1.15 : 1;
  const totalLaborMinutes =
    Math.max(0, input.setupMinutes) +
    Math.max(1, input.quantity) * Math.max(1, input.avgMinutesPerUnit) * complexityFactor;
  const stationCount = Math.max(1, input.stationCount);
  const minutesPerStation = totalLaborMinutes / stationCount;
  const lineHours = totalLaborMinutes / 60;
  const estimatedDaysAt8Hours = lineHours / 8;

  return {
    totalLaborMinutes: round2(totalLaborMinutes),
    minutesPerStation: round2(minutesPerStation),
    lineHours: round3(lineHours),
    estimatedDaysAt8Hours: round3(estimatedDaysAt8Hours),
    formulaSummary:
      "TotalLabor = Setup + Quantity * AvgMinutesPerUnit * ComplexityFactor, LineHours = TotalLabor / 60",
  };
}

export function defaultProductionTimeInput(): ProductionTimeInput {
  return {
    quantity: 25,
    complexity: "medium",
    stationCount: 6,
    setupMinutes: 40,
    avgMinutesPerUnit: 18,
  };
}

export function calculateBracketSelector(
  input: BracketSelectorInput
): BracketSelectorResult {
  const spanFactor = Math.max(0.8, input.finishedWidthIn / 84);
  const dropFactor = Math.max(0.8, input.finishedDropIn / 96);
  const weightFactor =
    input.weightClass === "heavy" ? 1.35 : input.weightClass === "medium" ? 1.15 : 1;
  const envFactor = input.outdoorExposure ? 1.15 : 1;
  const loadRatingLb = 20 * spanFactor * dropFactor * weightFactor * envFactor;

  const recommendedBracket =
    loadRatingLb > 38
      ? "Heavy-Duty Dual Mount Bracket"
      : loadRatingLb > 28
        ? "Reinforced Universal Bracket"
        : "Standard Universal Bracket";
  const anchorType =
    input.mountingSurface === "concrete"
      ? "Masonry Anchor"
      : input.mountingSurface === "metal"
        ? "Machine Screw + Rivnut"
        : input.mountingSurface === "wood"
          ? "Wood Lag Screw"
          : "Toggle Bolt";
  const minFastenersPerSide = loadRatingLb > 32 ? 3 : 2;
  const warnings =
    input.outdoorExposure && input.mountingSurface === "drywall"
      ? "Outdoor exposure on drywall requires reinforcement backing."
      : "Bracket and anchor pairing is within expected limits.";

  return {
    recommendedBracket,
    anchorType,
    minFastenersPerSide,
    loadRatingLb: round2(loadRatingLb),
    warnings,
    formulaSummary:
      "LoadRating = BaseLoad * SpanFactor * DropFactor * WeightFactor * EnvironmentFactor",
  };
}

export function defaultBracketSelectorInput(): BracketSelectorInput {
  return {
    mountingSurface: "drywall",
    finishedWidthIn: 72,
    finishedDropIn: 84,
    weightClass: "medium",
    outdoorExposure: false,
  };
}

export function calculateElectricalLoad(
  input: ElectricalLoadInput
): ElectricalLoadResult {
  const motorLoad = Math.max(0, input.motorCount) * Math.max(0, input.motorAmps);
  const totalConnectedAmps = motorLoad + Math.max(0, input.controlAmps);
  const diversity = Math.max(0.2, Math.min(1, input.diversityFactorPercent / 100));
  const diversifiedAmps = totalConnectedAmps * diversity;
  const zoneCount = Math.max(1, input.zoneCount);
  const ampsPerZone = diversifiedAmps / zoneCount;
  const breakerLimit = Math.max(1, input.breakerRatingAmps) * 0.8;
  const breakerUtilizationPercent = (ampsPerZone / breakerLimit) * 100;
  const overCapacity = breakerUtilizationPercent > 100;
  const recommendedCircuits = Math.max(1, Math.ceil(diversifiedAmps / breakerLimit));

  return {
    totalConnectedAmps: round3(totalConnectedAmps),
    diversifiedAmps: round3(diversifiedAmps),
    ampsPerZone: round3(ampsPerZone),
    breakerUtilizationPercent: round2(breakerUtilizationPercent),
    overCapacity,
    recommendedCircuits,
    formulaSummary:
      "DiversifiedAmps = ConnectedAmps * DiversityFactor, Utilization = AmpsPerZone / (BreakerRating * 0.8)",
  };
}

export function defaultElectricalLoadInput(): ElectricalLoadInput {
  return {
    motorCount: 24,
    motorAmps: 1.1,
    controlAmps: 3,
    zoneCount: 4,
    breakerRatingAmps: 20,
    diversityFactorPercent: 80,
  };
}

export function calculatePackagingFreight(
  input: PackagingFreightInput
): PackagingFreightResult {
  const quantity = Math.max(1, input.quantity);
  const padding = Math.max(0, input.paddingIn);
  const cartonLengthIn = input.widthIn + padding * 2;
  const cartonWidthIn = Math.max(3, input.depthIn + padding * 2);
  const cartonHeightIn = Math.max(3, input.dropIn / 8 + padding * 2);
  const packageWeightLb = quantity * Math.max(0.1, input.unitWeightLb) + (input.palletized ? 42 : 8);
  const dimensionalWeightLb = (cartonLengthIn * cartonWidthIn * cartonHeightIn) / 139;
  const billableWeight = Math.max(packageWeightLb, dimensionalWeightLb);
  const freightClass =
    billableWeight > 300 ? "Class 150" : billableWeight > 150 ? "Class 125" : "Class 100";

  return {
    cartonLengthIn: round2(cartonLengthIn),
    cartonWidthIn: round2(cartonWidthIn),
    cartonHeightIn: round2(cartonHeightIn),
    packageWeightLb: round2(packageWeightLb),
    totalShipmentWeightLb: round2(packageWeightLb),
    dimensionalWeightLb: round2(dimensionalWeightLb),
    freightClass,
    formulaSummary:
      "DimensionalWeight = (L * W * H) / 139, BillableWeight = max(ActualWeight, DimensionalWeight)",
  };
}

export function defaultPackagingFreightInput(): PackagingFreightInput {
  return {
    quantity: 6,
    widthIn: 84,
    dropIn: 96,
    depthIn: 4,
    unitWeightLb: 18,
    paddingIn: 1,
    palletized: true,
  };
}

export function calculateQcTolerance(input: QcToleranceInput): QcToleranceResult {
  const cutDeviationIn = Math.abs(input.actualCutIn - input.targetCutIn);
  const dropDeviationIn = Math.abs(input.actualDropIn - input.targetDropIn);
  const squareDeviationIn = Math.abs(input.actualSquareIn - input.targetSquareIn);
  const cutPass = cutDeviationIn <= Math.max(0, input.cutToleranceIn);
  const dropPass = dropDeviationIn <= Math.max(0, input.dropToleranceIn);
  const squarePass = squareDeviationIn <= Math.max(0, input.squareToleranceIn);
  const overallPass = cutPass && dropPass && squarePass;

  return {
    cutDeviationIn: round3(cutDeviationIn),
    dropDeviationIn: round3(dropDeviationIn),
    squareDeviationIn: round3(squareDeviationIn),
    cutPass,
    dropPass,
    squarePass,
    overallPass,
    formulaSummary:
      "Deviation = abs(Actual - Target), pass condition requires each deviation <= configured tolerance",
  };
}

export function defaultQcToleranceInput(): QcToleranceInput {
  return {
    targetCutIn: 72,
    actualCutIn: 71.97,
    targetDropIn: 84,
    actualDropIn: 84.05,
    targetSquareIn: 0,
    actualSquareIn: 0.03,
    cutToleranceIn: 0.0625,
    dropToleranceIn: 0.125,
    squareToleranceIn: 0.0625,
  };
}

export function calculateBatchOptimization(
  input: BatchOptimizationInput
): BatchOptimizationResult {
  const weightedFamilies =
    Math.max(1, input.fabricFamilies) +
    Math.max(1, input.tubeFamilies) * 0.75 +
    Math.max(1, input.motorFamilies) * 0.5;
  const recommendedBatchSize = Math.max(1, Math.round(input.ordersCount / weightedFamilies));
  const estimatedChangeovers = Math.max(0, Math.ceil(weightedFamilies) - 1);
  const changeoverMinutesTotal = estimatedChangeovers * Math.max(0, input.changeoverMinutes);
  const projectedLineHours =
    (Math.max(1, input.ordersCount) * Math.max(1, input.avgBuildMinutes) + changeoverMinutesTotal) /
    60;

  return {
    weightedFamilies: round2(weightedFamilies),
    recommendedBatchSize,
    estimatedChangeovers,
    changeoverMinutesTotal: round2(changeoverMinutesTotal),
    projectedLineHours: round3(projectedLineHours),
    formulaSummary:
      "BatchSize = Orders / WeightedFamilyComplexity, line time includes build minutes plus changeover overhead",
  };
}

export function defaultBatchOptimizationInput(): BatchOptimizationInput {
  return {
    ordersCount: 120,
    fabricFamilies: 6,
    tubeFamilies: 4,
    motorFamilies: 3,
    changeoverMinutes: 18,
    avgBuildMinutes: 16,
  };
}

export function calculateScrapYield(input: ScrapYieldInput): ScrapYieldResult {
  const produced = Math.max(1, input.producedUnits);
  const scrapRatePercent = (Math.max(0, input.scrapUnits) / produced) * 100;
  const yieldRatePercent = 100 - scrapRatePercent;
  const reworkRatePercent = (Math.max(0, input.reworkUnits) / produced) * 100;
  const fabricYieldPercent =
    input.fabricUsedYards > 0
      ? ((Math.max(0, input.fabricUsedYards - input.fabricScrapYards) / input.fabricUsedYards) *
          100)
      : 0;
  const qualityScore = Math.max(
    0,
    Math.min(100, yieldRatePercent - reworkRatePercent * 0.5 + fabricYieldPercent * 0.1)
  );

  return {
    scrapRatePercent: round2(scrapRatePercent),
    yieldRatePercent: round2(yieldRatePercent),
    reworkRatePercent: round2(reworkRatePercent),
    fabricYieldPercent: round2(fabricYieldPercent),
    qualityScore: round2(qualityScore),
    formulaSummary:
      "Yield and scrap rates are unit-based percentages; quality score blends yield, rework, and material yield.",
  };
}

export function defaultScrapYieldInput(): ScrapYieldInput {
  return {
    producedUnits: 400,
    scrapUnits: 18,
    reworkUnits: 24,
    fabricUsedYards: 1400,
    fabricScrapYards: 92,
  };
}

export function calculateCapacitySimulator(
  input: CapacitySimulatorInput
): CapacitySimulatorResult {
  const effectiveMinutesPerDay =
    Math.max(1, input.operators) *
    Math.max(1, input.shiftHours) *
    60 *
    Math.max(1, input.shiftsPerDay) *
    Math.max(0.2, Math.min(1, input.oeePercent / 100));
  const dailyCapacityOrders = effectiveMinutesPerDay / Math.max(1, input.avgMinutesPerOrder);
  const daysToClearBacklog = Math.max(0, input.backlogOrders) / Math.max(0.1, dailyCapacityOrders);
  const utilizationPercent =
    ((Math.max(0, input.backlogOrders) * Math.max(1, input.avgMinutesPerOrder)) /
      Math.max(1, effectiveMinutesPerDay * 5)) *
    100;
  const operatorsNeededRaw =
    (Math.max(0, input.backlogOrders) * Math.max(1, input.avgMinutesPerOrder)) /
    (Math.max(1, input.shiftHours) * 60 * Math.max(1, input.shiftsPerDay) * Math.max(0.2, input.oeePercent / 100) * 5);
  const additionalOperatorsNeeded = Math.max(
    0,
    Math.ceil(operatorsNeededRaw - Math.max(1, input.operators))
  );

  return {
    effectiveMinutesPerDay: round2(effectiveMinutesPerDay),
    dailyCapacityOrders: round2(dailyCapacityOrders),
    daysToClearBacklog: round2(daysToClearBacklog),
    utilizationPercent: round2(utilizationPercent),
    additionalOperatorsNeeded,
    formulaSummary:
      "DailyCapacity = EffectiveMinutesPerDay / AvgMinutesPerOrder, backlog clear days = Backlog / DailyCapacity",
  };
}

export function defaultCapacitySimulatorInput(): CapacitySimulatorInput {
  return {
    backlogOrders: 280,
    avgMinutesPerOrder: 16,
    operators: 8,
    shiftHours: 8,
    shiftsPerDay: 2,
    oeePercent: 78,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
