import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Waves, LayoutDashboard, Droplets, Zap, Settings,
  RefreshCw, AlertTriangle, Clock3, Gauge, Server, Wifi, Menu, X,
  SlidersHorizontal, CircleHelp, CheckCircle2, Languages, Type, Power,
  Volume2, Download, ChartNoAxesCombined, BatteryCharging, Play, Pause, ArrowLeft
} from "lucide-react";
import { GeneratorIllustration, PondIllustration, PowerWarningIllustration } from "./FarmerIllustrations";
import { makeSimulationPayload } from "./simulationPayload";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const demoPonds = [
  { pond_id: "P1", area_m2: 5000, average_depth_m: 1.2, initial_do_mg_l: 5.2, biomass_kg: 1200 },
  { pond_id: "P2", area_m2: 6500, average_depth_m: 1.3, initial_do_mg_l: 6.0, biomass_kg: 900 },
  { pond_id: "P3", area_m2: 4200, average_depth_m: 1.1, initial_do_mg_l: 4.8, biomass_kg: 1500 }
];

const pondPhotoAssets = [
  {
    src: "/assets/shrimp-pond.jpg",
    alt: ["Students collecting data beside an aquaculture pond in Honduras", "హోండురాస్‌లోని రొయ్యల చెరువు వద్ద సమాచారం సేకరిస్తున్న విద్యార్థులు"]
  },
  {
    src: "/assets/pond-indonesia.jpg",
    alt: ["Shrimp pond with a paddlewheel aerator on a farm in Indonesia", "ఇండోనేషియాలోని రొయ్యల చెరువులో తెడ్డు చక్ర ఏరేటర్"]
  },
  {
    src: "/assets/pond-portugal.jpg",
    alt: ["Earthen aquaculture ponds with an aerator at Marim, Portugal", "పోర్చుగల్‌లోని మారిమ్ వద్ద ఏరేటర్ ఉన్న మట్టి ఆక్వాకల్చర్ చెరువులు"]
  }
];

