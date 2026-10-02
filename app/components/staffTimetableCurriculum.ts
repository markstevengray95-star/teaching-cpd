export type CurriculumStage = "KS3" | "GCSE" | "A level";
export type CurriculumSubject = "English" | "Geography" | "History";

export type CurriculumLessonTemplate = {
  title: string;
  vocabulary: string;
  objectives: string;
  sequence: string;
  assessment: string;
};

export type CurriculumUnitSpec = {
  stage: CurriculumStage;
  subject: CurriculumSubject;
  unit: string;
  lessons: CurriculumLessonTemplate[];
  note?: string;
};

const defaultSequence = "Retrieval starter → explicit teaching/model → guided practice → independent application → review/exit ticket";

function lesson(title: string, keywords = "", objective?: string): CurriculumLessonTemplate {
  return {
    title,
    vocabulary: keywords,
    objectives: objective || `Explain and apply the key ideas and skills for ${title}.`,
    sequence: defaultSequence,
    assessment: "Cold call / hinge question / short written response / exit ticket",
  };
}

function unit(stage: CurriculumStage, subject: CurriculumSubject, name: string, titles: string[], note?: string): CurriculumUnitSpec {
  return { stage, subject, unit: name, lessons: titles.map((title) => lesson(title)), note };
}

function literatureUnit(stage: CurriculumStage, name: string, focus: string[], note?: string): CurriculumUnitSpec {
  return unit(stage, "English", name, [
    "Context and first impressions",
    "Plot, structure and narrative development",
    "Characterisation and relationships",
    ...focus,
    "Language, form and structural methods",
    "Themes and writer's ideas",
    "Key moments and evidence selection",
    "Planning a thesis-led analytical response",
    "Comparative or whole-text connections",
    "Timed exam-style response and feedback",
  ], note);
}

function historyOption(stage: CurriculumStage, name: string, note?: string): CurriculumUnitSpec {
  return unit(stage, "History", name, [
    "Overview, chronology and key turning points",
    "Political authority, power and government",
    "Society, beliefs and everyday life",
    "Economic change and its consequences",
    "Key individuals, groups and institutions",
    "Conflict, challenge and responses",
    "Change, continuity and significance",
    "Causes and consequences across the period",
    "Using primary sources as evidence",
    "Evaluating historical interpretations",
    "Building an argument from evidence",
    "Synoptic review and exam-style practice",
  ], note);
}

