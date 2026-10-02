import { getCurriculumUnits as getLegacyUnits } from "./staffTimetableCurriculum";

export type Phase1Stage = "KS3" | "GCSE" | "A level";
export type Phase1ExamBoard = "National curriculum" | "AQA";
export type Phase1Subject = "Biology" | "Chemistry" | "Physics" | "Science" | "Maths" | "English" | "Geography" | "History";

export type Phase1Lesson = {
  id: string;
  title: string;
  vocabulary: string;
  objectives: string;
  sequence: string;
  assessment: string;
};

export type Phase1Subtopic = {
  id: string;
  title: string;
  lessons: Phase1Lesson[];
};

export type Phase1Unit = {
  id: string;
  title: string;
  note?: string;
  subtopics: Phase1Subtopic[];
};

export type Phase1Course = {
  id: string;
  stage: Phase1Stage;
  examBoard: Phase1ExamBoard;
  subject: Phase1Subject;
  title: string;
  code?: string;
  units: Phase1Unit[];
};

export type ClassCurriculumProfile = {
  stage: Phase1Stage;
  examBoard: Phase1ExamBoard;
  subject: Phase1Subject;
  courseId: string;
};

export type SuggestedCurriculumLesson = Phase1Lesson & {
  stage: Phase1Stage;
  examBoard: Phase1ExamBoard;
  subject: Phase1Subject;
  courseId: string;
  courseTitle: string;
  unitId: string;
  unitTitle: string;
  subtopicId: string;
  subtopicTitle: string;
  sequencePosition: number;
};

const DEFAULT_SEQUENCE = "Retrieval starter → explicit teaching/model → guided practice → independent application → review/exit ticket";
const DEFAULT_ASSESSMENT = "Cold call / hinge question / short written response / exit ticket";