const translations = {
  en: {
    nav: ["Overview", "Ponds", "Power & backup", "Simulations", "Settings"],
    pages: [
      ["Farm overview", "See your ponds and plan for a power cut."],
      ["Pond management", "Update the pond details used in your scenario."],
      ["Power & backup", "Plan how to share generator power between ponds."],
      ["Simulations", "See what the model predicts for your ponds."],
      ["Settings", "Choose your language and oxygen alert level."]
    ],
    workspace: "YOUR FARM", assistant: "Farm helper", demo: "PLANNING EXAMPLE · NOT LIVE DATA",
    heroTitle: "Your ponds, at a glance", heroText: "Choose a pond below or run a scenario to see how oxygen may change during a power cut.",
    noResult: "No scenario run yet", healthy: "Good in this scenario", warning: "Please watch", emergency: "Urgent attention",
    pondInput: "Starting oxygen input", predicted: "Lowest oxygen predicted", noPrediction: "Not measured live",
    pondScenario: "Scenario", runToSee: "Run a scenario to see an estimate.", priority: "Review this pond first.",
    riskWatch: "Watch this pond in the scenario.", riskGood: "Lowest modeled risk in this scenario.",
    statusKey: ["Good", "Watch", "Urgent"], guideTitle: "If the power goes out", guideSub: "Simple steps to check. Use local expert advice for your farm.",
    steps: [
      ["Check the power", "Stay away from wet wires and electrical equipment."],
      ["Use backup power safely", "Only if trained. Keep the generator outdoors and dry."],
      ["Check pond oxygen", "Use a working meter. This app is not a live meter."],
      ["Ask for local help", "Call your aquaculture officer or a trusted expert."]
    ],
    outage: "Power cut length", hours: "hours", hour: "hour", oxygen: "Oxygen alert level", oxygenExplain: "Dissolved oxygen (DO) is oxygen in the water. mg/L means milligrams per litre.",
    pondInputs: "POND DETAILS", initialOxygen: "Starting oxygen", biomass: "Shrimp weight (kg)",
    tablePond: "POND", tableStarting: "STARTING OXYGEN", tableMinimum: "LOWEST PREDICTED OXYGEN", tableFinal: "FINAL PREDICTED OXYGEN", tableAlert: "TIME UNTIL ALERT", tableRisk: "SCENARIO STATUS", notCrossed: "Not reached",
    runSimulation: "Check my pond scenario", running: "Checking scenario…", riskSummary: "Scenario overview",
    modelOutput: "MODEL ESTIMATE", result: "Predicted pond results", noResults: "No results yet", resultHelp: "Run the scenario to get estimates from the AquaResQ service.",
    modelDisclaimer: "This is an illustrative estimate, not live pond data or advice for operating a real farm.",
    pondDetails: "Pond details", edits: "Changes apply to your next scenario. These are planning inputs, not live readings.",
    pondId: "Pond name", area: "Pond size (m²)", depth: "Water depth (m)", aeratorLoad: "Aerator power (kW)", aerationOutput: "Aerator oxygen output (mg/L/h)",
    usePond: "Check this pond scenario", outagePlan: "Power cut plan", outageExplain: "Set how long power may be off. The optimizer uses the pond and generator details below.",
    generatorCapacity: "Generator power", availableEnergy: "Fuel energy available", optional: "Optional", oxygenTarget: "Oxygen level to protect",
    generatorSetup: "Set aerator details", generatorHelp: "Add each pond’s aerator power and oxygen output in Pond details before running this plan.",
    optimize: "Plan generator power", optimizing: "Making a plan…", connection: "Service connection", service: "AquaResQ service",
    checkConnection: "Check connection", preferences: "Language and alerts", thresholdHelp: "This alert level is sent with each scenario.",
    apiConnection: "Service connection", localApi: "AquaResQ uses a local service for estimates. It does not read live pond sensors.",
    emergencyNote: "This is a planning example, not a live warning. For a real emergency, check the pond and contact a local expert.",
    useSimple: "Large text", english: "English", telugu: "తెలుగు",
    api: "Service", waiting: "Waiting for a scenario", received: "Scenario received",
    powerOff: "Power off", aerator: "Aerator", generator: "Backup generator",
    voice: "Listen to guidance", stopVoice: "Stop voice guidance", voiceUnavailable: "Voice guidance is not available in this browser.",
    comparison: "Compare 6, 12 and 18 hours", comparing: "Comparing scenarios…", comparisonHeading: "How long could power be off?",
    comparisonIntro: "Each duration is a separate estimate from the AquaResQ service using the current pond details.",
    chart: "Oxygen over time", noUncertainty: "The service does not provide an uncertainty range; only its returned estimate is shown.",
    alert: "Alert", timeline: "When ponds may need attention", timelineIntro: "Times below are model estimates from the selected outage scenario, not live alerts.",
    noAlertCrossing: "Alert level not reached in this scenario", attentionAt: "Alert level reached",
    recommendations: "Why review this pond?", prioritized: "Review first", reasonCritical: "The returned minimum is at or below the critical level (3 mg/L).",
    reasonHigh: "The returned minimum is below your alert level.", reasonModerate: "The returned minimum is less than 1 mg/L above your alert level.",
    reasonLow: "The returned minimum is at least 1 mg/L above your alert level.",
    timeReason: "First reaches the alert level at", minReason: "Lowest returned oxygen estimate",
    report: "Download scenario report", reportUnavailable: "Run a scenario before downloading a report.",
    capacity: "Generator capacity", allocated: "Power assigned", spare: "Remaining capacity", distribution: "Generator power plan",
    energy: "Estimated energy", feasible: "Plans checked", urgent: "Urgent", watch: "Watch",
    generatorOff: "No power assigned by this plan", generatorOn: "Power assigned in this plan", comparisonError: "Could not compare scenarios",
    invalidThreshold: "Enter an oxygen alert level greater than 0 mg/L before running a scenario or plan.",
    runFirst: "Run a scenario to see its oxygen graph and attention timeline.",
    limitTime: "hours", scenario: "Scenario", modelEstimate: "Estimate from the model", pond: "Pond",
    alertInstructions: "Check pond water with a working meter and contact a local aquaculture expert.",
    detailHint: "Pond overview and returned scenario estimate", openPond: "Open pond details", backToPonds: "Close pond details",
    shrimp: "Whiteleg shrimp · illustrative photo",
    aeratorStatus: "Aerator plan", noGeneratorPlan: "No generator plan yet", startingInput: "Starting oxygen input",
    visualiseOutage: "Run outage simulation", noSimulation: "Choose an outage duration, then run the simulation to see returned oxygen estimates.",
    simulationSuccess: "Scenario estimate received from AquaResQ service.", optimizerSuccess: "Generator allocation received from AquaResQ service.",
    playEstimate: "Play estimate", pauseEstimate: "Pause estimate", progressLabel: "Modelled scenario progress",
    requiredCapacity: "Power for all pond aerators", availableCapacity: "Generator capacity available", assignedCapacity: "Power assigned",
    notConnected: "Not assigned in this generator plan", poweredByPlan: "Assigned by generator plan",
    timelinePlayback: "Outage timeline", estimatedAt: "Estimated alert time", playbackDisclaimer: "Animated model playback · not a live clock or sensor reading.",
    strategyComparison: "Compare allocation strategies",
    strategyComparisonHelp: "All three strategies use the same pond inputs, outage duration, oxygen model and protection threshold. These are simulated estimates, not measurements.",
    strategyNoGenerator: "No generator allocation", strategyBaseline: "Highest initial risk first", strategyOptimized: "AquaResQ optimized",
    integratedDeficit: "Integrated oxygen deficit", strategyPower: "Generator power", strategyEnergy: "Energy used",
    strategyNoAeration: "No aeration", strategyAeration: "Aeration assigned",
    strategyMinDo: "Minimum predicted DO", strategyWhy: "Why this allocation?",
    strategyTrajectory: "View predicted trajectory", strategyDisclaimer: "Simulated estimate · not live sensor data",
    strategySharedInputs: "Same inputs: {hours}h outage · {threshold} mg/L protection threshold",
    strategyEnergyAssumption: "Energy estimate assumes assigned loads run continuously for the full outage (kW × hours).",
    strategyReasonNoGenerator: "Reference scenario only; no power is assigned.",
    strategyReasonBaseline: "Selected first because starting DO is {value} mg/L (highest initial risk) and the package fits capacity and fuel limits.",
    strategyReasonCapacity: "Not selected: ranked by initial risk, but its package exceeds generator capacity.",
    strategyReasonEnergy: "Not selected: ranked by initial risk, but its package exceeds available fuel energy.",
    strategyReasonNotConfigured: "Not eligible: no positive aerator power load is configured.",
    strategyReasonOptimized: "Selected by the lowest total time-integrated oxygen deficit; worst-pond oxygen and oxygen exposure break ties.",
    strategyReasonNotOptimized: "Not selected in the globally best feasible allocation under the shared deficit objective.",
    paretoEfficient: "Non-dominated among these strategies",
    paretoDominated: "Dominated by another shown strategy",
    strategyTradeoffs: "Metric-by-metric comparison",
    strategyTradeoffHelp: "Pareto comparison of these three displayed strategies; lower deficit, pond-hours, crossings and energy are preferred, while higher worst-pond minimum DO is preferred.",
    strategyPairTradeoff: "{first} vs {second}",
    strategyBetter: "better",
    strategyWorse: "worse",
    strategyEqual: "equal",
    metricDeficit: "Integrated deficit",
    metricPondHours: "Pond-hours below threshold",
    metricWorstMinimum: "Worst pond minimum DO",
    metricCrossings: "Ponds crossing threshold",
    metricEnergy: "Energy used",
    recommendationPolicy: "Recommendation rule",
    noArbitraryWeights: "No weighted score is used. AquaResQ minimizes integrated deficit first; ties use worst-pond minimum DO, total DO exposure, then lower generator power. Other metrics are shown as trade-offs, not hidden.",
    belowThresholdTime: "Pond-hours at/below threshold",
    strategyStartingDo: "Starting DO",
    strategyFinalDo: "Final predicted DO",
    strategyCrossed: "Protection threshold crossed",
    yesAt: "Yes · first at",
    noCrossing: "No",
    deficitDifference: "Deficit difference vs no generator",
    capacityCheck: "Capacity respected",
    fuelCheck: "Fuel limit respected",
    constraintLimits: "Limits",
    notConfigured: "No fuel limit configured",
    yes: "Yes",
    sameDeficitOutcome: "The optimized allocation has the same modeled integrated oxygen deficit as the no-generator reference. No deficit reduction is claimed.",
    reducedDeficitOutcome: "The optimized allocation has a lower modeled integrated oxygen deficit than the no-generator reference for these supplied inputs.",
    notReducedDeficitOutcome: "The optimized allocation did not reduce modeled integrated oxygen deficit compared with the no-generator reference.",
    tiedPrimaryOutcome: "{count} feasible allocations share the same integrated-deficit score. Tie-breakers: worst-pond minimum DO, total DO exposure, then lower generator load.",
    tiedFullOutcome: "{count} allocations also tie on all objective values; the first in deterministic input enumeration is returned.",
    demoScenarioTitle: "Judge demo scenarios",
    demoScenarioHelp: "Choose a fixed, reproducible example. All ponds, outage, generator, fuel and aerator inputs load together.",
    chooseDemoScenario: "Choose a simulated scenario",
    demoNormal: "Normal operating conditions",
    demoModerate: "Moderate power outage",
    demoCritical: "Critical multi-pond emergency",
    demoRunning: "Loading scenario…",
    demoScenarioError: "Could not load the demo scenario",
    dataSourceTitle: "What these values mean",
    simulatedSource: "Simulated estimates: predicted oxygen and strategy results. Risk labels use the no-generator reference.",
    planningSource: "Demo scenarios load fixed planning presets. Edit pond and generator fields to enter your own; these are not measurements.",
    sensorsSource: "Actual sensor readings: not supported. No live measurements are shown.",
    decisionTitle: "Explainable decision",
    decisionFirstAttention: "Pond to review first",
    decisionReference: "Risk label uses the no-generator reference estimate.",
    decisionSelectedAllocation: "Why this generator allocation?",
    decisionConstraints: "Why other allocations were excluded",
    decisionTradeoffs: "Strategy trade-offs",
    decisionConstraintsSummary: "{feasible} of {total} whole-pond allocations were feasible. {capacity} exceeded generator capacity; {fuel} exceeded available fuel after capacity checks.",
    decisionTradeoffEqual: "{first} and {second}: equal on reported objectives.",
    decisionTradeoffFirst: "{first} dominates {second} on the reported objectives.",
    decisionTradeoffSecond: "{second} dominates {first} on the reported objectives.",
    decisionTradeoffConflict: "{first} and {second}: trade-offs across reported objectives.",
    estimatedInputs: "Simulated estimate",
    editableInputs: "Planning inputs (preset or user-entered)",
    sensorsUnavailable: "No sensor readings",
    loadedScenarioConfig: "Loaded inputs: {ponds} ponds · {hours}h outage · {capacity} kW generator · {energy} kWh fuel · {threshold} mg/L.",
    constraintCountingNote: "Capacity rejections are counted first; fuel rejections are counted only among subsets that fit the generator.",
  },
  te: {
    nav: ["ముఖచిత్రం", "చెరువులు", "విద్యుత్ & బ్యాకప్", "అంచనాలు", "సెట్టింగ్‌లు"],
    pages: [
      ["మీ చేపల చెరువులు", "చెరువులను చూడండి. విద్యుత్ పోతే ముందుగా సిద్ధం అవ్వండి."],
      ["చెరువు వివరాలు", "అంచనా కోసం చెరువు వివరాలను మార్చండి."],
      ["విద్యుత్ & జనరేటర్", "జనరేటర్ విద్యుత్‌ను చెరువులకు ఎలా పంచాలో చూడండి."],
      ["చెరువు అంచనా", "మీ చెరువుల గురించి నమూనా అంచనాను చూడండి."],
      ["సెట్టింగ్‌లు", "భాష, ఆక్సిజన్ హెచ్చరిక స్థాయిని ఎంచుకోండి."]
    ],
    workspace: "మీ చేపల ఫారం", assistant: "మీకు తోడుగా", demo: "ఉదాహరణ మాత్రమే · ప్రత్యక్ష సమాచారం కాదు",
    heroTitle: "మీ చెరువుల పరిస్థితి", heroText: "చెరువును ఎంచుకోండి లేదా విద్యుత్ పోయినప్పుడు ఆక్సిజన్ ఎలా మారవచ్చో అంచనా వేయండి.",
    noResult: "ఇంకా అంచనా లేదు", healthy: "ఈ అంచనాలో బాగుంది", warning: "గమనించండి", emergency: "వెంటనే చూసుకోండి",
    pondInput: "ప్రారంభ ఆక్సిజన్ విలువ", predicted: "అంచనా వేసిన కనిష్ఠ ఆక్సిజన్", noPrediction: "ప్రత్యక్ష కొలత కాదు",
    pondScenario: "అంచనా", runToSee: "అంచనా చూడటానికి బటన్ నొక్కండి.", priority: "ఈ చెరువును ముందుగా చూడండి.",
    riskWatch: "ఈ అంచనాలో చెరువును గమనించండి.", riskGood: "ఈ అంచనాలో తక్కువ ప్రమాదం.",
    statusKey: ["బాగుంది", "గమనించండి", "అత్యవసరం"], guideTitle: "విద్యుత్ పోతే", guideSub: "ఇవి సాధారణ సూచనలు. మీ ప్రాంత నిపుణుడి సలహాను పాటించండి.",
    steps: [
      ["విద్యుత్ చూడండి", "తడి తీగలు, విద్యుత్ పరికరాలకు దూరంగా ఉండండి."],
      ["బ్యాకప్ జాగ్రత్తగా వాడండి", "శిక్షణ ఉంటేనే వాడండి. జనరేటర్‌ను బయట, పొడిగా ఉంచండి."],
      ["నీటి ఆక్సిజన్ చూడండి", "పని చేసే మీటర్ వాడండి. ఈ యాప్ ప్రత్యక్ష మీటర్ కాదు."],
      ["స్థానిక సహాయం పొందండి", "చేపల పెంపక అధికారి లేదా నమ్మకమైన నిపుణుడికి ఫోన్ చేయండి."]
    ],
    outage: "విద్యుత్ లేని సమయం", hours: "గంటలు", hour: "గంట", oxygen: "ఆక్సిజన్ హెచ్చరిక స్థాయి", oxygenExplain: "నీటిలోని కరిగిన ఆక్సిజన్ (DO). mg/L అంటే లీటరుకు మిల్లీగ్రాములు.",
    pondInputs: "చెరువు వివరాలు", initialOxygen: "ప్రారంభ ఆక్సిజన్", biomass: "రొయ్యల బరువు (kg)",
    tablePond: "చెరువు", tableStarting: "ప్రారంభ ఆక్సిజన్", tableMinimum: "కనిష్ఠ అంచనా ఆక్సిజన్", tableFinal: "చివరి అంచనా ఆక్సిజన్", tableAlert: "హెచ్చరిక సమయం", tableRisk: "అంచనా స్థితి", notCrossed: "చేరలేదు",
    runSimulation: "నా చెరువు అంచనా చూడండి", running: "అంచనా వేస్తోంది…", riskSummary: "అంచనా సారాంశం",
    modelOutput: "నమూనా అంచనా", result: "చెరువు అంచనా ఫలితాలు", noResults: "ఫలితాలు లేవు", resultHelp: "అంచనా కోసం AquaResQ సేవను ఉపయోగించండి.",
    modelDisclaimer: "ఇది ఉదాహరణ అంచనా మాత్రమే. ప్రత్యక్ష చెరువు సమాచారం లేదా నిజమైన ఫారానికి సలహా కాదు.",
    pondDetails: "చెరువు వివరాలు", edits: "మార్పులు తదుపరి అంచనాకు వర్తిస్తాయి. ఇవి అంచనా విలువలు, ప్రత్యక్ష కొలతలు కావు.",
    pondId: "చెరువు పేరు", area: "చెరువు వైశాల్యం (m²)", depth: "నీటి లోతు (m)", aeratorLoad: "ఏరేటర్ విద్యుత్ (kW)", aerationOutput: "ఏరేటర్ ఆక్సిజన్ (mg/L/h)",
    usePond: "ఈ చెరువు అంచనా చూడండి", outagePlan: "విద్యుత్ పోయే ప్రణాళిక", outageExplain: "విద్యుత్ ఎన్ని గంటలు పోవచ్చో చెప్పండి. ఈ వివరాలతో జనరేటర్ ప్రణాళిక తయారవుతుంది.",
    generatorCapacity: "జనరేటర్ విద్యుత్", availableEnergy: "అందుబాటులో ఇంధన శక్తి", optional: "ఐచ్ఛికం", oxygenTarget: "కాపాడాల్సిన ఆక్సిజన్ స్థాయి",
    generatorSetup: "ఏరేటర్ వివరాలు ఇవ్వండి", generatorHelp: "ప్రణాళికకు ముందు చెరువు వివరాల్లో ఏరేటర్ విద్యుత్, ఆక్సిజన్ వివరాలు ఇవ్వండి.",
    optimize: "జనరేటర్ ప్రణాళిక చూడండి", optimizing: "ప్రణాళిక తయారవుతోంది…", connection: "సేవ అనుసంధానం", service: "AquaResQ సేవ",
    checkConnection: "అనుసంధానం చూడండి", preferences: "భాష, హెచ్చరికలు", thresholdHelp: "ఈ స్థాయి ప్రతి అంచనాకు పంపబడుతుంది.",
    apiConnection: "సేవ అనుసంధానం", localApi: "AquaResQ అంచనాల కోసం స్థానిక సేవను వాడుతుంది. ఇది ప్రత్యక్ష సెన్సార్ సమాచారాన్ని చదవదు.",
    emergencyNote: "ఇది ప్రణాళిక అంచనా మాత్రమే, ప్రత్యక్ష హెచ్చరిక కాదు. నిజమైన అత్యవసరంలో చెరువును చూసి స్థానిక నిపుణుడిని సంప్రదించండి.",
    useSimple: "పెద్ద అక్షరాలు", english: "English", telugu: "తెలుగు",
    api: "సేవ", waiting: "అంచనా కోసం వేచి ఉంది", received: "అంచనా వచ్చింది",
    powerOff: "విద్యుత్ లేదు", aerator: "ఏరేటర్", generator: "బ్యాకప్ జనరేటర్",
    voice: "సూచనలు వినండి", stopVoice: "వాయిస్ ఆపండి", voiceUnavailable: "ఈ బ్రౌజర్‌లో వాయిస్ సౌకర్యం లేదు.",
    comparison: "6, 12, 18 గంటల అంచనాలు", comparing: "అంచనాలను పోలుస్తోంది…", comparisonHeading: "విద్యుత్ ఎంతసేపు పోవచ్చు?",
    comparisonIntro: "ప్రతి సమయానికి AquaResQ సేవ ప్రస్తుత చెరువు వివరాలతో విడిగా అంచనా వేస్తుంది.",
    chart: "కాలంతో ఆక్సిజన్ మార్పు", noUncertainty: "సేవ పరిధి సమాచారాన్ని ఇవ్వదు; తిరిగి ఇచ్చిన అంచనా మాత్రమే చూపబడింది.",
    alert: "హెచ్చరిక", timeline: "చెరువును చూసే సమయం", timelineIntro: "క్రింది సమయాలు నమూనా అంచనాలు మాత్రమే, ప్రత్యక్ష హెచ్చరికలు కావు.",
    noAlertCrossing: "ఈ అంచనాలో హెచ్చరిక స్థాయికి చేరలేదు", attentionAt: "హెచ్చరిక స్థాయికి చేరే సమయం",
    recommendations: "ఈ చెరువును ఎందుకు చూడాలి?", prioritized: "ముందుగా చూడండి", reasonCritical: "తిరిగి వచ్చిన కనిష్ఠ విలువ అత్యవసర స్థాయి (3 mg/L) లేదా అంతకంటే తక్కువ.",
    reasonHigh: "తిరిగి వచ్చిన కనిష్ఠ విలువ మీ హెచ్చరిక స్థాయి కంటే తక్కువ.",
    reasonModerate: "తిరిగి వచ్చిన కనిష్ఠ విలువ హెచ్చరిక స్థాయికి 1 mg/L లోపు ఎక్కువ.",
    reasonLow: "తిరిగి వచ్చిన కనిష్ఠ విలువ హెచ్చరిక స్థాయికి కనీసం 1 mg/L ఎక్కువ.",
    timeReason: "హెచ్చరిక స్థాయికి చేరే సమయం", minReason: "తిరిగి వచ్చిన కనిష్ఠ ఆక్సిజన్ అంచనా",
    report: "అంచనా నివేదికను డౌన్‌లోడ్ చేయండి", reportUnavailable: "నివేదికకు ముందుగా అంచనా వేయండి.",
    capacity: "జనరేటర్ సామర్థ్యం", allocated: "కేటాయించిన విద్యుత్", spare: "మిగిలిన సామర్థ్యం", distribution: "జనరేటర్ విద్యుత్ ప్రణాళిక",
    energy: "అంచనా శక్తి", feasible: "పరిశీలించిన ప్రణాళికలు", urgent: "అత్యవసరం", watch: "గమనించండి",
    generatorOff: "ఈ ప్రణాళికలో విద్యుత్ కేటాయించలేదు", generatorOn: "ఈ ప్రణాళికలో విద్యుత్ కేటాయించారు", comparisonError: "అంచనాలను పోల్చలేకపోయాము",
    invalidThreshold: "అంచనా లేదా ప్రణాళికకు ముందు 0 mg/L కంటే ఎక్కువ ఆక్సిజన్ హెచ్చరిక స్థాయిని నమోదు చేయండి.",
    runFirst: "ఆక్సిజన్ గ్రాఫ్, సమయ క్రమం కోసం అంచనా వేయండి.",
    limitTime: "గంటలు", scenario: "అంచనా", modelEstimate: "నమూనా అంచనా", pond: "చెరువు",
    alertInstructions: "పని చేసే మీటర్‌తో చెరువు నీటిని చూడండి, స్థానిక చేపల పెంపక నిపుణుడిని సంప్రదించండి.",
    detailHint: "చెరువు వివరాలు, వచ్చిన నమూనా అంచనా", openPond: "చెరువు వివరాలు తెరవండి", backToPonds: "వివరాలు మూసివేయండి",
    shrimp: "వైట్‌లెగ్ రొయ్య · ఉదాహరణ చిత్రం",
    aeratorStatus: "ఏరేటర్ ప్రణాళిక", noGeneratorPlan: "జనరేటర్ ప్రణాళిక లేదు", startingInput: "ప్రారంభ ఆక్సిజన్ విలువ",
    visualiseOutage: "విద్యుత్ అంతరాయం అంచనా వేయండి", noSimulation: "సమయాన్ని ఎంచుకుని అంచనా వేయండి. వచ్చిన ఆక్సిజన్ విలువలు కనిపిస్తాయి.",
    simulationSuccess: "AquaResQ సేవ నుంచి అంచనా వచ్చింది.", optimizerSuccess: "AquaResQ సేవ నుంచి జనరేటర్ కేటాయింపు వచ్చింది.",
    playEstimate: "అంచనా నడపండి", pauseEstimate: "అంచనా ఆపండి", progressLabel: "నమూనా అంచనా పురోగతి",
    requiredCapacity: "అన్ని చెరువుల ఏరేటర్లకు కావలసిన విద్యుత్", availableCapacity: "జనరేటర్ సామర్థ్యం", assignedCapacity: "కేటాయించిన విద్యుత్",
    notConnected: "ఈ జనరేటర్ ప్రణాళికలో కేటాయించలేదు", poweredByPlan: "జనరేటర్ ప్రణాళికలో కేటాయించారు",
    timelinePlayback: "విద్యుత్ అంతరాయం సమయరేఖ", estimatedAt: "అంచనా హెచ్చరిక సమయం", playbackDisclaimer: "నమూనా అంచనా ప్రదర్శన మాత్రమే · ప్రత్యక్ష సమయం లేదా సెన్సార్ కొలత కాదు.",
    strategyComparison: "విద్యుత్ కేటాయింపు విధానాల పోలిక",
    strategyComparisonHelp: "మూడు విధానాలకూ ఒకే చెరువు వివరాలు, అంతరాయ సమయం, ఆక్సిజన్ నమూనా, రక్షణ స్థాయి వాడతాం. ఇవి నమూనా అంచనాలు మాత్రమే, కొలతలు కావు.",
    strategyNoGenerator: "జనరేటర్ కేటాయింపు లేదు", strategyBaseline: "ఎక్కువ ప్రమాదం ఉన్న చెరువు ముందు", strategyOptimized: "AquaResQ మెరుగైన ప్రణాళిక",
    integratedDeficit: "మొత్తం ఆక్సిజన్ లోటు", strategyPower: "జనరేటర్ విద్యుత్", strategyEnergy: "వాడిన శక్తి",
    strategyNoAeration: "ఏరేటర్ విద్యుత్ లేదు", strategyAeration: "ఏరేటర్‌కు విద్యుత్ ఇచ్చారు",
    strategyMinDo: "కనిష్ఠ అంచనా DO", strategyWhy: "ఈ కేటాయింపు ఎందుకు?",
    strategyTrajectory: "ఆక్సిజన్ అంచనా చూడండి", strategyDisclaimer: "నమూనా అంచనా · ప్రత్యక్ష సెన్సార్ సమాచారం కాదు",
    strategySharedInputs: "ఒకే వివరాలు: {hours} గంటల అంతరాయం · {threshold} mg/L రక్షణ స్థాయి",
    strategyEnergyAssumption: "కేటాయించిన విద్యుత్ మొత్తం అంతరాయ సమయం నడుస్తుందని భావించి శక్తిని లెక్కించాం (kW × గంటలు).",
    strategyReasonNoGenerator: "పోలిక కోసం మాత్రమే; విద్యుత్ కేటాయించలేదు.",
    strategyReasonBaseline: "ప్రారంభ DO {value} mg/L ఉండటంతో (ఎక్కువ ప్రమాదం) ముందుగా ఎంచుకున్నారు; విద్యుత్, ఇంధన పరిమితుల్లో ప్యాకేజీ సరిపోయింది.",
    strategyReasonCapacity: "ప్రమాద క్రమంలో ఉన్నా, ఏరేటర్ విద్యుత్ జనరేటర్ సామర్థ్యాన్ని మించుతుంది.",
    strategyReasonEnergy: "ప్రమాద క్రమంలో ఉన్నా, ఏరేటర్‌కు అందుబాటులో ఉన్న ఇంధన శక్తి సరిపోదు.",
    strategyReasonNotConfigured: "ఏరేటర్ విద్యుత్ వివరాలు ఇవ్వలేదు.",
    strategyReasonOptimized: "మొత్తం సమగ్ర ఆక్సిజన్ లోటు ఆధారంగా ఎంచుకున్నారు; సమాన ఫలితాల్లో కనిష్ఠ చెరువు DO, మొత్తం DO ఆధారంగా నిర్ణయించారు.",
    strategyReasonNotOptimized: "సాధ్యమైన అన్ని కేటాయింపుల్లో ఉత్తమమైన లోటు లక్ష్య ప్రణాళికలో ఈ చెరువు ఎంపిక కాలేదు.",
    paretoEfficient: "ఈ మూడు విధానాల్లో ఆధిపత్యం లేనిది",
    paretoDominated: "చూపిన మరో విధానం దీనికంటే మెరుగైనది",
    strategyTradeoffs: "ప్రతి కొలమానంలో పోలిక",
    strategyTradeoffHelp: "ఈ మూడు విధానాల Pareto పోలిక: తక్కువ లోటు, చెరువు-గంటలు, హెచ్చరికలు, శక్తి మంచివి; అధిక కనిష్ఠ DO మంచిది.",
    strategyPairTradeoff: "{first} vs {second}",
    strategyBetter: "మెరుగ్గా",
    strategyWorse: "తక్కువగా",
    strategyEqual: "సమానం",
    metricDeficit: "సమగ్ర ఆక్సిజన్ లోటు",
    metricPondHours: "పరిమితి కింద చెరువు-గంటలు",
    metricWorstMinimum: "అత్యల్ప చెరువు DO",
    metricCrossings: "పరిమితి చేరిన చెరువులు",
    metricEnergy: "వాడిన శక్తి",
    recommendationPolicy: "ప్రణాళిక ఎంపిక విధానం",
    noArbitraryWeights: "బరువుల కలిపిన స్కోరు వాడలేదు. ముందుగా సమగ్ర ఆక్సిజన్ లోటు తగ్గిస్తాం; సమానమైతే అత్యల్ప చెరువు DO, మొత్తం DO, తరువాత తక్కువ జనరేటర్ విద్యుత్ చూస్తాం. ఇతర కొలమానాల తేడాలను దాచకుండా చూపిస్తాం.",
    belowThresholdTime: "పరిమితి వద్ద/కింద చెరువు-గంటలు",
    strategyStartingDo: "ప్రారంభ DO",
    strategyFinalDo: "చివరి అంచనా DO",
    strategyCrossed: "రక్షణ స్థాయిని దాటిందా",
    sameDeficitOutcome: "జనరేటర్ లేని స్థితితో పోలిస్తే మెరుగైన ప్రణాళికలో సమగ్ర ఆక్సిజన్ లోటు ఒకటే. లోటు తగ్గిందని చెప్పడం లేదు.",
    reducedDeficitOutcome: "ఇచ్చిన వివరాల ప్రకారం మెరుగైన ప్రణాళికలో జనరేటర్ లేని స్థితికంటే నమూనా సమగ్ర ఆక్సిజన్ లోటు తక్కువ.",
    notReducedDeficitOutcome: "జనరేటర్ లేని స్థితితో పోలిస్తే మెరుగైన ప్రణాళిక సమగ్ర ఆక్సిజన్ లోటును తగ్గించలేదు.",
    tiedPrimaryOutcome: "{count} సాధ్యమైన కేటాయింపుల్లో సమగ్ర ఆక్సిజన్ లోటు ఒకటే. సమానమైతే కనిష్ఠ చెరువు DO, మొత్తం DO, తరువాత తక్కువ విద్యుత్ ఆధారంగా నిర్ణయం.",
    tiedFullOutcome: "{count} కేటాయింపుల లక్ష్య విలువలన్నీ సమానం; ఇన్‌పుట్ క్రమంలో ముందున్నదాన్ని చూపుతున్నాం.",
    yesAt: "అవును · మొదటి సమయం",
    noCrossing: "లేదు",
    deficitDifference: "జనరేటర్ లేని స్థితితో లోటు తేడా",
    capacityCheck: "జనరేటర్ సామర్థ్యంలో ఉంది",
    fuelCheck: "ఇంధన పరిమితిలో ఉంది",
    constraintLimits: "పరిమితులు",
    notConfigured: "ఇంధన పరిమితి ఇవ్వలేదు",
    yes: "అవును",
    demoScenarioTitle: "ప్రదర్శన అంచనాలు",
    demoScenarioHelp: "స్థిరమైన ఉదాహరణను ఎంచుకోండి. చెరువులు, విద్యుత్ అంతరాయం, జనరేటర్, ఇంధనం, ఏరేటర్ వివరాలు కలిసి వస్తాయి.",
    chooseDemoScenario: "నమూనా అంచనాను ఎంచుకోండి",
    demoNormal: "సాధారణ పరిస్థితులు",
    demoModerate: "మధ్యస్థ విద్యుత్ అంతరాయం",
    demoCritical: "అనేక చెరువులకు అత్యవసర పరిస్థితి",
    demoRunning: "అంచనా లోడ్ అవుతోంది…",
    demoScenarioError: "ప్రదర్శన అంచనాను లోడ్ చేయలేకపోయాము",
    dataSourceTitle: "ఈ విలువల అర్థం",
    simulatedSource: "నమూనా ఆక్సిజన్, ప్రణాళిక ఫలితాలు. ప్రమాద స్థాయి జనరేటర్ లేని అంచనాపై ఆధారితం.",
    planningSource: "ప్రదర్శనలో స్థిర ప్రణాళిక విలువలు వస్తాయి. మీ వివరాలు నమోదు చేయడానికి చెరువు, జనరేటర్ విలువలను మార్చండి; ఇవి కొలతలు కావు.",
    sensorsSource: "ప్రత్యక్ష సెన్సార్ కొలతలు: లేవు. యాప్ ప్రత్యక్ష కొలతలు చూపదు.",
    decisionTitle: "ఎంపికకు కారణం",
    decisionFirstAttention: "ముందుగా చూడాల్సిన చెరువు",
    decisionReference: "ప్రమాద స్థాయి జనరేటర్ లేని నమూనా అంచనాపై ఆధారితం.",
    decisionSelectedAllocation: "ఈ జనరేటర్ కేటాయింపు ఎందుకు?",
    decisionConstraints: "ఇతర కేటాయింపులు ఎందుకు సాధ్యం కాలేదు",
    decisionTradeoffs: "ప్రణాళికల మధ్య తేడాలు",
    decisionConstraintsSummary: "{total} కేటాయింపుల్లో {feasible} సాధ్యమయ్యాయి. {capacity} జనరేటర్ సామర్థ్యాన్ని; {fuel} సామర్థ్య పరీక్ష తర్వాత ఇంధన పరిమితిని మించాయి.",
    decisionTradeoffEqual: "{first}, {second}: చూపిన లక్ష్యాల్లో సమానం.",
    decisionTradeoffFirst: "{first}, {second} కంటే చూపిన లక్ష్యాల్లో మెరుగైనది.",
    decisionTradeoffSecond: "{second}, {first} కంటే చూపిన లక్ష్యాల్లో మెరుగైనది.",
    decisionTradeoffConflict: "{first}, {second}: వేర్వేరు లక్ష్యాల్లో తేడా ఉంది.",
    estimatedInputs: "నమూనా అంచనా",
    editableInputs: "ప్రణాళిక వివరాలు (ఉదాహరణ లేదా మీరు నమోదు చేసినవి)",
    sensorsUnavailable: "సెన్సార్ కొలతలు లేవు",
    loadedScenarioConfig: "లోడ్ చేసిన వివరాలు: {ponds} చెరువులు · {hours} గంటల అంతరాయం · {capacity} kW జనరేటర్ · {energy} kWh ఇంధనం · {threshold} mg/L.",
    constraintCountingNote: "మొదట జనరేటర్ సామర్థ్యాన్ని మించినవి; మిగిలిన వాటిలో ఇంధన పరిమితిని మించినవి లెక్కించాం.",
  }
};