const BANK: CurriculumUnitSpec[] = [
  // KS3 ENGLISH
  unit("KS3", "English", "Reading fiction", [
    "Inference and evidence", "Characterisation", "Setting and atmosphere", "Narrative viewpoint", "Language choices and imagery", "Structure and tension", "Themes and ideas", "Comparing fiction extracts", "Analytical paragraph writing", "Extended literary response",
  ]),
  unit("KS3", "English", "Reading non-fiction", [
    "Purpose, audience and form", "Retrieving explicit information", "Inference in non-fiction", "Language for viewpoint", "Rhetorical devices", "Structure and organisation", "Fact, opinion and bias", "Comparing viewpoints", "Evaluating effectiveness", "Synthesis across texts",
  ]),
  unit("KS3", "English", "Creative writing", [
    "Generating ideas and planning", "Opening with impact", "Description and sensory detail", "Figurative language", "Sentence variety", "Paragraphing for effect", "Building character", "Dialogue and voice", "Creating tension", "Editing for accuracy and effect",
  ]),
  unit("KS3", "English", "Transactional and persuasive writing", [
    "Audience, purpose and form", "Building a clear viewpoint", "Rhetorical devices", "Structuring an argument", "Using evidence and examples", "Counterargument", "Writing speeches", "Writing articles", "Letters and formal register", "Editing and proofreading",
  ]),
  unit("KS3", "English", "Poetry", [
    "Voice and speaker", "Imagery", "Sound and rhythm", "Form and structure", "Tone and mood", "Themes and messages", "Context and interpretation", "Comparing poems", "Analytical writing", "Unseen poetry approach",
  ]),
  unit("KS3", "English", "Drama and Shakespeare foundations", [
    "Drama conventions and stagecraft", "Reading dramatic dialogue", "Character and motivation", "Conflict and relationships", "Soliloquy and aside", "Shakespearean language strategies", "Themes and ideas", "Performance interpretation", "Evidence-led analysis", "Whole-play response",
  ]),
  unit("KS3", "English", "Spoken language", [
    "Speaking for different audiences", "Structuring a presentation", "Using evidence and examples", "Voice, pace and emphasis", "Listening and responding", "Discussion skills", "Questioning", "Persuasive speaking", "Formal presentation", "Reflection and feedback",
  ]),

  // GCSE ENGLISH LANGUAGE
  unit("GCSE", "English", "AQA English Language Paper 1 – Explorations in creative reading and writing", [
    "Paper 1 overview and reading strategy", "Retrieval from a fiction source", "Analysing language", "Analysing structure", "Critical evaluation", "Planning descriptive writing", "Crafting setting and atmosphere", "Narrative viewpoint and character", "Using structure for effect", "Sentence control and punctuation", "Editing for technical accuracy", "Timed Paper 1 practice and feedback",
  ], "AQA 8700 framework. Examination texts are unseen."),
  unit("GCSE", "English", "AQA English Language Paper 2 – Writers' viewpoints and perspectives", [
    "Paper 2 overview and reading strategy", "Selecting and synthesising information", "Analysing language in non-fiction", "Comparing viewpoints", "Comparing methods across texts", "Building a viewpoint for writing", "Audience, purpose and form", "Rhetorical devices and argument", "Structuring persuasive writing", "Tone and register", "Technical accuracy", "Timed Paper 2 practice and feedback",
  ], "AQA 8700 framework. Examination texts are unseen."),
  unit("GCSE", "English", "AQA English Language – Spoken language endorsement", [
    "Choosing a presentation topic", "Researching and selecting evidence", "Planning a clear argument", "Adapting language to audience", "Delivery, pace and emphasis", "Using notes effectively", "Responding to questions", "Formal presentation rehearsal", "Presentation and feedback",
  ]),

  // GCSE ENGLISH LITERATURE
  literatureUnit("GCSE", "AQA English Literature – Shakespeare", ["Shakespearean dramatic methods", "Character arcs", "Theme development across the play", "Extract-to-whole-text method"], "Choose the school's current AQA set play. Set-text choices can change by specification year."),
  literatureUnit("GCSE", "AQA English Literature – 19th-century novel", ["Narrative voice and viewpoint", "Setting and social context", "Character development", "Extract-to-whole-text method"], "Choose the school's current AQA set novel."),
  literatureUnit("GCSE", "AQA English Literature – Modern prose or drama", ["Modern dramatic/prose methods", "Social and historical ideas", "Character and relationships", "Whole-text essay planning"], "Choose the school's current AQA modern prose/drama text."),
  unit("GCSE", "English", "AQA English Literature – Poetry anthology", [
    "Anthology overview and comparison method", "Voice and perspective", "Imagery and symbolism", "Form", "Structure", "Tone", "Context used purposefully", "Comparing themes", "Comparing methods", "Planning comparison essays", "Timed anthology comparison", "Feedback and redrafting",
  ], "Select the anthology cluster taught by the school."),
  unit("GCSE", "English", "AQA English Literature – Unseen poetry", [
    "First reading and establishing meaning", "Speaker, voice and perspective", "Language analysis", "Imagery and symbolism", "Form and structure", "Tone and shifts", "Building an interpretation", "Comparing two unseen poems", "Planning under time pressure", "Timed unseen poetry practice",
  ]),

  // A LEVEL ENGLISH LANGUAGE
  unit("A level", "English", "AQA English Language – Textual variations and representations", [
    "Language levels and methods", "Mode and genre", "Audience, purpose and context", "Representation of people", "Representation of places", "Representation of events and ideas", "Discourse and pragmatics", "Grammar and syntax", "Lexis and semantics", "Comparing representations", "Analytical writing", "Paper 1 practice",
  ]),
  unit("A level", "English", "AQA English Language – Children's language development", [
    "Approaches to language acquisition", "Early phonological development", "Lexical development", "Grammar development", "Pragmatic development", "Interaction and caregiver speech", "Literacy development", "Spoken language data analysis", "Written language data analysis", "Evaluating theories", "Essay planning", "Exam practice",
  ]),
  unit("A level", "English", "AQA English Language – Language diversity and change", [
    "Language and region", "Language and social groups", "Occupation and communities", "Gender and identity", "Ethnicity and identity", "World Englishes", "Processes of language change", "Attitudes to language change", "Standardisation and prescriptivism", "Analysing diversity/change data", "Evaluating explanations", "Exam practice",
  ]),
  unit("A level", "English", "AQA English Language – Language discourses", [
    "What is a language discourse?", "Identifying viewpoints", "Representation of language issues", "Language and power in discourse", "Evaluating arguments", "Comparing discourse texts", "Critical language awareness", "Building a discursive response", "Exam-style analysis",
  ]),
  unit("A level", "English", "AQA English Language – Writing skills", [
    "Writing for audience", "Writing for purpose", "Genre conventions", "Register and style", "Transforming research into accessible writing", "Crafting an argument", "Commentary on linguistic choices", "Timed writing practice",
  ]),
  unit("A level", "English", "AQA English Language – Language investigation", [
    "Choosing a language investigation", "Framing a focused question", "Selecting linguistic methods", "Collecting ethical language data", "Sampling and variables", "Quantitative and qualitative analysis", "Presenting findings", "Interpreting patterns", "Evaluating limitations", "Writing conclusions", "Referencing and appendices", "Final review",
  ]),
  unit("A level", "English", "AQA English Language – Original writing", [
    "Choosing genre and audience", "Style models", "Planning original writing", "Lexical and grammatical choices", "Discourse structure", "Drafting", "Editing and redrafting", "Writing the commentary", "Linking commentary to style models", "Final portfolio review",
  ]),

  // A LEVEL ENGLISH LITERATURE A
  literatureUnit("A level", "AQA English Literature A – Love through the ages", ["Love across literary periods", "Shakespeare and dramatic methods", "Poetry comparison", "Prose comparison", "Unseen prose analysis", "Connecting texts through historicist reading"], "AQA 7712. Check whether the cohort follows the current or updated specification; updated optional texts apply for first exams in Summer 2027."),
  literatureUnit("A level", "AQA English Literature A – WW1 and its aftermath", ["Literary responses to conflict", "War, memory and trauma", "Gender and society", "Poetry/prose/drama connections", "Unseen contextual writing"], "Texts in shared contexts – Option A."),
  literatureUnit("A level", "AQA English Literature A – Modern times: literature from 1945 to the present day", ["Post-war social change", "Identity and society", "Power and politics", "Changing literary forms", "Poetry/prose/drama connections", "Unseen contextual writing"], "Texts in shared contexts – Option B."),
  unit("A level", "English", "AQA English Literature A – Independent critical study: texts across time", [
    "Choosing texts and a comparative focus", "Building a research question", "Historicist approaches", "Critical interpretations", "Research and note-making", "Planning a comparative argument", "Using primary texts effectively", "Integrating secondary criticism", "Drafting analytical sections", "Referencing", "Editing the investigation", "Final review",
  ]),

  // A LEVEL ENGLISH LANGUAGE & LITERATURE (AQA 7707)
  unit("A level", "English", "AQA English Language & Literature – Telling stories", [
    "Methods of language analysis for literary and non-literary texts", "Remembered places: representation of place", "Remembered places: viewpoint and perspective", "Remembered places: comparing representations", "Imagined worlds: point of view", "Imagined worlds: genre", "Imagined worlds: character and world-building", "Poetic voices: voice and identity", "Poetic voices: form and function", "Poetic voices: language and structure", "Connecting linguistic and literary methods", "Paper 1 synoptic practice",
  ], "AQA 7707. Set texts should be selected from the current specification for the cohort."),
  unit("A level", "English", "AQA English Language & Literature – Exploring conflict", [
    "Methods of language analysis in conflict texts", "Writing about society: individual and society", "Re-creative writing: transforming viewpoint", "Re-creative writing: voice and style", "Critical commentary: explaining language choices", "Critical commentary: evaluating effects", "Dramatic encounters: conflict in dialogue", "Dramatic encounters: character and power", "Dramatic encounters: stagecraft and discourse", "Comparing methods across literary and non-literary discourse", "Timed re-creative writing and commentary", "Paper 2 synoptic practice",
  ], "AQA 7707. Set texts should be selected from the current specification for the cohort."),
  unit("A level", "English", "AQA English Language & Literature – Making connections", [
    "Choosing a literary and non-literary connection", "Framing a focused investigation question", "Selecting a literary text", "Collecting appropriate non-literary material", "Methods of language analysis", "Comparative analytical framework", "Research and contextual reading", "Planning the investigation", "Analysing literary discourse", "Analysing non-literary discourse", "Making comparative connections", "Drafting and referencing", "Evaluation and final review",
  ], "AQA 7707 non-exam assessment. The investigation makes connections between literary and non-literary discourse."),

  // A LEVEL ENGLISH LITERATURE B (AQA 7717)
  literatureUnit("A level", "AQA English Literature B – Aspects of tragedy", ["Tragic genre conventions", "Tragic protagonist and conflict", "Suffering, reversal and recognition", "Tragic endings and audience response", "Unseen tragedy methods", "Connecting texts through genre"], "AQA 7717 Literary genres Option 1A. Check the current/2027 text list for the cohort."),
  literatureUnit("A level", "AQA English Literature B – Aspects of comedy", ["Comic genre conventions", "Comic character and relationships", "Misunderstanding, disorder and resolution", "Satire and social criticism", "Unseen comedy methods", "Connecting texts through genre"], "AQA 7717 Literary genres Option 1B. Check the current/2027 text list for the cohort."),
  literatureUnit("A level", "AQA English Literature B – Elements of crime writing", ["Crime-writing genre conventions", "Crime, transgression and morality", "Victims, investigators and criminals", "Setting, suspense and revelation", "Unseen crime-writing methods", "Connecting texts through genre"], "AQA 7717 Texts and genres Option 2A. Check the current/2027 text list for the cohort."),
  literatureUnit("A level", "AQA English Literature B – Elements of political and social protest writing", ["Protest-writing genre conventions", "Power and resistance", "Political systems and social structures", "Voice, ideology and representation", "Unseen protest-writing methods", "Connecting texts through genre"], "AQA 7717 Texts and genres Option 2B. Check the current/2027 text list for the cohort."),
  unit("A level", "English", "AQA English Literature B – Theory and independence", [
    "Introduction to literary theory", "Narrative theory and ways of reading", "Marxist approaches", "Feminist approaches", "Post-colonial approaches", "Eco-critical approaches", "Value and the literary canon", "Selecting independent texts", "Framing a comparative question", "Using critical material", "Planning the independent study", "Drafting and referencing", "Evaluating interpretations", "Final review",
  ], "AQA 7717 non-exam assessment. Use the specification's permitted approaches and current text requirements."),

  // KS3 GEOGRAPHY
  unit("KS3", "Geography", "Geographical skills and enquiry", [
    "Using atlases and coordinates", "Scale and distance", "Grid references", "Contours and relief", "Interpreting maps", "Graphs and geographical data", "GIS foundations", "Forming enquiry questions", "Collecting fieldwork data", "Presenting and evaluating findings",
  ]),
  unit("KS3", "Geography", "Weather and climate", [
    "Weather and climate", "Measuring weather", "Air pressure and winds", "Rainfall", "UK weather systems", "Microclimates", "Climate graphs", "Extreme weather", "Climate hazards", "Climate enquiry",
  ]),
  unit("KS3", "Geography", "Rivers and flooding", [
    "The drainage basin", "River processes", "Upper-course landforms", "Middle-course landforms", "Lower-course landforms", "Flood hydrographs", "Causes of flooding", "Flood management", "River fieldwork", "Decision-making exercise",
  ]),
  unit("KS3", "Geography", "Coasts", [
    "Waves and coastal processes", "Weathering and mass movement", "Erosional landforms", "Depositional landforms", "Longshore drift", "Coastal management", "Hard and soft engineering", "Coastal conflicts", "Coastal fieldwork", "Sustainable coastline decisions",
  ]),
  unit("KS3", "Geography", "Tectonic hazards", [
    "Earth structure", "Plate tectonics", "Plate boundaries", "Earthquakes", "Volcanoes", "Hazard impacts", "Development and vulnerability", "Monitoring and prediction", "Managing tectonic risk", "Hazard case-study review",
  ]),
  unit("KS3", "Geography", "Ecosystems and biomes", [
    "What is an ecosystem?", "Nutrient cycles and food webs", "Global biomes", "Tropical rainforests", "Rainforest adaptations", "Deforestation", "Hot deserts", "Desertification", "Sustainable ecosystem management", "Biome comparison",
  ]),
  unit("KS3", "Geography", "Population and migration", [
    "Population distribution", "Population change", "Population structures", "Population pyramids", "Migration push and pull factors", "International migration", "Internal migration", "Impacts of migration", "Population policy", "Population data enquiry",
  ]),
  unit("KS3", "Geography", "Urbanisation and development", [
    "Urbanisation", "Megacities", "Urban land use", "Urban opportunities", "Urban challenges", "Informal settlements", "Sustainable cities", "Development indicators", "Uneven development", "Changing quality of life",
  ]),
  unit("KS3", "Geography", "Climate change and sustainability", [
    "Evidence for climate change", "Natural climate drivers", "Human causes", "Impacts on people", "Impacts on ecosystems", "Mitigation", "Adaptation", "Energy choices", "Sustainable consumption", "Climate decision-making",
  ]),

  // GCSE GEOGRAPHY AQA
  unit("GCSE", "Geography", "AQA GCSE – The challenge of natural hazards", [
    "Natural hazards and risk", "Plate tectonics theory", "Tectonic hazards at different margins", "Primary and secondary effects", "Responses to tectonic hazards", "Comparing tectonic case studies", "Global atmospheric circulation", "Tropical storms", "Tropical storm case study", "UK weather hazards", "Extreme UK weather case study", "Evidence for climate change", "Causes of climate change", "Managing climate change", "Exam synthesis",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – The living world", [
    "Ecosystems and interdependence", "Small-scale UK ecosystem", "Global ecosystems", "Tropical rainforest characteristics", "Rainforest adaptations", "Deforestation causes", "Rainforest impacts", "Sustainable rainforest management", "Hot desert characteristics", "Desert opportunities and challenges", "Desertification", "Cold environments option overview", "Ecosystem exam practice",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – Physical landscapes in the UK: Coasts", [
    "UK physical landscapes", "Wave types and coastal processes", "Weathering and mass movement", "Erosional landforms", "Depositional landforms", "Coastal management strategies", "Managed retreat", "UK coastline case study", "Coastal fieldwork links", "Exam practice",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – Physical landscapes in the UK: Rivers", [
    "River profiles and drainage basins", "River erosion, transport and deposition", "Upper-course landforms", "Middle/lower-course landforms", "Flood risk", "Hydrographs", "Hard engineering", "Soft engineering", "UK river case study", "River fieldwork links", "Exam practice",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – Physical landscapes in the UK: Glacial landscapes", [
    "Ice and glacial processes", "Erosional glacial landforms", "Depositional glacial landforms", "Upland glacial landscapes", "Economic activities", "Conflicts in glaciated areas", "Management", "UK glacial landscape case study", "Exam practice",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – Urban issues and challenges", [
    "Global urbanisation", "Urban growth in lower-income/emerging economies", "City case study: opportunities", "City case study: challenges", "Planning and regeneration", "UK urban change", "UK city opportunities", "UK city challenges", "Urban regeneration", "Sustainable urban living", "Transport strategies", "Exam practice",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – The changing economic world", [
    "Global variations in development", "Measuring development", "Causes of uneven development", "Reducing the development gap", "Tourism and development", "Emerging-economy case study", "Economic change and quality of life", "The changing UK economy", "Post-industrial economy", "Transport and infrastructure", "Regional differences", "UK in the wider world", "Exam practice",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – The challenge of resource management", [
    "Global resource inequalities", "Food, water and energy in the UK", "Resource demand and sustainability", "Food option: global supply and demand", "Food option: increasing supply", "Water option: global supply and demand", "Water option: increasing supply", "Energy option: global supply and demand", "Energy option: increasing supply", "Sustainable resource futures", "Exam practice",
  ]),
  unit("GCSE", "Geography", "AQA GCSE – Geographical applications and fieldwork", [
    "Issue evaluation: reading the resource booklet", "Issue evaluation: identifying stakeholders", "Issue evaluation: weighing evidence", "Issue evaluation: decision making", "Physical fieldwork enquiry", "Human fieldwork enquiry", "Sampling methods", "Data presentation", "Data analysis", "Drawing conclusions", "Evaluating fieldwork", "Geographical skills exam practice",
  ]),

  // A LEVEL GEOGRAPHY AQA
  unit("A level", "Geography", "AQA A-level – Water and carbon cycles", [
    "Systems concepts and stores/flows", "Global water cycle", "Drainage basin hydrology", "Runoff variation", "Flood hydrographs", "Water balance", "Global carbon cycle", "Carbon stores and fluxes", "Links between water and carbon cycles", "Human impacts", "Feedback mechanisms", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Hot desert systems and landscapes", [
    "Desert systems", "Energy and water in deserts", "Weathering", "Mass movement", "Aeolian erosion", "Aeolian transport and deposition", "Desert landforms", "Changing desert environments", "Human activity", "Desertification", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Coastal systems and landscapes", [
    "Coasts as systems", "Sediment cells", "Marine processes", "Sub-aerial processes", "Coastal erosion landforms", "Coastal deposition landforms", "Sea-level change", "Coastal flooding", "Coastal management", "Shoreline management", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Glacial systems and landscapes", [
    "Glacial systems", "Glacial mass balance", "Ice movement", "Erosion", "Transportation and deposition", "Glacial erosional landforms", "Glacial depositional landforms", "Periglacial processes", "Quaternary climate change", "Human impacts", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Hazards", [
    "Hazard concepts and risk", "Plate tectonic theory", "Volcanic hazards", "Seismic hazards", "Storm hazards", "Wildfires", "Hazard perception", "Vulnerability and resilience", "Hazard management models", "Comparative case studies", "Synoptic hazard links", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Ecosystems under stress", [
    "Ecosystems and systems thinking", "Biodiversity", "Nutrient cycling", "Succession", "Biomes", "Tropical rainforest systems", "Marine ecosystems", "Human pressures", "Conservation strategies", "Sustainability", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Global systems and global governance", [
    "Globalisation processes", "Global flows", "Transnational corporations", "Global governance", "The global commons", "Antarctica", "Trade", "Unequal power relations", "Global environmental governance", "Critiques of globalisation", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Changing places", [
    "Place and sense of place", "Insider and outsider perspectives", "Endogenous factors", "Exogenous factors", "Representation of place", "Place identity", "Demographic change", "Economic change", "Rebranding and regeneration", "Local/distant place comparison", "Qualitative place methods", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Contemporary urban environments", [
    "Urbanisation and global patterns", "Urban form", "Suburbanisation and counter-urbanisation", "Urban climate", "Urban drainage", "Waste", "Social/economic inequality", "Urban regeneration", "Sustainable urban development", "Case-study comparison", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Population and the environment", [
    "Population dynamics", "Demographic transition", "Population and resources", "Environment and health", "Disease", "Food security", "Migration", "Population policies", "Environmental constraints", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Resource security", [
    "Resource concepts", "Global resource demand", "Energy security", "Water security", "Mineral security", "Geopolitics of resources", "Resource frontiers", "Sustainable resource management", "Circular economy", "Case-study synthesis", "Exam practice",
  ]),
  unit("A level", "Geography", "AQA A-level – Fieldwork and independent investigation", [
    "Developing a geographical question", "Literature/context review", "Choosing methods", "Sampling", "Risk and ethics", "Primary data collection", "Secondary data", "Presenting data", "Statistical analysis", "Qualitative analysis", "Conclusions", "Evaluation", "Referencing", "Final investigation review",
  ]),

  // KS3 HISTORY
  unit("KS3", "History", "Historical skills", [
    "Chronology", "Cause and consequence", "Change and continuity", "Similarity and difference", "Significance", "Using primary sources", "Provenance and utility", "Historical interpretations", "Building an evidence-based argument", "Extended historical writing",
  ]),
  unit("KS3", "History", "Medieval Britain", [
    "England before 1066", "Norman Conquest", "Battle of Hastings", "Norman control", "Castles", "Feudal system", "Medieval Church", "Life in medieval towns and villages", "Black Death", "Peasants' Revolt", "Medieval monarchy", "Review and historical interpretations",
  ]),
  unit("KS3", "History", "Tudors and Reformation", [
    "Tudor dynasty", "Henry VII", "Henry VIII and the Reformation", "Dissolution of the monasteries", "Edward VI", "Mary I", "Elizabeth I", "Religious settlement", "Mary, Queen of Scots", "Spanish Armada", "Tudor society", "Interpretations of Tudor rule",
  ]),
  unit("KS3", "History", "Stuart Britain and Civil War", [
    "James I and monarchy", "Charles I and Parliament", "Causes of Civil War", "Civil War experiences", "Cromwell and Parliament", "Execution of Charles I", "Commonwealth and Protectorate", "Restoration", "Great Plague", "Great Fire of London", "Glorious Revolution", "Change in monarchy and Parliament",
  ]),
  unit("KS3", "History", "Industrial Britain", [
    "Agricultural change", "Industrial Revolution", "Factories", "Urbanisation", "Living conditions", "Working conditions", "Child labour", "Transport revolution", "Public health", "Protest and reform", "Empire and industry", "Industrial change debate",
  ]),
  unit("KS3", "History", "Empire, slavery and migration", [
    "Early English/British empire", "Transatlantic slavery", "Experiences of enslaved people", "Abolition", "India and empire", "Africa and imperialism", "Resistance to empire", "Migration to Britain", "Windrush and post-war migration", "Legacy of empire", "Historical interpretations",
  ]),
  unit("KS3", "History", "First World War", [
    "Long-term causes", "Assassination and outbreak", "Recruitment", "Western Front", "Trench warfare", "Technology and weapons", "Home Front", "Empire and global war", "1918 and the end of war", "Treaty of Versailles", "Memory and interpretation",
  ]),
  unit("KS3", "History", "Inter-war Europe and Second World War", [
    "Post-war Europe", "Rise of dictatorships", "Nazi Germany", "Appeasement", "Outbreak of war", "War in Europe", "War in the Pacific", "Home Front", "The Holocaust", "D-Day and defeat of Germany", "Atomic bombs and the end of war", "Legacy of the conflict",
  ]),
  unit("KS3", "History", "Post-war world and civil rights", [
    "Origins of the Cold War", "Berlin crises", "Cuban Missile Crisis", "Decolonisation", "US civil rights movement", "Civil rights in Britain", "Women's rights", "End of the Cold War", "Globalisation and migration", "Historical significance review",
  ]),

  // GCSE HISTORY AQA – all current option routes represented
  historyOption("GCSE", "AQA GCSE Period study – America, 1840–1895: Expansion and consolidation"),
  historyOption("GCSE", "AQA GCSE Period study – Germany, 1890–1945: Democracy and dictatorship"),
  historyOption("GCSE", "AQA GCSE Period study – Russia, 1894–1945: Tsardom and communism"),
  historyOption("GCSE", "AQA GCSE Period study – America, 1920–1973: Opportunity and inequality"),
  historyOption("GCSE", "AQA GCSE Wider world depth – Conflict and tension: First World War, 1894–1918"),
  historyOption("GCSE", "AQA GCSE Wider world depth – Conflict and tension: The inter-war years, 1918–1939"),
  historyOption("GCSE", "AQA GCSE Wider world depth – Conflict and tension between East and West, 1945–1972"),
  historyOption("GCSE", "AQA GCSE Wider world depth – Conflict and tension in Asia, 1950–1975"),
  historyOption("GCSE", "AQA GCSE Wider world depth – Conflict and tension, 1990–2009"),
  historyOption("GCSE", "AQA GCSE Thematic study – Britain: Health and the people, c1000 to present day"),
  historyOption("GCSE", "AQA GCSE Thematic study – Britain: Power and the people, c1170 to present day"),
  historyOption("GCSE", "AQA GCSE Thematic study – Britain: Migration, empires and the people, c790 to present day"),
  historyOption("GCSE", "AQA GCSE British depth – Norman England, c1066–c1100", "Include the AQA historic environment specified for the examination year."),
  historyOption("GCSE", "AQA GCSE British depth – Medieval England: the reign of Edward I, 1272–1307", "Include the AQA historic environment specified for the examination year."),
  historyOption("GCSE", "AQA GCSE British depth – Elizabethan England, c1568–1603", "Include the AQA historic environment specified for the examination year."),
  historyOption("GCSE", "AQA GCSE British depth – Restoration England, 1660–1685", "Include the AQA historic environment specified for the examination year."),

  // A LEVEL HISTORY AQA – component 1 breadth options
  ...[
    "1A The Age of the Crusades, c1071–1204",
    "1B Spain in the Age of Discovery, 1469–1598",
    "1C The Tudors: England, 1485–1603",
    "1D Stuart Britain and the Crisis of Monarchy, 1603–1702",
    "1E Russia in the Age of Absolutism and Enlightenment, 1682–1796",
    "1F Industrialisation and the people: Britain, c1783–1885",
    "1G Challenge and transformation: Britain, c1851–1964",
    "1H Tsarist and Communist Russia, 1855–1964",
    "1J The British Empire, c1857–1967",
    "1K The making of a Superpower: USA, 1865–1975",
    "1L The quest for political stability: Germany, 1871–1991",
  ].map((name) => historyOption("A level", `AQA A-level History Breadth – ${name}`)),

  // A LEVEL HISTORY AQA – component 2 depth options
  ...[
    "2A Royal Authority and the Angevin Kings, 1154–1216",
    "2B The Wars of the Roses, 1450–1499",
    "2C The Reformation in Europe, c1500–1564",
    "2D Religious conflict and the Church in England, c1529–c1570",
    "2E The English Revolution, 1625–1660",
    "2F The Sun King: Louis XIV, France and Europe, 1643–1715",
    "2G The Birth of the USA, 1760–1801",
    "2H France in Revolution, 1774–1815",
    "2J America: A Nation Divided, c1845–1877",
    "2K International Relations and Global Conflict, c1890–1941",
    "2L Italy and Fascism, c1900–1945",
    "2M Wars and Welfare: Britain in Transition, 1906–1957",
    "2N Revolution and dictatorship: Russia, 1917–1953",
    "2O Democracy and Nazism: Germany, 1918–1945",
    "2P The Transformation of China, 1936–1997",
    "2Q The American Dream: reality and illusion, 1945–1980",
    "2R The Cold War, c1945–1991",
    "2S The Making of Modern Britain, 1951–2007",
    "2T The Crisis of Communism: The USSR and the Soviet Empire, 1953–2000",
  ].map((name) => historyOption("A level", `AQA A-level History Depth – ${name}`)),
  unit("A level", "History", "AQA A-level History – Historical investigation", [
    "Choosing a valid 100-year investigation focus", "Framing a historical question", "Building contextual knowledge", "Finding and evaluating primary evidence", "Finding and evaluating historical interpretations", "Planning an argument", "Using evidence analytically", "Comparing interpretations", "Drafting sections", "Referencing and bibliography", "Evaluation and conclusion", "Final review and submission checks",
  ], "The investigation must not duplicate the chosen Component 1 and Component 2 content."),
];