function slug(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

function lesson(title: string, vocabulary = "", objectives = ""): Phase1Lesson {
  return {
    id: slug(title),
    title,
    vocabulary,
    objectives: objectives || `Explain, apply and evaluate the key ideas and skills for ${title}.`,
    sequence: DEFAULT_SEQUENCE,
    assessment: DEFAULT_ASSESSMENT,
  };
}

function subtopic(title: string, lessons: string[], vocabulary = ""): Phase1Subtopic {
  return { id: slug(title), title, lessons: lessons.map((item) => lesson(item, vocabulary)) };
}

function unit(title: string, subtopics: Phase1Subtopic[], note?: string): Phase1Unit {
  return { id: slug(title), title, subtopics, note };
}

function course(id: string, stage: Phase1Stage, examBoard: Phase1ExamBoard, subject: Phase1Subject, title: string, code: string | undefined, units: Phase1Unit[]): Phase1Course {
  return { id, stage, examBoard, subject, title, code, units };
}

function chunk<T>(items: T[], size = 4) {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

function legacyCourse(id: string, stage: Phase1Stage, subject: "English" | "Geography" | "History", title: string, code: string | undefined, predicate: (name: string) => boolean): Phase1Course {
  const board: Phase1ExamBoard = stage === "KS3" ? "National curriculum" : "AQA";
  const legacy = getLegacyUnits(stage, subject).filter((item) => predicate(item.unit));
  const units = legacy.map((item) => {
    const grouped = chunk(item.lessons, 4);
    return unit(item.unit, grouped.map((group, index) => ({
      id: `${slug(item.unit)}-${index + 1}`,
      title: grouped.length === 1 ? "Core sequence" : ["Foundations", "Development", "Application", "Mastery", "Synoptic review"][index] || `Sequence ${index + 1}`,
      lessons: group.map((entry) => ({ ...entry, id: slug(`${item.unit}-${entry.title}`) })),
    })), item.note);
  });
  return course(id, stage, board, subject, title, code, units);
}

const ks3Biology = course("ks3-biology", "KS3", "National curriculum", "Biology", "KS3 Biology", "KS3", [
  unit("Cells and organisation", [
    subtopic("Cell structure", ["Animal and plant cells", "Cell organelles and their functions", "Using microscopes", "Specialised cells"]),
    subtopic("Movement and organisation", ["Diffusion", "Osmosis", "Levels of organisation", "Tissues, organs and organ systems"]),
  ]),
  unit("Reproduction and inheritance", [
    subtopic("Reproduction", ["Human reproductive systems", "Menstrual cycle and fertilisation", "Pregnancy and birth", "Plant reproduction and pollination"]),
    subtopic("Inheritance", ["DNA, genes and chromosomes", "Inherited variation", "Environmental variation", "Natural selection foundations"]),
  ]),
  unit("Health and ecosystems", [
    subtopic("Health", ["Balanced diet", "Digestive system", "Gas exchange", "Effects of exercise and lifestyle"]),
    subtopic("Ecology", ["Food chains and webs", "Competition and interdependence", "Sampling organisms", "Human impacts on ecosystems"]),
  ]),
]);

const ks3Chemistry = course("ks3-chemistry", "KS3", "National curriculum", "Chemistry", "KS3 Chemistry", "KS3", [
  unit("Particles, atoms and elements", [
    subtopic("Particle model", ["Solids, liquids and gases", "Changes of state", "Diffusion in particles", "Gas pressure"]),
    subtopic("Atoms and the periodic table", ["Atoms and elements", "Compounds and mixtures", "Chemical symbols and formulae", "Periodic table foundations"]),
  ]),
  unit("Reactions", [
    subtopic("Chemical change", ["Physical and chemical changes", "Word equations", "Conservation of mass", "Exothermic and endothermic reactions"]),
    subtopic("Common reaction patterns", ["Acids and alkalis", "Neutralisation", "Metals and acids", "Combustion and oxidation"]),
  ]),
  unit("Earth chemistry and resources", [
    subtopic("Earth materials", ["Rock cycle", "Earth structure", "Atmosphere composition", "Carbon cycle"]),
    subtopic("Resources", ["Finite resources", "Recycling", "Water treatment", "Sustainable materials"]),
  ]),
]);

const ks3Physics = course("ks3-physics", "KS3", "National curriculum", "Physics", "KS3 Physics", "KS3", [
  unit("Forces and motion", [
    subtopic("Forces", ["Contact and non-contact forces", "Force diagrams", "Balanced and unbalanced forces", "Mass and weight"]),
    subtopic("Motion", ["Speed", "Distance-time graphs", "Acceleration foundations", "Pressure in fluids"]),
  ]),
  unit("Energy and electricity", [
    subtopic("Energy", ["Energy stores", "Energy transfers", "Work done", "Power and efficiency"]),
    subtopic("Electric circuits", ["Current and charge", "Potential difference", "Resistance", "Series and parallel circuits"]),
  ]),
  unit("Waves and space", [
    subtopic("Waves", ["Wave properties", "Sound", "Light and reflection", "Refraction and colour"]),
    subtopic("Space", ["Solar system", "Gravity and orbits", "Day, night and seasons", "Stars and galaxies"]),
  ]),
]);

const ks3Science = course("ks3-science", "KS3", "National curriculum", "Science", "KS3 Science", "KS3", []);
ks3Science.units = [...ks3Biology.units, ...ks3Chemistry.units, ...ks3Physics.units];

const ks3Maths = course("ks3-maths", "KS3", "National curriculum", "Maths", "KS3 Mathematics", "KS3", [
  unit("Number", [subtopic("Number fluency", ["Place value and ordering", "Four operations", "Factors, multiples and primes", "Fractions, decimals and percentages", "Standard form", "Estimation and bounds"])]),
  unit("Algebra", [subtopic("Expressions and equations", ["Algebraic notation", "Simplifying expressions", "Substitution", "Solving linear equations", "Sequences", "Straight-line graphs"])]),
  unit("Ratio and proportion", [subtopic("Proportional reasoning", ["Ratio notation", "Sharing in a ratio", "Direct proportion", "Percentage change", "Rates", "Scale drawings"])]),
  unit("Geometry", [subtopic("Shape and space", ["Angle facts", "Polygons", "Area and perimeter", "Volume and surface area", "Transformations", "Pythagoras foundations"])]),
  unit("Probability and statistics", [subtopic("Data and chance", ["Probability scale", "Sample spaces", "Averages and range", "Charts and graphs", "Scatter graphs", "Interpreting data"])]),
]);

const gcseBiology = course("aqa-gcse-biology-8461", "GCSE", "AQA", "Biology", "AQA GCSE Biology", "8461", [
  unit("Cell biology", [
    subtopic("Cell structure and microscopy", ["Eukaryotic and prokaryotic cells", "Cell specialisation and differentiation", "Microscopy and magnification", "Culturing microorganisms"]),
    subtopic("Cell division", ["Chromosomes and the cell cycle", "Mitosis", "Stem cells", "Growth and differentiation"]),
    subtopic("Transport in cells", ["Diffusion", "Osmosis", "Active transport", "Exchange surfaces and transport calculations"]),
  ]),
  unit("Organisation", [
    subtopic("Digestive system", ["Levels of organisation", "Digestive system", "Enzymes", "Food tests and enzyme practicals"]),
    subtopic("Circulatory system", ["Heart structure and function", "Blood vessels", "Blood components", "Coronary heart disease and treatments"]),
    subtopic("Plant organisation", ["Plant tissues", "Transpiration", "Translocation", "Factors affecting water uptake"]),
  ]),
  unit("Infection and response", [
    subtopic("Pathogens and disease", ["Communicable disease", "Viral diseases", "Bacterial diseases", "Fungal and protist diseases"]),
    subtopic("Defence and treatment", ["Human defence systems", "Vaccination", "Antibiotics and painkillers", "Drug discovery and development"]),
    subtopic("Monoclonal antibodies", ["Producing monoclonal antibodies", "Uses of monoclonal antibodies", "Plant disease detection", "Plant defence responses"]),
  ]),
  unit("Bioenergetics", [
    subtopic("Photosynthesis", ["Photosynthetic reaction", "Rate of photosynthesis", "Limiting factors", "Uses of glucose"]),
    subtopic("Respiration", ["Aerobic respiration", "Anaerobic respiration", "Response to exercise", "Metabolism"]),
  ]),
  unit("Homeostasis and response", [
    subtopic("Homeostasis", ["Principles of homeostasis", "Nervous system", "Reflexes", "Reaction time practical"]),
    subtopic("Hormonal coordination", ["Endocrine system", "Blood glucose control", "Diabetes", "Hormones in human reproduction"]),
    subtopic("Plant hormones", ["Auxins and tropisms", "Gibberellins and ethene", "Uses of plant hormones", "Plant growth practical"]),
  ]),
  unit("Inheritance, variation and evolution", [
    subtopic("Reproduction and genetics", ["Sexual and asexual reproduction", "Meiosis", "DNA and the genome", "Genetic inheritance"]),
    subtopic("Variation and evolution", ["Inherited disorders", "Variation", "Evolution by natural selection", "Selective breeding and genetic engineering"]),
    subtopic("Classification", ["Evidence for evolution", "Extinction", "Antibiotic-resistant bacteria", "Classification and evolutionary trees"]),
  ]),
  unit("Ecology", [
    subtopic("Communities", ["Communities and competition", "Abiotic factors", "Biotic factors", "Adaptations"]),
    subtopic("Ecosystems", ["Levels of organisation", "Material cycling", "Decomposition", "Biodiversity"]),
    subtopic("Human impacts", ["Waste management", "Land use and deforestation", "Global warming", "Maintaining biodiversity"]),
    subtopic("Food production", ["Trophic levels", "Biomass transfer", "Food security", "Farming and sustainable fisheries"]),
  ]),
]);

const gcseChemistry = course("aqa-gcse-chemistry-8462", "GCSE", "AQA", "Chemistry", "AQA GCSE Chemistry", "8462", [
  unit("Atomic structure and the periodic table", [subtopic("Atomic structure", ["Atoms, elements and compounds", "Mixtures and separation", "Development of the atomic model", "Subatomic particles and isotopes"]), subtopic("Periodic table", ["Electronic structure", "Development of the periodic table", "Group 1 alkali metals", "Group 7 halogens", "Group 0 noble gases", "Transition metals"])]),
  unit("Bonding, structure and properties", [subtopic("Bonding", ["Ionic bonding", "Covalent bonding", "Metallic bonding", "Bonding diagrams"]), subtopic("Structure and properties", ["States of matter", "Ionic structures", "Simple molecular substances", "Polymers", "Giant covalent structures", "Graphene and fullerenes", "Metals and alloys"])]),
  unit("Quantitative chemistry", [subtopic("Chemical calculations", ["Relative formula mass", "Conservation of mass", "Moles", "Reacting masses", "Limiting reactants", "Concentration", "Percentage yield", "Atom economy", "Gas volumes"])]),
  unit("Chemical changes", [subtopic("Reactivity", ["Metal reactivity series", "Extraction of metals", "Oxidation and reduction", "Reactions of acids", "Making salts"]), subtopic("Electrolysis", ["Electrolysis of molten compounds", "Electrolysis of aqueous solutions", "Half equations", "Electrolysis practical"])]),
  unit("Energy changes", [subtopic("Energetics", ["Exothermic and endothermic reactions", "Reaction profiles", "Bond energies", "Chemical cells and batteries", "Fuel cells"])]),
  unit("Rate and extent of chemical change", [subtopic("Rates", ["Measuring reaction rates", "Collision theory", "Concentration and pressure", "Temperature", "Surface area", "Catalysts"]), subtopic("Equilibrium", ["Reversible reactions", "Dynamic equilibrium", "Le Chatelier's principle", "Changing concentration, pressure and temperature"])]),
  unit("Organic chemistry", [subtopic("Carbon compounds", ["Crude oil and hydrocarbons", "Fractional distillation", "Alkanes", "Alkenes", "Cracking", "Alcohols", "Carboxylic acids", "Polymers"])]),
  unit("Chemical analysis", [subtopic("Identification", ["Pure substances and formulations", "Chromatography", "Gas tests", "Flame tests", "Metal hydroxide tests", "Testing for anions", "Instrumental methods"])]),
  unit("Chemistry of the atmosphere", [subtopic("Atmosphere", ["Evolution of the atmosphere", "Greenhouse gases", "Climate change", "Carbon footprint", "Atmospheric pollutants"])]),
  unit("Using resources", [subtopic("Resources and sustainability", ["Earth's resources", "Potable water", "Wastewater treatment", "Life-cycle assessment", "Reduce, reuse and recycle", "Corrosion", "Alloys and ceramics", "Haber process and fertilisers"])]),
]);

const gcsePhysics = course("aqa-gcse-physics-8463", "GCSE", "AQA", "Physics", "AQA GCSE Physics", "8463", [
  unit("Energy", [subtopic("Energy stores and transfers", ["Energy stores", "Energy transfers", "Kinetic energy", "Gravitational potential energy", "Elastic potential energy"]), subtopic("Energy systems", ["Specific heat capacity", "Power", "Efficiency", "Energy resources", "National and global energy choices"])]),
  unit("Electricity", [subtopic("Circuits", ["Charge and current", "Potential difference", "Resistance", "Ohm's law", "Series circuits", "Parallel circuits"]), subtopic("Electrical energy", ["Electrical power", "Energy transferred by appliances", "Mains electricity", "National Grid", "Static electricity"])]),
  unit("Particle model of matter", [subtopic("Matter", ["Density", "Changes of state", "Internal energy", "Specific latent heat", "Gas pressure and temperature"])]),
  unit("Atomic structure", [subtopic("Atoms and radiation", ["Atomic structure", "Isotopes", "Development of the atomic model", "Radioactive decay", "Half-life", "Uses and hazards of radiation", "Nuclear fission and fusion"])]),
  unit("Forces", [subtopic("Forces and motion", ["Scalar and vector quantities", "Contact and non-contact forces", "Weight and gravitational fields", "Resultant forces", "Work done", "Springs", "Moments"]), subtopic("Kinematics and dynamics", ["Distance and displacement", "Speed and velocity", "Acceleration", "Distance-time graphs", "Velocity-time graphs", "Newton's laws", "Stopping distance", "Momentum"])]),
  unit("Waves", [subtopic("Wave behaviour", ["Transverse and longitudinal waves", "Wave equation", "Reflection", "Refraction", "Sound and ultrasound"]), subtopic("Electromagnetic waves", ["EM spectrum", "Properties and uses", "Infrared radiation", "Black-body radiation", "Visible light and lenses"])]),
  unit("Magnetism and electromagnetism", [subtopic("Magnetic fields", ["Magnets and magnetic fields", "Electromagnets", "Motor effect", "Electric motors", "Generators", "Transformers"])]),
  unit("Space physics", [subtopic("Space", ["Solar system", "Life cycle of stars", "Orbital motion", "Red-shift", "Big Bang evidence"])]),
]);

function combinedScienceCourse(): Phase1Course {
  const selected = [
    ...gcseBiology.units.map((item) => ({ ...item, title: `Biology · ${item.title}` })),
    ...gcseChemistry.units.map((item) => ({ ...item, title: `Chemistry · ${item.title}` })),
    ...gcsePhysics.units.filter((item) => item.title !== "Space physics").map((item) => ({ ...item, title: `Physics · ${item.title}` })),
  ];
  return course("aqa-gcse-combined-science-8464", "GCSE", "AQA", "Science", "AQA GCSE Combined Science: Trilogy", "8464", selected);
}

const gcseMaths = course("aqa-gcse-maths-8300", "GCSE", "AQA", "Maths", "AQA GCSE Mathematics", "8300", [
  unit("Number", [subtopic("Number skills", ["Integers and place value", "Four operations", "Factors, multiples and primes", "Powers and roots", "Fractions", "Decimals", "Percentages", "Standard form", "Surds", "Bounds and estimation"])]),
  unit("Algebra", [subtopic("Expressions and equations", ["Algebraic notation", "Expanding and factorising", "Substitution", "Linear equations", "Simultaneous equations", "Quadratic equations", "Inequalities", "Sequences"]), subtopic("Graphs and functions", ["Coordinates", "Straight-line graphs", "Quadratic graphs", "Cubic and reciprocal graphs", "Real-life graphs", "Functions and iteration"])]),
  unit("Ratio, proportion and rates of change", [subtopic("Proportional reasoning", ["Ratio", "Direct proportion", "Inverse proportion", "Percentage change", "Compound measures", "Growth and decay", "Rates of change"])]),
  unit("Geometry and measures", [subtopic("Geometry", ["Angles", "Polygons", "Congruence and similarity", "Transformations", "Pythagoras", "Trigonometry", "Circle theorems", "Vectors", "Area and volume"])]),
  unit("Probability", [subtopic("Probability", ["Probability scale", "Combined events", "Tree diagrams", "Conditional probability", "Venn diagrams"])]),
  unit("Statistics", [subtopic("Statistics", ["Sampling", "Averages", "Charts and graphs", "Cumulative frequency", "Box plots", "Histograms", "Scatter graphs"])]),
]);

const alevelBiology = course("aqa-alevel-biology-7402", "A level", "AQA", "Biology", "AQA A-level Biology", "7402", [
  unit("Biological molecules", [subtopic("Core molecules", ["Monomers and polymers", "Carbohydrates", "Lipids", "Proteins", "Enzymes"]), subtopic("Nucleic acids and energy", ["DNA and RNA", "DNA replication", "ATP", "Water", "Inorganic ions"])]),
  unit("Cells", [subtopic("Cell biology", ["Cell structure", "Microscopy", "Cell fractionation", "Cell membranes", "Transport across membranes"]), subtopic("Immunity", ["Cell recognition", "Phagocytosis", "T cells", "B cells and antibodies", "Vaccination", "HIV and monoclonal antibodies"])]),
  unit("Organisms exchange substances with their environment", [subtopic("Exchange", ["Surface area to volume", "Gas exchange", "Digestion and absorption", "Mass transport in animals", "Haemoglobin", "Mass transport in plants"])]),
  unit("Genetic information, variation and relationships", [subtopic("Genetics", ["DNA, genes and chromosomes", "Protein synthesis", "Genetic diversity", "Meiosis", "Natural selection", "Species and taxonomy", "Biodiversity"])]),
  unit("Energy transfers in and between organisms", [subtopic("Energy", ["Photosynthesis", "Respiration", "Energy in ecosystems", "Nutrient cycles"])]),
  unit("Organisms respond to changes", [subtopic("Responses", ["Stimuli and responses", "Receptors", "Nervous coordination", "Muscles", "Homeostasis", "Blood glucose", "Osmoregulation"])]),
  unit("Genetics, populations, evolution and ecosystems", [subtopic("Population genetics", ["Inheritance", "Populations and Hardy-Weinberg", "Evolution", "Speciation", "Ecosystems", "Succession", "Population sampling"])]),
  unit("Control of gene expression", [subtopic("Gene control", ["Mutations", "Stem cells and gene expression", "Transcription factors", "Epigenetics", "Cancer", "Recombinant DNA technology", "DNA sequencing", "Genetic fingerprinting"])]),
]);

const alevelChemistry = course("aqa-alevel-chemistry-7405", "A level", "AQA", "Chemistry", "AQA A-level Chemistry", "7405", [
  unit("Physical chemistry", [subtopic("Foundations", ["Atomic structure", "Amount of substance", "Bonding", "Energetics", "Kinetics", "Equilibria and Kc", "Oxidation, reduction and redox equations"]), subtopic("A-level physical chemistry", ["Thermodynamics", "Rate equations", "Equilibrium constant Kp", "Electrode potentials and electrochemical cells", "Acids and bases"])]),
  unit("Inorganic chemistry", [subtopic("Periodicity and groups", ["Periodicity", "Group 2", "Group 7", "Properties of Period 3 elements and oxides"]), subtopic("Transition metals", ["Transition metal chemistry", "Complex ions", "Ligand substitution", "Redox titrations", "Reactions of ions in aqueous solution"])]),
  unit("Organic chemistry", [subtopic("Organic foundations", ["Nomenclature and isomerism", "Alkanes", "Halogenoalkanes", "Alkenes", "Alcohols", "Organic analysis"]), subtopic("A-level organic chemistry", ["Optical isomerism", "Aldehydes and ketones", "Carboxylic acids and derivatives", "Aromatic chemistry", "Amines", "Polymers", "Amino acids, proteins and DNA", "Organic synthesis", "NMR spectroscopy", "Chromatography"])]),
]);

const alevelPhysics = course("aqa-alevel-physics-7408", "A level", "AQA", "Physics", "AQA A-level Physics", "7408", [
  unit("Measurements and their errors", [subtopic("Measurement", ["SI units and prefixes", "Uncertainty and error", "Combining uncertainties", "Graphical methods and data analysis"])]),
  unit("Particles and radiation", [subtopic("Particles", ["Constituents of the atom", "Stable and unstable nuclei", "Particles and antiparticles", "Particle interactions", "Classification of particles", "Quarks and antiquarks", "Conservation laws"]), subtopic("Quantum phenomena", ["Photoelectric effect", "Wave-particle duality", "Electron diffraction", "Energy levels and spectra"])]),
  unit("Waves", [subtopic("Wave behaviour", ["Progressive waves", "Longitudinal and transverse waves", "Superposition and stationary waves", "Interference", "Diffraction", "Refraction and total internal reflection"])]),
  unit("Mechanics and materials", [subtopic("Mechanics", ["Scalars and vectors", "Moments", "Motion along a straight line", "Projectile motion", "Newton's laws", "Momentum", "Work, energy and power"]), subtopic("Materials", ["Bulk properties", "Density", "Hooke's law", "Stress and strain", "Young modulus"])]),
  unit("Electricity", [subtopic("Circuits", ["Current and charge", "Potential difference", "Resistance", "Resistivity", "Circuits and Kirchhoff's laws", "EMF and internal resistance", "Potential divider"])]),
  unit("Further mechanics and thermal physics", [subtopic("Further mechanics", ["Circular motion", "Simple harmonic motion", "Resonance"]), subtopic("Thermal physics", ["Thermal energy transfer", "Ideal gases", "Molecular kinetic theory"])]),
  unit("Fields and their consequences", [subtopic("Fields", ["Field concepts", "Gravitational fields", "Electric fields", "Gravitational potential", "Electric potential"]), subtopic("Capacitance and magnetism", ["Capacitance", "Charging and discharging", "Magnetic fields", "Moving charges in magnetic fields", "Electromagnetic induction", "Alternating currents", "Transformers"])]),
  unit("Nuclear physics", [subtopic("Nuclei", ["Rutherford scattering", "Nuclear radius", "Nuclear density", "Mass and energy", "Binding energy", "Fission", "Fusion"]), subtopic("Radioactive decay", ["Nuclear instability", "Decay modes", "Activity and decay constant", "Exponential decay", "Half-life", "Radioactive dating"])]),
  unit("Option: Astrophysics", [subtopic("Astrophysics", ["Telescopes", "Stellar classification", "Hertzsprung-Russell diagram", "Cosmology", "Exoplanets"])]),
  unit("Option: Medical physics", [subtopic("Medical physics", ["Physics of the eye", "Physics of the ear", "Biological measurement", "X-ray imaging", "Ultrasound imaging", "MRI"])]),
  unit("Option: Engineering physics", [subtopic("Engineering", ["Rotational dynamics", "Thermodynamics and engines", "Materials in engineering"])]),
  unit("Option: Turning points in physics", [subtopic("Turning points", ["Discovery of the electron", "Wave-particle duality", "Special relativity"])]),
  unit("Option: Electronics", [subtopic("Electronics", ["Discrete semiconductor devices", "Analogue and digital signals", "Operational amplifiers", "Digital electronics"])]),
]);

const alevelMaths = course("aqa-alevel-maths-7357", "A level", "AQA", "Maths", "AQA A-level Mathematics", "7357", [
  unit("Pure mathematics", [
    subtopic("Proof and algebra", ["Proof", "Algebraic manipulation", "Functions", "Coordinate geometry", "Sequences and series"]),
    subtopic("Trigonometry and calculus", ["Trigonometry", "Exponentials and logarithms", "Differentiation", "Integration", "Numerical methods", "Vectors"]),
  ]),
  unit("Statistics", [subtopic("Statistics", ["Statistical sampling", "Data presentation and interpretation", "Probability", "Statistical distributions", "Hypothesis testing"])]),
  unit("Mechanics", [subtopic("Mechanics", ["Quantities and units", "Kinematics", "Forces and Newton's laws", "Moments"])]),
]);

const legacyCourses: Phase1Course[] = [
  legacyCourse("ks3-english", "KS3", "English", "KS3 English", "KS3", () => true),
  legacyCourse("aqa-gcse-english-language-8700", "GCSE", "English", "AQA GCSE English Language", "8700", (name) => name.includes("English Language")),
  legacyCourse("aqa-gcse-english-literature-8702", "GCSE", "English", "AQA GCSE English Literature", "8702", (name) => name.includes("English Literature")),
  legacyCourse("aqa-alevel-english-language-7702", "A level", "English", "AQA A-level English Language", "7702", (name) => name.includes("English Language –") && !name.includes("Language & Literature")),
  legacyCourse("aqa-alevel-english-langlit-7707", "A level", "English", "AQA A-level English Language & Literature", "7707", (name) => name.includes("Language & Literature")),
  legacyCourse("aqa-alevel-english-literature-a-7712", "A level", "English", "AQA A-level English Literature A", "7712", (name) => name.includes("Literature A")),
  legacyCourse("aqa-alevel-english-literature-b-7717", "A level", "English", "AQA A-level English Literature B", "7717", (name) => name.includes("Literature B")),
  legacyCourse("ks3-geography", "KS3", "Geography", "KS3 Geography", "KS3", () => true),
  legacyCourse("aqa-gcse-geography-8035", "GCSE", "Geography", "AQA GCSE Geography", "8035", () => true),
  legacyCourse("aqa-alevel-geography-7037", "A level", "Geography", "AQA A-level Geography", "7037", () => true),
  legacyCourse("ks3-history", "KS3", "History", "KS3 History", "KS3", () => true),
  legacyCourse("aqa-gcse-history-8145", "GCSE", "History", "AQA GCSE History", "8145", () => true),
  legacyCourse("aqa-alevel-history-7042", "A level", "History", "AQA A-level History", "7042", () => true),
];

export const PHASE1_COURSES: Phase1Course[] = [
  ks3Biology, ks3Chemistry, ks3Physics, ks3Science, ks3Maths,
  gcseBiology, gcseChemistry, gcsePhysics, combinedScienceCourse(), gcseMaths,
  alevelBiology, alevelChemistry, alevelPhysics, alevelMaths,
  ...legacyCourses,
];

export const phase1Stages: Phase1Stage[] = ["KS3", "GCSE", "A level"];

export function getPhase1ExamBoards(stage: string): Phase1ExamBoard[] {
  return stage === "KS3" ? ["National curriculum"] : ["AQA"];
}

export function getPhase1Subjects(stage: string, examBoard: string): Phase1Subject[] {
  return [...new Set(PHASE1_COURSES.filter((item) => item.stage === stage && item.examBoard === examBoard).map((item) => item.subject))];
}

export function getPhase1Courses(stage: string, examBoard: string, subject: string): Phase1Course[] {
  return PHASE1_COURSES.filter((item) => item.stage === stage && item.examBoard === examBoard && item.subject === subject);
}

export function getPhase1Course(courseId: string): Phase1Course | undefined {
  return PHASE1_COURSES.find((item) => item.id === courseId);
}

export function getPhase1Units(courseId: string): Phase1Unit[] {
  return getPhase1Course(courseId)?.units || [];
}

export function getPhase1Subtopics(courseId: string, unitId: string): Phase1Subtopic[] {
  return getPhase1Units(courseId).find((item) => item.id === unitId)?.subtopics || [];
}

export function getPhase1Lessons(courseId: string, unitId: string, subtopicId: string): Phase1Lesson[] {
  return getPhase1Subtopics(courseId, unitId).find((item) => item.id === subtopicId)?.lessons || [];
}

export function getCourseLessonSequence(profile: ClassCurriculumProfile): SuggestedCurriculumLesson[] {
  const selected = getPhase1Course(profile.courseId);
  if (!selected) return [];
  const out: SuggestedCurriculumLesson[] = [];
  selected.units.forEach((curriculumUnit) => curriculumUnit.subtopics.forEach((curriculumSubtopic) => curriculumSubtopic.lessons.forEach((curriculumLesson) => {
    out.push({
      ...curriculumLesson,
      stage: selected.stage,
      examBoard: selected.examBoard,
      subject: selected.subject,
      courseId: selected.id,
      courseTitle: selected.title,
      unitId: curriculumUnit.id,
      unitTitle: curriculumUnit.title,
      subtopicId: curriculumSubtopic.id,
      subtopicTitle: curriculumSubtopic.title,
      sequencePosition: out.length,
    });
  })));
  return out;
}

export function getNextSuggestedLesson(profile: ClassCurriculumProfile, plannedTopics: string[]): SuggestedCurriculumLesson | undefined {
  const used = new Set(plannedTopics.map((item) => item.trim().toLowerCase()).filter(Boolean));
  return getCourseLessonSequence(profile).find((item) => !used.has(item.title.toLowerCase()));
}

export function inferPhase1Stage(className: string): Phase1Stage {
  const match = className.match(/(?:Y|Year\s*)(\d{1,2})/i);
  const year = match ? Number(match[1]) : 0;
  if (year >= 12) return "A level";
  if (year >= 10) return "GCSE";
  return "KS3";
}

export function normalisePhase1Subject(subject: string): Phase1Subject {
  const value = subject.toLowerCase();
  if (value.includes("biology")) return "Biology";
  if (value.includes("chemistry")) return "Chemistry";
  if (value.includes("physics")) return "Physics";
  if (value.includes("math")) return "Maths";
  if (value.includes("english") || value.includes("literature") || value.includes("language")) return "English";
  if (value.includes("geog")) return "Geography";
  if (value.includes("hist")) return "History";
  return "Science";
}

export function inferClassCurriculumProfile(className: string, lessonSubject: string): ClassCurriculumProfile {
  const stage = inferPhase1Stage(className);
  const examBoard: Phase1ExamBoard = stage === "KS3" ? "National curriculum" : "AQA";
  const subject = normalisePhase1Subject(lessonSubject || className);
  const choices = getPhase1Courses(stage, examBoard, subject);
  return { stage, examBoard, subject, courseId: choices[0]?.id || "" };
}

export function profileLabel(profile: ClassCurriculumProfile): string {
  const selected = getPhase1Course(profile.courseId);
  return selected ? `${selected.examBoard} · ${selected.title}${selected.code && selected.code !== "KS3" ? ` (${selected.code})` : ""}` : `${profile.examBoard} · ${profile.subject}`;
}