function OxygenGauge({ value, status, label }) {
  const progress = Math.max(0, Math.min(100, value / 10 * 100));
  return <div className="oxygen-gauge-wrap" title={`${label}: ${value.toFixed(1)} mg/L`} role="img" aria-label={`${label}: ${value.toFixed(1)} mg/L`}>
    <div className={`oxygen-gauge ${status}`} style={{ "--gauge-progress": `${progress}%` }}>
      <div className="oxygen-gauge-value"><strong>{value.toFixed(1)}</strong><span>mg/L</span></div>
    </div>
    <span className="oxygen-gauge-label">{label}</span>
  </div>;
}

function OxygenChart({ pond, labels }) {
  const trajectory = pond?.trajectory;
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    setPlaybackIndex(0);
    setPlaying(true);
  }, [pond?.pond_id, trajectory]);
  useEffect(() => {
    if (!playing || !trajectory?.length) return undefined;
    const step = Math.max(1, Math.ceil(trajectory.length / 75));
    const timer = window.setInterval(() => {
      setPlaybackIndex(current => {
        const next = Math.min(current + step, trajectory.length - 1);
        if (next === trajectory.length - 1) setPlaying(false);
        return next;
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing, trajectory]);
  if (!trajectory || trajectory.length < 2) return null;
  const width = 620;
  const height = 220;
  const plot = { left: 48, right: 594, top: 18, bottom: 178 };
  const maxHours = trajectory[trajectory.length - 1].time_hours || 1;
  const threshold = pond.alert_threshold_mg_l;
  const values = trajectory.map(point => point.do_mg_l);
  const maxDo = Math.max(10, ...values, threshold);
  const y = value => plot.bottom - value / maxDo * (plot.bottom - plot.top);
  const x = value => plot.left + value / maxHours * (plot.right - plot.left);
  const points = trajectory.map(point => `${x(point.time_hours)},${y(point.do_mg_l)}`).join(" ");
  const xTicks = [0, maxHours / 3, 2 * maxHours / 3, maxHours];
  const yTicks = [0, maxDo / 2, maxDo];
  const playbackPoint = trajectory[playbackIndex];
  const progress = playbackIndex / (trajectory.length - 1) * 100;
  return <div className="oxygen-chart" aria-label={`${labels.chart}: ${pond.pond_id}`}>
    <div className="chart-heading">
      <div><strong>{labels.chart}</strong><span>{pond.pond_id} · {labels.modelEstimate}</span></div>
      <button className="chart-play-button" type="button" onClick={() => {
        if (playbackIndex === trajectory.length - 1 && !playing) setPlaybackIndex(0);
        setPlaying(value => !value);
      }} aria-label={playing ? labels.pauseEstimate : labels.playEstimate} title={playing ? labels.pauseEstimate : labels.playEstimate}>
        {playing ? <Pause size={15}/> : <Play size={15}/>}
      </button>
      <span className="chart-legend"><i/> {labels.oxygen}</span>
    </div>
    <div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {yTicks.map(tick => <g key={tick}><line x1={plot.left} x2={plot.right} y1={y(tick)} y2={y(tick)} className="chart-gridline"/><text x={plot.left - 9} y={y(tick) + 4} textAnchor="end" className="chart-axis-text">{tick.toFixed(0)}</text></g>)}
      <line x1={plot.left} x2={plot.right} y1={y(threshold)} y2={y(threshold)} className="chart-threshold"/>
      <text x={plot.right - 2} y={y(threshold) - 5} textAnchor="end" className="chart-threshold-label">{labels.alert} {threshold}</text>
      <polyline points={points} fill="none" className="chart-line"/>
      {trajectory.map((point, index) => index % Math.max(1, Math.floor(trajectory.length / 20)) === 0 || index === trajectory.length - 1
        ? <circle key={point.time_hours} cx={x(point.time_hours)} cy={y(point.do_mg_l)} r="2" className="chart-point"/> : null)}
      <line x1={x(playbackPoint.time_hours)} x2={x(playbackPoint.time_hours)} y1={plot.top} y2={plot.bottom} className="chart-playhead"/>
      <circle cx={x(playbackPoint.time_hours)} cy={y(playbackPoint.do_mg_l)} r="5" className="chart-current-point"/>
      {xTicks.map(tick => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={plot.bottom} y2={plot.bottom + 4} className="chart-axis-tick"/><text x={x(tick)} y={plot.bottom + 19} textAnchor="middle" className="chart-axis-text">{tick.toFixed(0)}h</text></g>)}
      <text transform={`translate(14 ${(plot.top + plot.bottom) / 2}) rotate(-90)`} textAnchor="middle" className="chart-axis-title">mg/L</text>
    </svg></div>
    <div className="chart-playback" role="group" aria-label={labels.progressLabel}>
      <div className="chart-playback-track"><span style={{ width: `${progress}%` }}/></div>
      <span>{playbackPoint.time_hours.toFixed(1)} h · {playbackPoint.do_mg_l.toFixed(2)} mg/L</span>
    </div>
    <p className="chart-note">{labels.noUncertainty}</p>
  </div>;
}

function ScenarioTimeline({ report, labels }) {
  const hours = report?.scenario?.outage_hours;
  if (!hours || !report.ponds?.length) return null;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return <section className="scenario-timeline" aria-label={labels.timelinePlayback}>
    <div className="scenario-timeline-heading">
      <strong>{labels.timelinePlayback}</strong>
      <span>{hours} {labels.hours} · {labels.modelEstimate}</span>
    </div>
    <div className="scenario-timeline-track">
      {ticks.map(tick => <span className="scenario-tick" key={tick} style={{ left: `${tick * 100}%` }}>
        <i/><small>{(hours * tick).toFixed(tick === 0 || tick === 1 ? 0 : 1)}h</small>
      </span>)}
      {report.ponds.filter(pond => pond.time_to_alert_hours != null).map(pond => <span
        className={`scenario-alert-marker ${pond.risk === "CRITICAL" ? "emergency" : "warning"}`}
        key={pond.pond_id}
        style={{ left: `${Math.min(100, pond.time_to_alert_hours / hours * 100)}%` }}
        title={`${pond.pond_id}: ${labels.estimatedAt} ${pond.time_to_alert_hours}h`}
      ><i/><small>{pond.pond_id}</small></span>)}
      <span className="scenario-playhead" aria-hidden="true"/>
    </div>
    <p>{labels.playbackDisclaimer}</p>
  </section>;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function Metric({ label, value, detail, icon: Icon, tone = "mint" }) {
  return <div className="metric-card">
    <div className={`metric-icon ${tone}`}><Icon size={19} /></div>
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
    <div className="metric-detail">{detail}</div>
  </div>;
}

function FarmPhoto({ src, alt, caption, className = "", fallback }) {
  return <figure className={`farm-photo ${className}`}>
    <img src={src} alt={alt} loading="lazy" decoding="async" onError={event => {
      event.currentTarget.hidden = true;
      event.currentTarget.parentElement?.classList.add("photo-failed");
    }}/>
    <div className="farm-photo-fallback">{fallback}</div>
    <figcaption>{caption}</figcaption>
  </figure>;
}

function PowerFlowDiagram({ optimization, language }) {
  const isTelugu = language === "te";
  return <section className="power-flow" aria-label={isTelugu ? "జనరేటర్ విద్యుత్ కేటాయింపు ప్రణాళిక" : "Generator power allocation plan"}>
    <div className="power-flow-source">
      <span className="power-flow-icon"><Zap size={17}/></span>
      <span>{isTelugu ? "జనరేటర్ ప్రణాళిక" : "Generator plan"}</span>
      <strong>{optimization.allocated_power_kw} kW</strong>
    </div>
    <div className="power-flow-branches">
      {optimization.allocation.map(item => <div className={`power-flow-pond ${item.aerator_allocated ? "powered" : ""}`} key={item.pond_id}>
        {item.aerator_allocated ? <Zap size={15}/> : <Droplets size={15}/>}
        <strong>{item.pond_id}</strong>
        <span>{item.aerator_allocated
          ? `${isTelugu ? "ఏరేటర్" : "Aerator"} · ${item.aerator_load_kw} kW`
          : (isTelugu ? "విద్యుత్ కేటాయించలేదు" : "No power assigned")}</span>
      </div>)}
    </div>
  </section>;
}

function allocationExplanation(optimization, ponds, language) {
  const isTelugu = language === "te";
  const selected = optimization.allocation.filter(item => item.aerator_allocated).length;
  const configured = ponds.filter(pond => Number(pond.aerator_load_kw) > 0).length;
  const messages = {
    allocated: isTelugu
      ? `${configured} ఏరేటర్లలో ${selected}కి నమూనా లక్ష్యం ఆధారంగా విద్యుత్ కేటాయించారు. లోటు తగ్గిందా అనే వివరానికి విధానాల పోలిక చూడండి.${selected < configured ? " మిగిలిన వాటికి విద్యుత్/ఇంధన పరిమితి లేదా నమూనా ఫలితం కారణం." : ""}`
      : `Power was assigned to ${selected} of ${configured} configured aerators under the modeled objective. See the strategy comparison to check whether the deficit decreased.${selected < configured ? " Remaining packages were constrained by model results, generator capacity, or fuel energy." : ""}`,
    no_packages: isTelugu
      ? "చెరువు వివరాల్లో ఏరేటర్ విద్యుత్ ఇవ్వలేదు; ముందుగా kW వివరాలు నమోదు చేయండి."
      : "No aerator power loads are configured. Enter each aerator's kW in pond details.",
    capacity_limit: isTelugu
      ? "చిన్న ఏరేటర్ ప్యాకేజీకి కూడా జనరేటర్ సామర్థ్యం సరిపోదు."
      : "Generator capacity is below the load required by the smallest aerator package.",
    energy_limit: isTelugu
      ? "ఈ విద్యుత్ అంతరాయానికి అందుబాటులో ఉన్న ఇంధన శక్తి ఒక ఏరేటర్ ప్యాకేజీకి సరిపోదు."
      : "Available fuel energy is insufficient to run even one aerator package for this outage.",
    no_modeled_benefit: isTelugu
      ? "ఇచ్చిన ఏరేటర్ ఆక్సిజన్ వివరాలతో నమూనాలో మెరుగుదల లేదు; వివరాలు తనిఖీ చేయండి."
      : "The configured aerator outputs do not improve modeled oxygen; check the pond aeration inputs."
  };
  return messages[optimization.allocation_status] ?? optimization.allocation_explanation;
}

function StrategyComparison({ strategies, optimization, labels }) {
  const strategyLabels = {
    no_generator: labels.strategyNoGenerator,
    highest_initial_risk: labels.strategyBaseline,
    aquaresq_optimized: labels.strategyOptimized
  };
  const reasonForPond = pond => {
    const reasons = {
      no_generator_reference: labels.strategyReasonNoGenerator,
      baseline_selected: labels.strategyReasonBaseline.replace("{value}", pond.initial_do_mg_l),
      capacity_exceeded: labels.strategyReasonCapacity,
      energy_exceeded: labels.strategyReasonEnergy,
      not_configured: labels.strategyReasonNotConfigured,
      optimized_selected: labels.strategyReasonOptimized,
      optimized_not_selected: labels.strategyReasonNotOptimized
    };
    return reasons[pond.allocation_reason_code] ?? pond.allocation_reason;
  };
  const outcomeLabel = optimization.objective_outcome === "deficit_reduced"
    ? labels.reducedDeficitOutcome
    : optimization.objective_outcome === "deficit_not_reduced"
      ? labels.notReducedDeficitOutcome
      : labels.sameDeficitOutcome;
  const sharedInputs = labels.strategySharedInputs
    .replace("{hours}", optimization.outage_hours)
    .replace("{threshold}", optimization.protection_threshold_mg_l);
  const noGeneratorDeficit = strategies.find(
    strategy => strategy.strategy === "no_generator"
  )?.aggregate_oxygen_deficit_score ?? 0;
  const strategyLabelsById = Object.fromEntries(
    strategies.map(strategy => [strategy.strategy, strategyLabels[strategy.strategy]])
  );
  const metricDefinitions = [
    ["integrated_oxygen_deficit", labels.metricDeficit, "mg/L·h", "minimize"],
    ["pond_hours_below_threshold", labels.metricPondHours, "h", "minimize"],
    ["worst_pond_minimum_do", labels.metricWorstMinimum, "mg/L", "maximize"],
    ["ponds_crossing_threshold", labels.metricCrossings, "", "minimize"],
    ["energy_consumed", labels.metricEnergy, "kWh", "minimize"]
  ];
  const metricValue = (strategy, key) => {
    if (key === "integrated_oxygen_deficit") return strategy.aggregate_oxygen_deficit_score;
    if (key === "pond_hours_below_threshold") return strategy.total_time_at_or_below_threshold_hours;
    if (key === "worst_pond_minimum_do") return strategy.worst_minimum_do_mg_l;
    if (key === "ponds_crossing_threshold") return strategy.ponds_crossing_threshold_count;
    return strategy.energy_used_kwh;
  };
  const compareValues = (firstValue, secondValue, direction) => {
    if (Math.abs(firstValue - secondValue) <= 1e-8) return labels.strategyEqual;
    const firstBetter = direction === "minimize"
      ? firstValue < secondValue
      : firstValue > secondValue;
    return firstBetter ? labels.strategyBetter : labels.strategyWorse;
  };
  return <section className="strategy-comparison" aria-labelledby="strategy-comparison-title">
    <div className="strategy-comparison-heading">
      <div>
        <h3 id="strategy-comparison-title">{labels.strategyComparison}</h3>
        <p>{labels.strategyComparisonHelp}</p>
        <p className="strategy-shared-inputs">{sharedInputs}</p>
        <p className="strategy-energy-assumption">{labels.strategyEnergyAssumption}</p>
        <p className="strategy-objective-outcome" role="status">{outcomeLabel}</p>
        <p className="strategy-recommendation-policy"><strong>{labels.recommendationPolicy}:</strong> {labels.noArbitraryWeights}</p>
        {optimization.equal_primary_objective_allocations > 1 && <p className="strategy-objective-tie">
          {labels.tiedPrimaryOutcome.replace("{count}", optimization.equal_primary_objective_allocations)}
        </p>}
        {optimization.equal_full_objective_allocations > 1 && <p className="strategy-objective-tie">
          {labels.tiedFullOutcome.replace("{count}", optimization.equal_full_objective_allocations)}
        </p>}
      </div>
      <span>{labels.strategyDisclaimer}</span>
    </div>
    <div className="strategy-comparison-grid">
      {strategies.map(strategy => <article className={`strategy-card ${strategy.strategy}`} key={strategy.strategy}>
        <h4>{strategyLabels[strategy.strategy] ?? strategy.strategy}</h4>
        <p className={`strategy-pareto-status ${strategy.pareto_efficient ? "efficient" : "dominated"}`}>
          {strategy.pareto_efficient ? labels.paretoEfficient : labels.paretoDominated}
        </p>
        <p className="strategy-constraint-checks">
          {labels.capacityCheck}: {strategy.capacity_respected ? labels.yes : labels.noCrossing}
          {" · "}
          {labels.fuelCheck}: {strategy.fuel_energy_respected == null
            ? labels.notConfigured
            : strategy.fuel_energy_respected ? labels.yes : labels.noCrossing}
        </p>
        <p className="strategy-constraint-limits">
          {labels.constraintLimits}: {strategy.generator_capacity_kw} kW
          {strategy.available_energy_kwh == null
            ? ""
            : ` · ${strategy.available_energy_kwh} kWh`}
        </p>
        <div className="strategy-metrics">
          <div><span>{labels.strategyPower}</span><strong>{strategy.generator_power_kw} kW</strong></div>
          <div><span>{labels.strategyEnergy}</span><strong>{strategy.energy_used_kwh} kWh</strong></div>
          <div><span>{labels.integratedDeficit}</span><strong>{strategy.aggregate_oxygen_deficit_score.toFixed(3)} mg/L·h</strong></div>
          <div><span>{labels.deficitDifference}</span><strong>{(strategy.aggregate_oxygen_deficit_score - noGeneratorDeficit).toFixed(3)} mg/L·h</strong></div>
          <div><span>{labels.belowThresholdTime}</span><strong>{strategy.total_time_at_or_below_threshold_hours.toFixed(2)} h</strong></div>
          <div><span>{labels.metricWorstMinimum}</span><strong>{strategy.worst_minimum_do_mg_l.toFixed(2)} mg/L</strong></div>
          <div><span>{labels.metricCrossings}</span><strong>{strategy.ponds_crossing_threshold_count}</strong></div>
        </div>
        <ul className="strategy-pond-list">
          {strategy.ponds.map(pond => <li key={pond.pond_id}>
            <div className="strategy-pond-summary">
              <strong>{pond.pond_id}</strong>
              <span className={pond.aerator_allocated ? "powered" : ""}>
                {pond.aerator_allocated
                  ? `${labels.strategyAeration} · ${pond.aerator_load_kw} kW`
                  : labels.strategyNoAeration}
              </span>
            </div>
            <div className="strategy-pond-values">
              <span>{labels.strategyStartingDo}: <b>{pond.initial_do_mg_l.toFixed(2)} mg/L</b></span>
              <span>{labels.strategyMinDo}: <b>{pond.minimum_do_mg_l.toFixed(2)} mg/L</b></span>
              <span>{labels.strategyFinalDo}: <b>{pond.final_do_mg_l.toFixed(2)} mg/L</b></span>
              <span>{labels.integratedDeficit}: <b>{pond.oxygen_deficit_score.toFixed(3)} mg/L·h</b></span>
              <span>{labels.belowThresholdTime}: <b>{pond.time_at_or_below_threshold_hours.toFixed(2)} h</b></span>
              <span>{labels.strategyCrossed}: <b>{pond.time_to_target_hours == null
                ? labels.noCrossing
                : `${labels.yesAt} ${pond.time_to_target_hours.toFixed(2)} h`}</b></span>
            </div>
            <p>{labels.strategyWhy}: {reasonForPond(pond)}</p>
            <details>
              <summary>{labels.strategyTrajectory}</summary>
              <OxygenChart pond={pond} labels={labels}/>
            </details>
          </li>)}
        </ul>
      </article>)}
    </div>
    <section className="strategy-pareto" aria-label={labels.strategyTradeoffs}>
      <h4>{labels.strategyTradeoffs}</h4>
      <p>{labels.strategyTradeoffHelp}</p>
      {optimization.strategy_analysis.pairwise_comparisons.map(pair => {
        const first = strategyLabelsById[pair.first_strategy];
        const second = strategyLabelsById[pair.second_strategy];
        return <article className="strategy-pareto-pair" key={`${pair.first_strategy}-${pair.second_strategy}`}>
          <strong>{labels.strategyPairTradeoff.replace("{first}", first).replace("{second}", second)}</strong>
          <div>{metricDefinitions.map(([key, label, unit, direction]) => {
            const firstValue = pair.first_objectives[key];
            const secondValue = pair.second_objectives[key];
            return <span key={key}>
              {label}: {first} {firstValue}{unit ? ` ${unit}` : ""}
              {" · "}
              {compareValues(firstValue, secondValue, direction)} {second}
              {" ("}{secondValue}{unit ? ` ${unit}` : ""}{")"}
            </span>;
          })}</div>
        </article>;
      })}
      <small>{optimization.strategy_analysis.scope}</small>
    </section>
  </section>;
}

function DemoScenarioSelector({
  selectedScenario, onChange, loading, error, labels, ponds, outageHours,
  generatorCapacity, availableEnergy, threshold
}) {
  return <section className="panel demo-scenario-panel" aria-labelledby="demo-scenario-title">
    <div className="demo-scenario-controls">
      <div>
        <div className="panel-kicker">{labels.demoScenarioTitle}</div>
        <p>{labels.demoScenarioHelp}</p>
      </div>
      <label>
        <span>{labels.chooseDemoScenario}</span>
        <select value={selectedScenario} onChange={event => onChange(event.target.value)} disabled={loading}>
          <option value="" disabled>{labels.chooseDemoScenario}</option>
          <option value="normal">{labels.demoNormal}</option>
          <option value="moderate">{labels.demoModerate}</option>
          <option value="critical">{labels.demoCritical}</option>
        </select>
      </label>
    </div>
    {loading && <p className="demo-scenario-loading" role="status"><RefreshCw size={14} className="spin"/>{labels.demoRunning}</p>}
    {error && <div className="error-message" role="alert"><AlertTriangle size={15}/>{error}</div>}
    <div className="data-source-grid">
      <div><strong>{labels.estimatedInputs}</strong><span>{labels.simulatedSource}</span></div>
      <div><strong>{labels.editableInputs}</strong><span>{labels.planningSource}</span></div>
      <div><strong>{labels.sensorsUnavailable}</strong><span>{labels.sensorsSource}</span></div>
    </div>
    {selectedScenario && !loading && <p className="loaded-scenario-config">{labels.loadedScenarioConfig
      .replace("{ponds}", ponds.length)
      .replace("{hours}", outageHours)
      .replace("{capacity}", generatorCapacity)
      .replace("{energy}", availableEnergy)
      .replace("{threshold}", threshold)}</p>}
  </section>;
}

function ExplainableDecision({ report, optimization, ponds, labels, language }) {
  if (!report || !optimization) return null;
  const firstPond = report.ponds.find(
    pond => pond.pond_id === report.summary.highest_priority_pond
  );
  const constraints = optimization.constraint_summary;
  const names = {
    no_generator: labels.strategyNoGenerator,
    highest_initial_risk: labels.strategyBaseline,
    aquaresq_optimized: labels.strategyOptimized
  };
  const relationLabel = pair => {
    const first = names[pair.first_strategy];
    const second = names[pair.second_strategy];
    if (pair.relation === "equal") {
      return labels.decisionTradeoffEqual.replace("{first}", first).replace("{second}", second);
    }
    if (pair.relation === "first_dominates") {
      return labels.decisionTradeoffFirst.replace("{first}", first).replace("{second}", second);
    }
    if (pair.relation === "second_dominates") {
      return labels.decisionTradeoffSecond.replace("{first}", first).replace("{second}", second);
    }
    return labels.decisionTradeoffConflict.replace("{first}", first).replace("{second}", second);
  };
  const constraintText = labels.decisionConstraintsSummary
    .replace("{feasible}", constraints.feasible_allocations_evaluated)
    .replace("{total}", constraints.total_allocations_considered)
    .replace("{capacity}", constraints.generator_capacity_rejections)
    .replace("{fuel}", constraints.fuel_energy_rejections);
  const riskLabel = language === "te"
    ? ({ CRITICAL: "అత్యవసరం", HIGH: "అధికం", MODERATE: "గమనించండి", LOW: "బాగుంది" }[firstPond?.risk])
    : firstPond?.risk;
  return <section className="panel explainable-decision" aria-labelledby="explainable-decision-title">
    <div className="panel-heading">
      <div><div className="panel-kicker">{labels.modelOutput}</div><h2 id="explainable-decision-title">{labels.decisionTitle}</h2></div>
      <span className="panel-icon"><CircleHelp size={18}/></span>
    </div>
    {firstPond && <div className="decision-first-pond">
      <strong>{labels.decisionFirstAttention}: {firstPond.pond_id}</strong>
      <span>{riskLabel} · {firstPond.minimum_do_mg_l.toFixed(2)} mg/L</span>
      <small>{labels.decisionReference}</small>
    </div>}
    <div className="decision-reasons">
      <article><strong>{labels.decisionSelectedAllocation}</strong><p>{allocationExplanation(optimization, ponds, language)}</p><small>{labels.noArbitraryWeights}</small></article>
      <article><strong>{labels.decisionConstraints}</strong><p>{constraintText}</p><small>{labels.constraintCountingNote}</small></article>
    </div>
    <div className="decision-tradeoffs">
      <strong>{labels.decisionTradeoffs}</strong>
      {optimization.strategy_analysis.pairwise_comparisons.map(pair =>
        <p key={`${pair.first_strategy}-${pair.second_strategy}`}>{relationLabel(pair)}</p>
      )}
    </div>
  </section>;
}

function App() {
  const [ponds, setPonds] = useState(demoPonds);
  const [outageHours, setOutageHours] = useState(6);
  const [alertThreshold, setAlertThreshold] = useState("4.0");
  const [generatorCapacity, setGeneratorCapacity] = useState(0);
  const [availableEnergy, setAvailableEnergy] = useState("");
  const [activePage, setActivePage] = useState("overview");
  const [selectedPondId, setSelectedPondId] = useState("");
  const [pendingOutageSimulation, setPendingOutageSimulation] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [simpleLanguage, setSimpleLanguage] = useState(false);
  const [report, setReport] = useState(null);
  const [selectedChartPond, setSelectedChartPond] = useState("");
  const [optimization, setOptimization] = useState(null);
  const [comparisonReports, setComparisonReports] = useState([]);
  const [comparisonError, setComparisonError] = useState("");
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [error, setError] = useState("");
  const [optimizationError, setOptimizationError] = useState("");
  const [apiStatus, setApiStatus] = useState("Not checked");
  const [selectedDemoScenario, setSelectedDemoScenario] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState("");
  const demoRequestRef = useRef(0);
  const thresholdValue = alertThreshold.trim() === "" ? NaN : Number(alertThreshold);
  const thresholdValid = Number.isFinite(thresholdValue) && thresholdValue > 0;
  const displayedThreshold = thresholdValid ? thresholdValue.toFixed(1) : "—";

  const invalidateDemoScenario = () => {
    demoRequestRef.current += 1;
    setSelectedDemoScenario("");
    setDemoError("");
    setDemoLoading(false);
    setPendingOutageSimulation(false);
    setLoading(false);
    setOptimizing(false);
    setComparing(false);
  };

  const loadDemoScenario = async scenarioId => {
    if (!scenarioId) return;
    const requestId = demoRequestRef.current + 1;
    demoRequestRef.current = requestId;
    setSelectedDemoScenario(scenarioId);
    setDemoLoading(true);
    setDemoError("");
    setReport(null);
    setOptimization(null);
    setLoading(false);
    setOptimizing(false);
    setComparing(false);
    setError("");
    setOptimizationError("");
    setComparisonReports([]);
    try {
      const response = await fetch(`${API_BASE}/demo-scenarios/${scenarioId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`API returned ${response.status}: ${detail}`);
      }
      const result = await response.json();
      if (requestId !== demoRequestRef.current) return;
      setPonds(result.inputs.ponds);
      setOutageHours(result.inputs.outage_hours);
      setAlertThreshold(String(result.inputs.protection_threshold_mg_l));
      setGeneratorCapacity(result.inputs.generator_capacity_kw);
      setAvailableEnergy(String(result.inputs.available_energy_kwh));
      setReport(result.simulation);
      setOptimization(result.optimization);
      setSelectedDemoScenario(scenarioId);
      setApiStatus("Connected");
    } catch (err) {
      if (requestId !== demoRequestRef.current) return;
      setDemoError(`${t.demoScenarioError}: ${err.message}`);
      setSelectedDemoScenario("");
      setApiStatus("Connection issue");
    } finally {
      if (requestId === demoRequestRef.current) setDemoLoading(false);
    }
  };

  const riskCounts = report?.summary?.risk_counts;
  const criticalPonds = report?.ponds?.filter(pond => pond.risk === "CRITICAL") ?? [];
  const watchPonds = report?.ponds?.filter(pond => pond.risk === "HIGH" || pond.risk === "MODERATE") ?? [];
  const totalPonds = report?.summary?.pond_count ?? ponds.length;
  const highestPriority = report?.summary?.highest_priority_pond ?? "—";

  const runSimulation = async () => {
    setPendingOutageSimulation(false);
    if (!thresholdValid) {
      setError(t.invalidThreshold);
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    const requestId = demoRequestRef.current;
    try {
      const response = await fetch(`${API_BASE}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeSimulationPayload(ponds, outageHours, alertThreshold))
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`API returned ${response.status}: ${detail}`);
      }
      const data = await response.json();
      if (requestId !== demoRequestRef.current) return;
      setReport(data);
      setApiStatus("Connected");
    } catch (err) {
      if (requestId !== demoRequestRef.current) return;
      setError(err.message.includes("Failed to fetch")
        ? `Cannot reach the backend at ${API_BASE}. Check the configured API URL and keep the FastAPI server running.`
        : err.message);
      setApiStatus("Connection issue");
    } finally {
      if (requestId === demoRequestRef.current) setLoading(false);
    }
  };

  const compareScenarios = async () => {
    if (!thresholdValid) {
      setComparisonError(t.invalidThreshold);
      return;
    }
    setComparing(true);
    setComparisonError("");
    const requestId = demoRequestRef.current;
    try {
      const results = await Promise.all([6, 12, 18].map(async hours => {
        const response = await fetch(`${API_BASE}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(makeSimulationPayload(ponds, hours, alertThreshold))
        });
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`API returned ${response.status} for ${hours}h scenario: ${detail}`);
        }
        return { hours, report: await response.json() };
      }));
      if (requestId !== demoRequestRef.current) return;
      setComparisonReports(results);
      setApiStatus("Connected");
    } catch (err) {
      if (requestId !== demoRequestRef.current) return;
      setComparisonError(err.message.includes("Failed to fetch")
        ? `Cannot reach the backend at ${API_BASE}. Check the configured API URL and keep the FastAPI server running.`
        : err.message);
      setApiStatus("Connection issue");
    } finally {
      if (requestId === demoRequestRef.current) setComparing(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const rows = [
      ["AquaResQ scenario report"],
      ["Outage duration (hours)", report.scenario?.outage_hours ?? outageHours],
      ["Alert threshold (mg/L)", report.scenario?.alert_threshold_mg_l ?? thresholdValue],
      ["Critical threshold (mg/L)", report.scenario?.critical_threshold_mg_l ?? 3],
      ["Model disclaimer", report.disclaimer ?? t.modelDisclaimer],
      [],
      ["Pond", "Initial oxygen (mg/L)", "Minimum predicted oxygen (mg/L)", "Final predicted oxygen (mg/L)", "Time to alert (hours)", "Risk", "Aeration supplied"],
      ...report.ponds.map(pond => [
        pond.pond_id, pond.initial_do_mg_l, pond.minimum_do_mg_l, pond.final_do_mg_l,
        pond.time_to_alert_hours ?? "Not reached", pond.risk, pond.aeration_supplied
      ])
    ];
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aquaresq-scenario-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const speakGuidance = () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setVoiceMessage(t.voiceUnavailable);
      return;
    }
    if (voicePlaying) {
      window.speechSynthesis.cancel();
      setVoicePlaying(false);
      setVoiceMessage("");
      return;
    }
    window.speechSynthesis.cancel();
    const overview = report?.ponds?.length
      ? report.ponds.slice(0, 3).map(pond => {
        const label = pond.risk === "CRITICAL" ? t.emergency : pond.risk === "LOW" ? t.healthy : t.warning;
        return `${pond.pond_id}. ${label}. ${t.minReason}: ${pond.minimum_do_mg_l.toFixed(1)} mg/L.`;
      }).join(" ")
      : t.noResult;
    const utterance = new SpeechSynthesisUtterance(`${t.heroTitle}. ${t.guideTitle}. ${t.steps.map(([title, detail], index) => `${index + 1}. ${title}. ${detail}`).join(" ")} ${overview} ${t.emergencyNote}`);
    utterance.lang = language === "te" ? "te-IN" : "en-IN";
    utterance.onerror = event => {
      setVoicePlaying(false);
      setVoiceMessage(event.error === "canceled" || event.error === "interrupted" ? "" : t.voiceUnavailable);
    };
    utterance.onend = () => { setVoicePlaying(false); setVoiceMessage(""); };
    setVoiceMessage(t.voice);
    setVoicePlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const runOptimization = async () => {
    if (!thresholdValid) {
      setOptimizationError(t.invalidThreshold);
      return;
    }
    setOptimizing(true);
    setOptimizationError("");
    setOptimization(null);
    const requestId = demoRequestRef.current;
    try {
      const requestBody = {
        ponds: ponds.map(pond => ({
          ...pond,
          aeration_addition_mg_l_h: Number(pond.aeration_addition_mg_l_h ?? 0),
          aerator_load_kw: Number(pond.aerator_load_kw ?? 0)
        })),
        generator_capacity_kw: Number(generatorCapacity),
        outage_hours: Number(outageHours),
        target_do_mg_l: thresholdValue,
        time_step_minutes: 5
      };
      if (availableEnergy !== "") requestBody.available_energy_kwh = Number(availableEnergy);
      const response = await fetch(`${API_BASE}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`API returned ${response.status}: ${detail}`);
      }
      const result = await response.json();
      if (requestId !== demoRequestRef.current) return;
      setOptimization(result);
      setApiStatus("Connected");
    } catch (err) {
      if (requestId !== demoRequestRef.current) return;
      setOptimizationError(err.message.includes("Failed to fetch")
        ? `Cannot reach the backend at ${API_BASE}. Check the configured API URL and keep the FastAPI server running.`
        : err.message);
      setApiStatus("Connection issue");
    } finally {
      if (requestId === demoRequestRef.current) setOptimizing(false);
    }
  };

  const checkApi = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (!response.ok) throw new Error("API health check failed");
      setApiStatus("Connected");
    } catch {
      setApiStatus("Offline");
    }
  };

  const summary = useMemo(() => {
    if (!riskCounts) return { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
    return riskCounts;
  }, [riskCounts]);

  const updatePond = (index, field, value) => {
    invalidateDemoScenario();
    setReport(null);
    setOptimization(null);
    setPonds(current => current.map((pond, i) =>
      i === index ? { ...pond, [field]: field === "pond_id" ? value : Number(value) } : pond
    ));
  };

  const updateOutageHours = value => {
    invalidateDemoScenario();
    setOutageHours(Number(value));
    setReport(null);
    setOptimization(null);
    setError("");
    setOptimizationError("");
  };

  const updatePowerOutageHours = value => {
    updateOutageHours(value);
    setPendingOutageSimulation(true);
  };

  const updateAlertThreshold = value => {
    invalidateDemoScenario();
    setAlertThreshold(value);
    setReport(null);
    setOptimization(null);
    setError("");
    setOptimizationError("");
    setComparisonError("");
  };

  useEffect(() => {
    if (!pendingOutageSimulation || activePage !== "power") return undefined;
    const timer = window.setTimeout(() => {
      setPendingOutageSimulation(false);
      void runSimulation();
    }, 450);
    return () => window.clearTimeout(timer);
  }, [pendingOutageSimulation, activePage, outageHours]);

  const t = translations[language];
  const apiStatusText = language === "te"
    ? ({ Connected: "కనెక్ట్ అయింది", Offline: "ఆఫ్‌లైన్", "Connection issue": "అనుసంధాన సమస్య", "Not checked": "చూడలేదు" }[apiStatus])
    : apiStatus;
  const pageIndex = { overview: 0, ponds: 1, power: 2, simulations: 3, settings: 4 }[activePage];

  const navigation = [
    ["overview", LayoutDashboard, t.nav[0]],
    ["ponds", Droplets, t.nav[1]],
    ["power", Zap, t.nav[2]],
    ["simulations", Activity, t.nav[3]],
    ["settings", Settings, t.nav[4]]
  ];

  const updateRipplePosition = event => {
    if (event.pointerType === "mouse") {
      event.currentTarget.style.setProperty("--cursor-x", `${event.clientX}px`);
      event.currentTarget.style.setProperty("--cursor-y", `${event.clientY}px`);
    }
  };
  const pulseRipple = event => {
    if (event.pointerType !== "mouse") return;
    const shell = event.currentTarget;
    shell.classList.remove("ripple-pulse");
    void shell.offsetWidth;
    shell.classList.add("ripple-pulse");
    window.setTimeout(() => shell.classList.remove("ripple-pulse"), 650);
  };

  const pondStatus = risk => {
    if (risk === "CRITICAL") return { tone: "emergency", text: t.emergency, Icon: Zap, note: t.priority };
    if (risk === "HIGH") return { tone: "warning", text: t.warning, Icon: AlertTriangle, note: t.riskWatch };
    if (risk === "MODERATE") return { tone: "watch", text: t.warning, Icon: AlertTriangle, note: t.riskWatch };
    if (risk === "LOW") return { tone: "healthy", text: t.healthy, Icon: CheckCircle2, note: t.riskGood };
    return { tone: "pending", text: t.noResult, Icon: CircleHelp, note: t.runToSee };
  };
  const recommendationReason = pond => {
    const threshold = pond.alert_threshold_mg_l ?? report?.scenario?.alert_threshold_mg_l ?? thresholdValue;
    const critical = report?.scenario?.critical_threshold_mg_l ?? 3;
    if (pond.minimum_do_mg_l <= critical) return t.reasonCritical;
    if (pond.minimum_do_mg_l < threshold) return t.reasonHigh;
    if (pond.minimum_do_mg_l < threshold + 1) return t.reasonModerate;
    return t.reasonLow;
  };
  const chartPond = report?.ponds?.find(pond => pond.pond_id === selectedChartPond && pond.trajectory?.length > 1)
    ?? report?.ponds?.find(pond => pond.trajectory?.length > 1);
  const requiredCapacity = ponds.reduce((total, pond) => total + Number(pond.aerator_load_kw ?? 0), 0);
  const selectedPond = ponds.find(pond => pond.pond_id === selectedPondId);
  const selectedPondResult = report?.ponds?.find(pond => pond.pond_id === selectedPondId);
  const selectedPondAllocation = optimization?.allocation?.find(item => item.pond_id === selectedPondId);
  const selectedPondIndex = selectedPond ? ponds.indexOf(selectedPond) : -1;
  const selectedPondPhoto = selectedPondIndex >= 0 ? pondPhotoAssets[selectedPondIndex % pondPhotoAssets.length] : null;

  return <div lang={language} className={`app-shell ${simpleLanguage ? "simple-language" : ""}`} onPointerMove={updateRipplePosition} onPointerDown={pulseRipple}>
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Waves size={23} /></div>
        <div><div className="brand-name">AquaResQ</div><div className="brand-sub">POND INTELLIGENCE</div></div>
      </div>
      <div className="workspace-label">{t.workspace}</div>
      <nav aria-label="Workspace navigation">
        {navigation.map(([page, Icon, label]) => <button
          className={`nav-item ${activePage === page ? "active" : ""}`}
          key={page}
          onClick={() => { setActivePage(page); setMobileMenuOpen(false); }}
          aria-current={activePage === page ? "page" : undefined}
        ><Icon size={17}/> {label}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon"><AlertTriangle size={17}/></div>
          <strong>{t.guideTitle}</strong>
          <p>{t.guideSub}</p>
        </div>
        <div className="team-tag">TEAM SKAY <span>•</span> HACKWITHADITYA 2026</div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <button className="mobile-brand" onClick={() => setMobileMenuOpen(open => !open)} aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}>
          {mobileMenuOpen ? <X size={19}/> : <Menu size={19}/>} AquaResQ
        </button>
        <div className="breadcrumb">Workspace <span>/</span> <b>{navigation.find(([page]) => page === activePage)?.[2]}</b></div>
        <div className="topbar-right">
          <label className="language-control"><Languages size={15}/><select aria-label="Language" value={language} onChange={event => setLanguage(event.target.value)}>
            <option value="en">{t.english}</option><option value="te">{t.telugu}</option>
          </select></label>
          <button className={`simple-toggle ${simpleLanguage ? "selected" : ""}`} onClick={() => setSimpleLanguage(value => !value)} aria-pressed={simpleLanguage} title={t.useSimple}>
            <Type size={15}/><span>{t.useSimple}</span>
          </button>
          <button className="voice-button" onClick={speakGuidance} title={voicePlaying ? t.stopVoice : t.voice} aria-label={voicePlaying ? t.stopVoice : t.voice} aria-pressed={voicePlaying}><Volume2 size={16}/><span>{voicePlaying ? t.stopVoice : t.voice}</span></button>
          <span className={`api-pill ${apiStatus === "Connected" ? "online" : ""}`}><span className="status-dot"/>{t.api}: {apiStatusText}</span>
          <button className="icon-button" onClick={checkApi} title={t.checkConnection} aria-label={t.checkConnection}><RefreshCw size={16}/></button>
          <div className="avatar">SK</div>
        </div>
      </header>
      {mobileMenuOpen && <nav className="mobile-nav" aria-label="Mobile workspace navigation">
        {navigation.map(([page, Icon, label]) => <button
          className={`nav-item ${activePage === page ? "active" : ""}`}
          key={page}
          onClick={() => { setActivePage(page); setMobileMenuOpen(false); }}
          aria-current={activePage === page ? "page" : undefined}
        ><Icon size={17}/> {label}</button>)}
      </nav>}

      <section className="page-heading">
        <div>
          <div className="eyebrow">{t.assistant}</div>
          <h1>{t.pages[pageIndex][0]}</h1>
          <p>{t.pages[pageIndex][1]}</p>
        </div>
        {activePage === "overview" && <div className="demo-label"><span/> {t.demo}</div>}
      </section>

        {activePage === "overview" && <>
          <DemoScenarioSelector
            selectedScenario={selectedDemoScenario}
            onChange={loadDemoScenario}
            loading={demoLoading}
            error={demoError}
            labels={t}
            ponds={ponds}
            outageHours={outageHours}
            generatorCapacity={generatorCapacity}
            availableEnergy={availableEnergy}
            threshold={displayedThreshold}
          />
          <ExplainableDecision report={report} optimization={optimization} ponds={ponds} labels={t} language={language}/>
        </>}

        {activePage === "overview" && <section className="metrics-grid">
        <Metric label={t.nav[1]} value={totalPonds} detail={language === "te" ? "ఈ అంచనాలో చెరువులు" : "Ponds in this scenario"} icon={Droplets}/>
        <Metric label={t.outage} value={`${outageHours} ${t.hours}`} detail={language === "te" ? "మీరు ఎంచుకున్న సమయం" : "Time you entered"} icon={Clock3} tone="blue"/>
        <Metric label={language === "te" ? "ముందుగా చూడాల్సిన చెరువు" : "POND TO REVIEW"} value={highestPriority} detail={report ? (language === "te" ? "నమూనా ప్రమాద అంచనా" : "From this model scenario") : t.noResult} icon={AlertTriangle} tone="amber"/>
        <Metric label={t.api} value={apiStatusText} detail={language === "te" ? "స్థానిక AquaResQ సేవ" : "Local AquaResQ service"} icon={Server} tone="violet"/>
      </section>}

      {activePage === "overview" && <>
      <section className="farmer-hero">
        <div className="farmer-hero-copy">
          <span className="farmer-kicker"><Waves size={15}/> {t.assistant}</span>
          <h2>{t.heroTitle}</h2>
          <p>{t.heroText}</p>
          <div className="visual-status-key" aria-label="Pond status guide">
            <span className="key-good"><CheckCircle2 size={16}/>{t.statusKey[0]}</span>
            <span className="key-warning"><AlertTriangle size={16}/>{t.statusKey[1]}</span>
            <span className="key-emergency"><Zap size={16}/>{t.statusKey[2]}</span>
          </div>
          {criticalPonds.length > 0 && <div className="scenario-alert emergency" role="status">
            <Zap size={21}/><span><strong>{t.emergency} · {criticalPonds.map(pond => pond.pond_id).join(", ")}</strong>
              <small>{language === "te" ? "ఈ నమూనా అంచనాలో ప్రమాదం ఉంది. చెరువును చూసి స్థానిక నిపుణుడిని సంప్రదించండి; ఇది ప్రత్యక్ష హెచ్చరిక కాదు." : "This model scenario predicts critical risk. Check the pond and contact a local expert; this is not a live alert."}</small>
            </span>
          </div>}
          {criticalPonds.length === 0 && watchPonds.length > 0 && <div className="scenario-alert warning" role="status">
            <AlertTriangle size={20}/><span><strong>{t.warning} · {watchPonds.map(pond => pond.pond_id).join(", ")}</strong>
              <small>{language === "te" ? "ఈ నమూనా అంచనాను గమనించండి. ప్రత్యక్ష నీటి పరీక్షకు బదులుగా దీన్ని వాడకండి." : "Review this model estimate. It is not a substitute for checking the pond water."}</small>
            </span>
          </div>}
          <div className="not-live-note"><CircleHelp size={15}/>{t.emergencyNote}</div>
        </div>
        <FarmPhoto
          className="hero-farm-photo"
          src="/assets/shrimp-pond.jpg"
          alt={language === "te" ? "హోండురాస్‌లోని రొయ్యల చెరువు వద్ద సమాచారం సేకరిస్తున్న విద్యార్థులు" : "Students collecting data beside an aquaculture pond in Honduras"}
          caption={language === "te" ? "రొయ్యల చెరువు · ఉదాహరణ చిత్రం" : "Shrimp pond · illustrative photo"}
          fallback={<PondIllustration className="hero-pond-illustration" language={language}/>}
        />
        <span className="hero-demo-tag">{t.demo}</span>
      </section>

      <section className="farmer-pond-section">
        <div className="farmer-section-heading">
          <div><span className="panel-kicker">{t.pondInputs}</span><h2>{t.pages[1][0]}</h2></div>
          <span className="table-count">{ponds.length} {t.nav[1]}</span>
        </div>
        <div className="farmer-pond-grid">{ponds.map((pond, index) => {
          const result = report?.ponds?.find(item => item.pond_id === pond.pond_id);
          const status = pondStatus(result?.risk);
          const oxygenValue = result?.minimum_do_mg_l ?? pond.initial_do_mg_l;
          const StatusIcon = status.Icon;
          const photo = pondPhotoAssets[index % pondPhotoAssets.length];
          return <article className={`farmer-pond-card ${status.tone}`} key={pond.pond_id} role="button" tabIndex="0" aria-label={`${t.openPond}: ${pond.pond_id}. ${status.text}`} title={t.openPond} onClick={() => {
            setSelectedPondId(pond.pond_id);
            setActivePage("ponds");
          }} onKeyDown={event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelectedPondId(pond.pond_id);
              setActivePage("ponds");
            }
          }}>
            <div className="farmer-pond-top"><span className="pond-id-badge"><Droplets size={15}/>{pond.pond_id}</span>
              <span className={`farmer-status ${status.tone}`}><StatusIcon size={15}/>{status.text}</span></div>
            <FarmPhoto src={photo.src} alt={photo.alt[language === "te" ? 1 : 0]} caption={language === "te" ? "చెరువు · ఉదాహరణ చిత్రం" : "Pond · illustrative photo"} className="pond-card-photo" fallback={<PondIllustration aerationOn={result?.aeration_supplied === true} language={language}/>}/>
            <PondIllustration className="pond-card-illustration" aerationOn={result?.aeration_supplied === true} language={language}/>
            <OxygenGauge value={oxygenValue} status={status.tone} label={result ? t.predicted : t.pondInput}/>
            <div className={`pond-aerator-status ${optimization?.allocation?.find(item => item.pond_id === pond.pond_id)?.aerator_allocated ? "powered" : ""}`}>
              <Zap size={14}/><span>{t.aeratorStatus}: {optimization
                ? (optimization.allocation.find(item => item.pond_id === pond.pond_id)?.aerator_allocated ? t.poweredByPlan : t.notConnected)
                : t.noGeneratorPlan}</span>
            </div>
            <div className="pond-card-caption"><strong>{t.pondScenario}</strong><span>{result ? `${t.predicted} · ${language === "te" ? ({ CRITICAL: "అత్యవసరం", HIGH: "అధికం", MODERATE: "గమనించండి", LOW: "తక్కువ" }[result.risk]) : result.risk}` : t.noPrediction}</span></div>
            <p className="pond-card-recommendation">{status.note}</p>
          </article>;
        })}</div>
      </section>

      <section className="emergency-guide">
        <div className="emergency-guide-heading">
          <div><span className="panel-kicker">{t.assistant}</span><h2>{t.guideTitle}</h2><p>{t.guideSub}</p></div>
          <div className="emergency-guide-actions">
            <button className="secondary-button voice-guide-button" onClick={speakGuidance} aria-pressed={voicePlaying}><Volume2 size={16}/>{voicePlaying ? t.stopVoice : t.voice}</button>
            <PowerWarningIllustration className="power-warning-illustration" language={language}/>
          </div>
        </div>
        {voiceMessage && <div className="voice-status" role="status">{voiceMessage}</div>}
        <div className="emergency-steps">{t.steps.map(([title, detail], index) => {
          const StepIcon = [Power, Zap, Droplets, CircleHelp][index];
          return <article className="emergency-step" key={title}>
            <span className="step-number">{index + 1}</span><span className="step-icon"><StepIcon size={19}/></span>
            <div><strong>{title}</strong><p>{detail}</p></div>
          </article>;
        })}</div>
      </section>
      </>}

      {(activePage === "overview" || activePage === "simulations") && <>
      <section className="content-grid">
        <div className="panel simulation-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">{t.assistant}</div><h2>{t.outagePlan}</h2></div>
            <span className="panel-icon"><Gauge size={18}/></span>
          </div>
          <div className="control-row">
            <label>{t.outage} <strong>{outageHours} {t.hours}</strong></label>
            <input type="range" min="1" max="24" value={outageHours} onChange={e => updateOutageHours(e.target.value)}/>
            <div className="range-labels"><span>1 {t.hour}</span><span>24 {t.hours}</span></div>
          </div>
          <div className="control-row threshold-control">
            <label htmlFor="threshold">{t.oxygen} <strong>{displayedThreshold} mg/L</strong></label>
            <input id="threshold" type="number" min="0.1" max="10" step="0.1" value={alertThreshold} aria-invalid={!thresholdValid} aria-describedby={!thresholdValid ? "threshold-error" : undefined} onChange={e => updateAlertThreshold(e.target.value)}/>
            {!thresholdValid && <p id="threshold-error" className="error-message" role="alert">{t.invalidThreshold}</p>}
          </div>
          <div className="oxygen-explanation"><Droplets size={18}/><span><strong>{t.oxygen}</strong><small>{t.oxygenExplain}</small></span></div>
          <div className="pond-inputs-title">{t.pondInputs} <span>{ponds.length} {t.nav[1]}</span></div>
          <div className="pond-inputs">
            {ponds.map((pond, index) => <div className="pond-input-row" key={pond.pond_id}>
              <div className="pond-name"><span className="pond-dot"/> {pond.pond_id}</div>
              <label>{t.initialOxygen}
                <input type="number" step="0.1" value={pond.initial_do_mg_l} onChange={e => updatePond(index, "initial_do_mg_l", e.target.value)}/>
              </label>
              <label>{t.biomass}
                <input type="number" min="0" value={pond.biomass_kg} onChange={e => updatePond(index, "biomass_kg", e.target.value)}/>
              </label>
            </div>)}
          </div>
          <button className="primary-button" onClick={runSimulation} disabled={loading || demoLoading}>
            {loading ? <RefreshCw className="spin" size={17}/> : <Activity size={17}/>}
            {loading ? t.running : t.runSimulation}
          </button>
          {error && <div className="error-message"><AlertTriangle size={16}/>{error}</div>}
          <div className="model-note"><AlertTriangle size={14}/>{t.modelDisclaimer}</div>
        </div>

        <div className="panel results-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">{t.modelOutput}</div><h2>{t.riskSummary}</h2></div>
            <span className="live-tag"><span/> {report ? t.received : t.waiting}</span>
          </div>
          <div className="risk-list">
            {!report && <div className="risk-pending"><CircleHelp size={21}/><span><strong>{t.noResult}</strong><small>{t.runToSee}</small></span></div>}
            {report && [
              ["CRITICAL", summary.CRITICAL, "critical"],
              ["HIGH", summary.HIGH, "high"],
              ["MODERATE", summary.MODERATE, "moderate"],
              ["LOW", summary.LOW, "low"]
            ].map(([name, count, cls]) => {
              const RiskIcon = cls === "low" ? CheckCircle2 : cls === "critical" ? Zap : AlertTriangle;
              return <div className="risk-row" key={name}>
              <span className={`risk-badge ${cls}`}><RiskIcon size={12}/>{language === "te" ? ({ CRITICAL: "అత్యవసరం", HIGH: "అధికం", MODERATE: "గమనించండి", LOW: "తక్కువ" }[name]) : ({ CRITICAL: "URGENT", HIGH: "HIGH", MODERATE: "WATCH", LOW: "GOOD" }[name])}</span>
              <div className="risk-track"><div className={`risk-fill ${cls}`} style={{width: `${totalPonds ? count / totalPonds * 100 : 0}%`}}/></div>
              <strong>{count}</strong>
            </div>;
            })}
          </div>
          <div className="priority-box">
            <div className="priority-icon"><AlertTriangle size={18}/></div>
            <div><div className="priority-label">{language === "te" ? "ముందుగా చూడాల్సిన చెరువు" : "POND TO REVIEW FIRST"}</div><strong>{report?.summary?.highest_priority_pond ?? t.runSimulation}</strong><p>{report ? t.priority : t.runToSee}</p></div>
          </div>
          <div className="result-foot"><Wifi size={15}/> {report ? t.received : t.waiting}</div>
        </div>
      </section>

      {(activePage === "overview" || activePage === "simulations") && <>
      <section className="insights-grid">
        <div className="panel timeline-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">{t.modelOutput}</div><h2>{t.timeline}</h2></div>
            <span className="panel-icon"><Clock3 size={18}/></span>
          </div>
          <p className="section-description">{t.timelineIntro}</p>
          {!report ? <div className="insight-empty"><CircleHelp size={20}/>{t.runFirst}</div> :
            <div className="timeline-list">{[...report.ponds].sort((a, b) => {
              if (a.time_to_alert_hours == null) return b.time_to_alert_hours == null ? 0 : 1;
              if (b.time_to_alert_hours == null) return -1;
              return a.time_to_alert_hours - b.time_to_alert_hours;
            }).map(pond => {
              const status = pondStatus(pond.risk);
              const Icon = status.Icon;
              const scenarioHours = report.scenario?.outage_hours ?? outageHours;
              const progress = pond.time_to_alert_hours == null ? 100 : Math.min(100, pond.time_to_alert_hours / scenarioHours * 100);
              return <article className={`timeline-item ${status.tone}`} key={pond.pond_id}>
                <div className="timeline-item-head"><span className="timeline-pond"><Icon size={15}/><strong>{pond.pond_id}</strong></span>
                  <span>{pond.time_to_alert_hours == null ? t.noAlertCrossing : `${t.attentionAt}: ${pond.time_to_alert_hours}h`}</span></div>
                <div className="timeline-track"><span style={{ width: `${progress}%` }}/><i style={{ left: `${progress}%` }}/></div>
                <div className="timeline-scale"><span>0h</span><span>{scenarioHours}h</span></div>
              </article>;
            })}</div>}
        </div>
        <div className="panel recommendation-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">{t.assistant}</div><h2>{t.recommendations}</h2></div>
            <span className="panel-icon"><AlertTriangle size={18}/></span>
          </div>
          {!report ? <div className="insight-empty"><CircleHelp size={20}/>{t.runFirst}</div> :
            <div className="recommendation-list">{report.ponds.map((pond, index) => {
              const status = pondStatus(pond.risk);
              const Icon = status.Icon;
              return <article className={`recommendation-item ${status.tone}`} key={pond.pond_id}>
                <div className="recommendation-rank">{index + 1}</div>
                <div className="recommendation-body">
                  <div className="recommendation-title"><Icon size={16}/><strong>{pond.pond_id}</strong>{index === 0 && <span>{t.prioritized}</span>}</div>
                  <p>{recommendationReason(pond)}</p>
                  <small>{t.minReason}: <strong>{pond.minimum_do_mg_l.toFixed(2)} mg/L</strong></small>
                  {pond.time_to_alert_hours != null && <small>{t.timeReason}: <strong>{pond.time_to_alert_hours}h</strong></small>}
                </div>
              </article>;
            })}</div>}
        </div>
      </section>
      {report && chartPond?.trajectory?.length > 1 && <section className="panel chart-panel">
        <div className="chart-toolbar">
          <div><div className="panel-kicker">{t.modelOutput}</div><h2>{t.chart}</h2></div>
          <label>{t.pond}
            <select value={chartPond.pond_id} onChange={event => setSelectedChartPond(event.target.value)}>
              {report.ponds.filter(pond => pond.trajectory?.length > 1).map(pond => <option key={pond.pond_id} value={pond.pond_id}>{pond.pond_id}</option>)}
            </select>
          </label>
        </div>
        <OxygenChart pond={chartPond} labels={t}/>
      </section>}
      {report && <div className="report-actions"><button className="secondary-button" onClick={downloadReport}><Download size={16}/>{t.report}</button></div>}

      {activePage === "simulations" && <section className="panel comparison-panel">
        <div className="comparison-heading">
          <div><div className="panel-kicker">{t.modelOutput}</div><h2>{t.comparisonHeading}</h2><p>{t.comparisonIntro}</p></div>
          <ChartNoAxesCombined size={25}/>
        </div>
        <button className="primary-button comparison-button" onClick={compareScenarios} disabled={comparing || demoLoading}>
          {comparing ? <RefreshCw className="spin" size={17}/> : <ChartNoAxesCombined size={17}/>}
          {comparing ? t.comparing : t.comparison}
        </button>
        {comparisonError && <div className="error-message"><AlertTriangle size={16}/>{comparisonError}</div>}
        {comparisonReports.length > 0 && <div className="comparison-cards">{comparisonReports.map(({ hours, report: result }) => {
          const firstPond = result.ponds[0];
          const status = pondStatus(firstPond?.risk);
          const Icon = status.Icon;
          return <article className={`comparison-card ${status.tone}`} key={hours}>
            <div className="comparison-card-title"><Clock3 size={16}/><strong>{hours} {t.limitTime}</strong></div>
            <div className={`farmer-status ${status.tone}`}><Icon size={14}/>{status.text}</div>
            <div className="comparison-card-stats"><span>{t.urgent} <b>{result.summary.risk_counts.CRITICAL}</b></span>
              <span>{t.watch} <b>{result.summary.risk_counts.HIGH + result.summary.risk_counts.MODERATE}</b></span>
            </div>
            <p>{t.priority} <strong>{result.summary.highest_priority_pond}</strong></p>
          </article>;
        })}</div>}
        <p className="model-note"><AlertTriangle size={14}/>{t.modelDisclaimer}</p>
      </section>}

      <section className="panel pond-results">
        <div className="panel-heading">
          <div><div className="panel-kicker">{t.modelOutput}</div><h2>{t.result}</h2></div>
          <span className="table-count">{report?.ponds?.length ?? 0} {language === "te" ? "ఫలితాలు" : "results"}</span>
        </div>
        {!report ? <div className="empty-state"><div className="empty-icon"><Activity size={22}/></div><strong>{t.noResults}</strong><p>{t.resultHelp}</p></div> :
          <div className="table-wrap"><table>
            <thead><tr><th>{t.tablePond}</th><th>{t.tableStarting} (mg/L)</th><th>{t.tableMinimum} (mg/L)</th><th>{t.tableFinal} (mg/L)</th><th>{t.tableAlert}</th><th>{t.tableRisk}</th></tr></thead>
            <tbody>{report.ponds.map(pond => <tr key={pond.pond_id}>
              <td><strong>{pond.pond_id}</strong></td>
              <td>{pond.initial_do_mg_l.toFixed(2)} mg/L</td>
              <td>{pond.minimum_do_mg_l.toFixed(2)} mg/L</td>
              <td>{pond.final_do_mg_l.toFixed(2)} mg/L</td>
              <td>{pond.time_to_alert_hours == null ? t.notCrossed : `${pond.time_to_alert_hours.toFixed(2)} h`}</td>
              <td><span className={`risk-badge ${pond.risk.toLowerCase()}`}>{pond.risk === "LOW" ? <CheckCircle2 size={12}/> : pond.risk === "CRITICAL" ? <Zap size={12}/> : <AlertTriangle size={12}/>}
                {language === "te" ? ({ CRITICAL: "అత్యవసరం", HIGH: "అధికం", MODERATE: "గమనించండి", LOW: "తక్కువ" }[pond.risk]) : ({ CRITICAL: "URGENT", HIGH: "HIGH", MODERATE: "WATCH", LOW: "GOOD" }[pond.risk])}</span></td>
            </tr>)}</tbody>
          </table></div>}
        {report?.disclaimer && <div className="table-disclaimer">{language === "te" ? t.modelDisclaimer : report.disclaimer}</div>}
      </section>
      </>}

      </>}

      {activePage === "ponds" && <section className="panel pond-management">
        <div className="panel-heading">
          <div>          <div className="panel-kicker">{t.workspace}</div><h2>{t.pondDetails}</h2></div>
          <span className="table-count">{ponds.length} ponds</span>
        </div>
        <p className="section-description">{t.edits}</p>
        {selectedPond && selectedPondPhoto && <section className="pond-detail-view" aria-labelledby="selected-pond-title">
          <div className="pond-detail-heading">
            <div><span className="panel-kicker">{t.detailHint}</span><h3 id="selected-pond-title">{selectedPond.pond_id}</h3></div>
            <button type="button" className="secondary-button" onClick={() => setSelectedPondId("")}><ArrowLeft size={15}/>{t.backToPonds}</button>
          </div>
          <div className="pond-detail-grid">
            <FarmPhoto
              className="pond-detail-photo"
              src={selectedPondPhoto.src}
              alt={selectedPondPhoto.alt[language === "te" ? 1 : 0]}
              caption={language === "te" ? "చెరువు · ఉదాహరణ చిత్రం" : "Pond · illustrative photo"}
              fallback={<PondIllustration aerationOn={selectedPondAllocation?.aerator_allocated === true} language={language}/>}
            />
            <div className="pond-detail-summary">
              <div className="pond-detail-name"><Droplets size={18}/><strong>{selectedPond.pond_id}</strong><span>{t.pondDetails}</span></div>
              <OxygenGauge
                value={selectedPondResult?.minimum_do_mg_l ?? selectedPond.initial_do_mg_l}
                status={pondStatus(selectedPondResult?.risk).tone}
                label={selectedPondResult ? t.predicted : t.startingInput}
              />
              <div className={`pond-aerator-status ${selectedPondAllocation?.aerator_allocated ? "powered" : ""}`}>
                <Zap size={16}/><span>{t.aeratorStatus}: {optimization
                  ? (selectedPondAllocation?.aerator_allocated ? t.poweredByPlan : t.notConnected)
                  : t.noGeneratorPlan}</span>
              </div>
              <div className="pond-detail-facts">
                <span>{t.area}<strong>{selectedPond.area_m2} m²</strong></span>
                <span>{t.depth}<strong>{selectedPond.average_depth_m} m</strong></span>
                <span>{t.biomass}<strong>{selectedPond.biomass_kg} kg</strong></span>
              </div>
              <FarmPhoto
                className="pond-detail-shrimp"
                src="/assets/vannamei-shrimp.jpg"
                alt={language === "te" ? "వైట్‌లెగ్ రొయ్య (Litopenaeus vannamei) దగ్గరి చిత్రం" : "Close-up of a whiteleg shrimp (Litopenaeus vannamei)"}
                caption={t.shrimp}
                fallback={<PondIllustration language={language}/>}
              />
            </div>
          </div>
          {selectedPondResult?.trajectory?.length > 1
            ? <OxygenChart key={selectedPondId} pond={selectedPondResult} labels={t}/>
            : <div className="insight-empty"><CircleHelp size={18}/>{t.noSimulation}</div>}
          {report && <ScenarioTimeline report={report} labels={t}/>}
        </section>}
        <div className="pond-editor-list">
          {ponds.map((pond, index) => <article className="pond-editor-card" key={index}>
            <FarmPhoto
              className="pond-editor-photo"
              src={pondPhotoAssets[index % pondPhotoAssets.length].src}
              alt={pondPhotoAssets[index % pondPhotoAssets.length].alt[language === "te" ? 1 : 0]}
              caption={language === "te" ? "చెరువు నిర్వహణ · ఉదాహరణ చిత్రం" : "Pond management · illustrative photo"}
              fallback={<PondIllustration language={language}/>}
            />
            <div className="pond-editor-heading"><span className="pond-dot"/><strong>{pond.pond_id}</strong><span>{t.pondScenario}</span></div>
            <div className="pond-editor-fields">
              <label>{t.pondId}<input value={pond.pond_id} onChange={e => updatePond(index, "pond_id", e.target.value)}/></label>
              <label>{t.area}<input type="number" min="0" value={pond.area_m2} onChange={e => updatePond(index, "area_m2", e.target.value)}/></label>
              <label>{t.depth}<input type="number" min="0" step="0.1" value={pond.average_depth_m} onChange={e => updatePond(index, "average_depth_m", e.target.value)}/></label>
              <label title={t.oxygenExplain}>{t.initialOxygen} (mg/L)<input type="number" min="0" step="0.1" value={pond.initial_do_mg_l} onChange={e => updatePond(index, "initial_do_mg_l", e.target.value)}/></label>
              <label>{t.biomass}<input type="number" min="0" value={pond.biomass_kg} onChange={e => updatePond(index, "biomass_kg", e.target.value)}/></label>
              <label title={language === "te" ? "ఏరేటర్ వాడే విద్యుత్" : "Electricity used by this pond's aerator"}>{t.aeratorLoad}<input type="number" min="0" step="0.1" value={pond.aerator_load_kw ?? 0} onChange={e => updatePond(index, "aerator_load_kw", e.target.value)}/></label>
              <label title={language === "te" ? "ఏరేటర్ నీటికి అందించే ఆక్సిజన్" : "Oxygen added to water by the aerator"}>{t.aerationOutput}<input type="number" min="0" step="0.01" value={pond.aeration_addition_mg_l_h ?? 0} onChange={e => updatePond(index, "aeration_addition_mg_l_h", e.target.value)}/></label>
            </div>
          </article>)}
        </div>
        <div className="panel-actions"><button className="primary-button" onClick={runSimulation} disabled={loading || demoLoading}>
          {loading ? <RefreshCw className="spin" size={17}/> : <Activity size={17}/>}
          {loading ? t.running : t.usePond}
        </button></div>
        {error && <div className="error-message"><AlertTriangle size={16}/>{error}</div>}
      </section>}

      {activePage === "power" && <section className="power-layout">
        <div className="panel power-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">{t.assistant}</div><h2>{t.outagePlan}</h2></div>
            <span className="panel-icon"><Zap size={18}/></span>
          </div>
          <p className="section-description">{t.outageExplain}</p>
          <div className="control-row">
            <label htmlFor="power-outage">{t.outage} <strong>{outageHours} {t.hours}</strong></label>
            <input id="power-outage" type="range" min="1" max="24" value={outageHours} onChange={e => updatePowerOutageHours(e.target.value)}/>
            <div className="range-labels"><span>1 {t.hour}</span><span>24 {t.hours}</span></div>
          </div>
          <div className="scenario-visualization">
            <button type="button" className="secondary-button" onClick={runSimulation} disabled={loading || demoLoading}>
              {loading ? <RefreshCw className="spin" size={16}/> : <Activity size={16}/>}
              {loading ? t.running : t.visualiseOutage}
            </button>
            {error && <div className="error-message" role="alert"><AlertTriangle size={16}/>{error}</div>}
            {report && <div className="scenario-result" role="status">
              <p className="scenario-success"><CheckCircle2 size={16}/>{t.simulationSuccess}</p>
              <ScenarioTimeline report={report} labels={t}/>
              {report.ponds[0]?.trajectory?.length > 1 && <OxygenChart pond={report.ponds[0]} labels={t}/>}
            </div>}
            {!report && !loading && <p className="scenario-hint">{t.noSimulation}</p>}
          </div>
          <div className="power-fields">
            <label title={language === "te" ? "జనరేటర్ అందించే విద్యుత్ సామర్థ్యం" : "Maximum power the generator can provide"}>{t.generatorCapacity}<input type="number" min="0" step="0.1" value={generatorCapacity} onChange={e => { invalidateDemoScenario(); setGeneratorCapacity(e.target.value); setReport(null); setOptimization(null); }}/><span>kW</span></label>
            <label title={language === "te" ? "అంచనా సమయంలో ఉపయోగించగల శక్తి" : "Energy available during the outage"}>{t.availableEnergy} <small>{t.optional}</small><input type="number" min="0" step="0.1" placeholder={language === "te" ? "పరిమితి లేదు" : "No limit"} value={availableEnergy} onChange={e => { invalidateDemoScenario(); setAvailableEnergy(e.target.value); setReport(null); setOptimization(null); }}/><span>kWh</span></label>
            <label title={t.oxygenExplain}>{t.oxygenTarget}<input type="number" min="0.1" step="0.1" value={alertThreshold} aria-invalid={!thresholdValid} aria-describedby={!thresholdValid ? "power-threshold-error" : undefined} onChange={e => updateAlertThreshold(e.target.value)}/><span>mg/L</span></label>
          </div>
          {!thresholdValid && <p id="power-threshold-error" className="error-message" role="alert">{t.invalidThreshold}</p>}
          <div className="generator-visual"><FarmPhoto
            className="generator-photo"
            src="/assets/diesel-generator.jpg"
            alt={language === "te" ? "ట్రైలర్‌పై అమర్చిన యూనిట్‌తో సహా రెండు క్యాటర్‌పిల్లర్ డీజిల్ జనరేటర్లు" : "Two Caterpillar diesel generators, including a portable trailer-mounted unit"}
            caption={language === "te" ? "డీజిల్ జనరేటర్ · ఉదాహరణ చిత్రం" : "Diesel generator · illustrative photo"}
            fallback={<GeneratorIllustration running={optimization?.allocated_power_kw > 0} language={language}/>}
          /><div><strong>{t.generator}</strong><p>{optimization ? (optimization.allocated_power_kw > 0 ? t.generatorOn : t.generatorOff) : t.generatorHelp}</p></div></div>
          <button className="primary-button" onClick={runOptimization} disabled={optimizing || demoLoading}>
            {optimizing ? <RefreshCw className="spin" size={17}/> : <Zap size={17}/>}
            {optimizing ? t.optimizing : t.optimize}
          </button>
          {optimizationError && <div className="error-message"><AlertTriangle size={16}/>{optimizationError}</div>}
          {optimization && <div className="optimization-results">
            <p className="scenario-success" role="status"><CheckCircle2 size={16}/>{t.optimizerSuccess}</p>
            <div className="optimization-metrics">
              <div><span>{t.allocated}</span><strong>{optimization.allocated_power_kw} kW</strong></div>
              <div><span>{t.energy}</span><strong>{optimization.estimated_energy_kwh} kWh</strong></div>
              <div><span>{t.feasible}</span><strong>{optimization.feasible_allocations_evaluated}</strong></div>
              <div><span title={language === "te" ? "చెరువు వివరాల్లో ఇచ్చిన అన్ని ఏరేటర్ విద్యుత్ విలువల మొత్తం" : "Sum of the aerator power values entered for all ponds"}>{t.requiredCapacity}</span><strong>{requiredCapacity.toFixed(2)} kW</strong></div>
            </div>
            <div className="capacity-section">
              <div className="capacity-heading"><strong>{t.availableCapacity}</strong><span>{optimization.generator_capacity_kw} kW</span></div>
              <div className="required-capacity-track" role="img" aria-label={`${t.requiredCapacity}: ${requiredCapacity.toFixed(2)} kW; ${t.availableCapacity}: ${optimization.generator_capacity_kw} kW`}>
                <span className={requiredCapacity > optimization.generator_capacity_kw ? "over-capacity" : ""} style={{ width: `${requiredCapacity ? Math.min(100, requiredCapacity / Math.max(requiredCapacity, optimization.generator_capacity_kw) * 100) : 0}%` }}/>
              </div>
              <small>{t.requiredCapacity}: {requiredCapacity.toFixed(2)} kW</small>
              <div className="capacity-heading assigned-capacity-heading"><strong>{t.assignedCapacity}</strong><span>{optimization.allocated_power_kw} / {optimization.generator_capacity_kw} kW</span></div>
              <div className="capacity-track" role="img" aria-label={`${t.allocated}: ${optimization.allocated_power_kw} kW of ${optimization.generator_capacity_kw} kW`}>
                <span style={{ width: `${optimization.generator_capacity_kw ? Math.min(100, optimization.allocated_power_kw / optimization.generator_capacity_kw * 100) : 0}%` }}/>
              </div>
              <small>{t.spare}: {Math.max(0, optimization.generator_capacity_kw - optimization.allocated_power_kw).toFixed(2)} kW</small>
            </div>
            {optimization.comparison_strategies && <StrategyComparison
              strategies={optimization.comparison_strategies}
              optimization={optimization}
              labels={t}
            />}
            <h3>{language === "te" ? "జనరేటర్ కేటాయింపు" : "Generator plan for each pond"}</h3>
            <div className="allocation-list">{optimization.allocation.map(item => <div className={`allocation-row ${item.aerator_allocated ? "powered" : ""}`} key={item.pond_id}>
              <PondIllustration className="allocation-pond-illustration" aerationOn={item.aerator_allocated} language={language}/>
              <strong>{item.pond_id}</strong><span>{item.aerator_allocated ? t.aerator : (language === "te" ? "ఏరేటర్ లేదు" : "No aerator")}</span><b>{item.aerator_load_kw} kW</b>
              <div className="allocation-track" aria-hidden="true"><span style={{ width: `${optimization.generator_capacity_kw ? Math.min(100, item.aerator_load_kw / optimization.generator_capacity_kw * 100) : 0}%` }}/></div>
            </div>)}</div>
            <p className="optimization-disclaimer" role="status">{allocationExplanation(optimization, ponds, language)}</p>
            <PowerFlowDiagram optimization={optimization} language={language}/>
            <p className="optimization-disclaimer">{language === "te" ? t.modelDisclaimer : optimization.disclaimer}</p>
          </div>}
          <div className="model-note"><AlertTriangle size={14}/>{t.modelDisclaimer}</div>
        </div>
        <div className="panel power-status-panel">
          <GeneratorIllustration className="power-panel-illustration" running={optimization?.allocated_power_kw > 0} language={language}/>
          <div className="panel-kicker">{t.connection}</div>
          <h2>{t.service}</h2>
          <div className={`connection-status ${apiStatus === "Connected" ? "connected" : ""}`}><span className="status-dot"/><strong>{apiStatusText}</strong></div>
          <p>{t.localApi}</p>
          <button className="secondary-button" onClick={checkApi}><RefreshCw size={15}/> {t.checkConnection}</button>
        </div>
      </section>}

      {activePage === "settings" && <section className="settings-layout">
        <div className="panel settings-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">{t.preferences}</div><h2>{t.oxygen}</h2></div>
            <span className="panel-icon"><SlidersHorizontal size={18}/></span>
          </div>
          <p className="section-description">{t.thresholdHelp} {t.oxygenExplain}</p>
          <div className="settings-field">
            <label htmlFor="settings-threshold">{t.oxygen}</label>
            <div className="input-with-unit"><input id="settings-threshold" type="number" min="0.1" max="10" step="0.1" value={alertThreshold} aria-invalid={!thresholdValid} aria-describedby={!thresholdValid ? "settings-threshold-error" : undefined} onChange={e => updateAlertThreshold(e.target.value)}/><span>mg/L</span></div>
            {!thresholdValid && <p id="settings-threshold-error" className="error-message" role="alert">{t.invalidThreshold}</p>}
          </div>
          <div className="settings-info"><AlertTriangle size={16}/><span>{t.emergencyNote}</span></div>
        </div>
        <div className="panel settings-panel">
          <div className="panel-heading">
            <div><div className="panel-kicker">{t.connection}</div><h2>{t.apiConnection}</h2></div>
            <span className="panel-icon"><Server size={18}/></span>
          </div>
          <div className={`connection-status ${apiStatus === "Connected" ? "connected" : ""}`}><span className="status-dot"/><strong>{apiStatusText}</strong></div>
          <p className="section-description">{t.localApi}</p>
          <button className="secondary-button" onClick={checkApi}><RefreshCw size={15}/> {t.checkConnection}</button>
        </div>
      </section>}

      <footer><span>© 2026 AquaResQ · Team SKAY</span><span>Prototype v0.5 · Software-only demo</span></footer>
    </main>
  </div>;
}

export default App;