export const curriculumStages: CurriculumStage[] = ["KS3", "GCSE", "A level"];

export function getCurriculumSubjects(stage: string): CurriculumSubject[] {
  return [...new Set(BANK.filter((item) => item.stage === stage).map((item) => item.subject))];
}

export function getCurriculumUnits(stage: string, subject: string): CurriculumUnitSpec[] {
  return BANK.filter((item) => item.stage === stage && item.subject === subject);
}

export function getCurriculumLessons(stage: string, subject: string, unitName: string): CurriculumLessonTemplate[] {
  return BANK.find((item) => item.stage === stage && item.subject === subject && item.unit === unitName)?.lessons || [];
}

export function getCurriculumUnit(stage: string, subject: string, unitName: string): CurriculumUnitSpec | undefined {
  return BANK.find((item) => item.stage === stage && item.subject === subject && item.unit === unitName);
}

export function inferCurriculumStage(className: string): CurriculumStage {
  const match = className.match(/(?:Y|Year\s*)(\d{1,2})/i);
  const year = match ? Number(match[1]) : 0;
  if (year >= 12) return "A level";
  if (year >= 10) return "GCSE";
  return "KS3";
}

export function normaliseCurriculumSubject(subject: string): CurriculumSubject | "" {
  const value = subject.toLowerCase();
  if (value.includes("english") || value.includes("literature") || value.includes("language")) return "English";
  if (value.includes("geog")) return "Geography";
  if (value.includes("hist")) return "History";
  return "";
}

export function suggestedUnitForLesson(stage: string, subject: string, currentUnit: string): CurriculumUnitSpec | undefined {
  const units = getCurriculumUnits(stage, subject);
  return units.find((item) => item.unit === currentUnit) || units[0];
}
