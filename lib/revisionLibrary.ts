export type RevisionQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type CharacterProfile = {
  name: string;
  role: string;
  arc: string;
  evidence: string[];
  links: string[];
};

export type ThemeProfile = {
  name: string;
  summary: string;
  moments: string[];
};

export type LiteratureBook = {
  id: string;
  title: string;
  author: string;
  level: string;
  accent: string;
  description: string;
  textPath?: string;
  sourceUrl: string;
  rights: string;
  structureLabel: string;
  characters: CharacterProfile[];
  themes: ThemeProfile[];
  quotations: { text: string; speaker: string; location: string; analysis: string }[];
  examQuestions: string[];
  quiz: RevisionQuestion[];
  studySections?: { title: string; summary: string; keyMoments: string[] }[];
};

export type ScienceBook = {
  id: string;
  subject: "Biology" | "Chemistry" | "Physics";
  title: string;
  edition: string;
  level: string;
  description: string;
  bookUrl: string;
  prefaceUrl: string;
  licence: string;
  licenceNote: string;
  maps: { gcse: string; aLevel: string; chapters: string; url: string }[];
};

export const literatureBooks: LiteratureBook[] = [
  {
    id: "macbeth",
    title: "Macbeth",
    author: "William Shakespeare",
    level: "GCSE English Literature",
    accent: "#7c3aed",
    description: "The complete public-domain play, organised by act and scene, with connected character, theme, quotation and exam practice.",
    textPath: "/revision/books/macbeth.txt",
    sourceUrl: "https://www.gutenberg.org/ebooks/1533",
    rights: "Public-domain underlying work. Project Gutenberg eBook 1533 distribution terms retained in the source file.",
    structureLabel: "Acts and scenes",
    characters: [
      { name: "Macbeth", role: "Tragic protagonist and warrior", arc: "Celebrated soldier → tempted regicide → isolated tyrant → defiant defeat.", evidence: ["“brave Macbeth”", "“vaulting ambition”", "“I am in blood / Stepp’d in so far”"], links: ["Ambition", "Guilt", "Kingship", "The supernatural"] },
      { name: "Lady Macbeth", role: "Instigator, partner and casualty of guilt", arc: "Calls on cruelty, directs Duncan’s murder, then fragments under guilt and dies offstage.", evidence: ["“unsex me here”", "“A little water clears us of this deed”", "“Out, damned spot!”"], links: ["Gender", "Guilt", "Power", "Appearance and reality"] },
      { name: "Banquo", role: "Macbeth’s foil", arc: "Hears prophecy but resists acting immorally; his descendants threaten Macbeth’s imagined security.", evidence: ["“instruments of darkness”", "“royalty of nature”", "“Thou canst not say I did it”"], links: ["The supernatural", "Loyalty", "Legacy"] },
      { name: "Macduff", role: "Avenger and defender of Scotland", arc: "Distrusts Macbeth, loses his family, joins Malcolm and kills the tyrant.", evidence: ["“O horror, horror, horror!”", "“All my pretty ones?”", "“Turn, hell-hound, turn!”"], links: ["Justice", "Masculinity", "Patriotism", "Grief"] },
      { name: "The Witches", role: "Agents of temptation and equivocation", arc: "Plant possibilities, manipulate Macbeth with half-truths and expose his willingness to choose violence.", evidence: ["“Fair is foul”", "“All hail, Macbeth”", "“none of woman born”"], links: ["Fate and free will", "The supernatural", "Equivocation"] },
      { name: "Malcolm", role: "Rightful heir and restorative king", arc: "Flees after Duncan’s murder, tests Macduff, gathers support and restores legitimate rule.", evidence: ["“This tyrant”", "“Angels are bright still”", "“by the grace of Grace”"], links: ["Kingship", "Loyalty", "Order"] },
    ],
    themes: [
      { name: "Ambition", summary: "Shakespeare presents ambition as dangerous when it outruns moral restraint and legitimate order.", moments: ["1.3 prophecy", "1.7 Macbeth’s soliloquy", "3.4 banquet", "5.5 nihilistic reflection"] },
      { name: "Guilt", summary: "Guilt moves from immediate horror to hallucination, sleeplessness and psychological collapse.", moments: ["2.2 blood and sleep", "3.4 Banquo’s ghost", "5.1 sleepwalking"] },
      { name: "Kingship and tyranny", summary: "Duncan and Malcolm represent sacred, healing kingship; Macbeth turns Scotland into a fearful, diseased state.", moments: ["1.4 Duncan", "4.3 king-becoming graces", "5.2 Scotland’s sickness"] },
      { name: "The supernatural", summary: "Prophecy tempts rather than mechanically controls Macbeth, leaving responsibility for his choices intact.", moments: ["1.1 witches", "1.3 prophecies", "4.1 apparitions", "5.8 equivocation exposed"] },
      { name: "Gender and power", summary: "Characters repeatedly weaponise ideas of masculinity, while the play also shows tenderness and grief as human strengths.", moments: ["1.5 spirits", "1.7 Lady Macbeth’s challenge", "4.3 Macduff’s grief"] },
    ],
    quotations: [
      { text: "Stars, hide your fires; / Let not light see my black and deep desires.", speaker: "Macbeth", location: "Act 1, Scene 4", analysis: "The light/dark antithesis exposes concealed ambition before Lady Macbeth applies pressure." },
      { text: "Look like th’ innocent flower, / But be the serpent under’t.", speaker: "Lady Macbeth", location: "Act 1, Scene 5", analysis: "Biblical serpent imagery makes deception feel both strategic and morally corrupt." },
      { text: "Is this a dagger which I see before me?", speaker: "Macbeth", location: "Act 2, Scene 1", analysis: "The interrogative dramatises uncertainty; the vision may externalise desire, fear or supernatural influence." },
      { text: "Macbeth does murder sleep.", speaker: "Macbeth", location: "Act 2, Scene 2", analysis: "Personification makes the crime an attack on innocence, restoration and Macbeth’s own peace." },
      { text: "Out, damned spot! out, I say!", speaker: "Lady Macbeth", location: "Act 5, Scene 1", analysis: "The imagined blood reverses her earlier confidence that water could remove guilt." },
    ],
    examQuestions: [
      "Starting with Act 1, Scene 7, explore how Shakespeare presents ambition.",
      "Starting with Act 2, Scene 2, explore how Shakespeare presents guilt and its effects.",
      "Starting with Act 4, Scene 3, explore how Shakespeare presents ideas about kingship.",
      "How does Shakespeare use the supernatural to influence the audience’s view of Macbeth?",
      "Explore how Shakespeare presents masculinity through Macbeth, Lady Macbeth and Macduff.",
    ],
    quiz: [
      { question: "Which prophecy is announced in Act 1, Scene 3?", options: ["Macbeth will be Thane of Cawdor and king", "Banquo will immediately become king", "Macduff will murder Duncan", "Malcolm will flee to Norway"], answer: 0, explanation: "The witches greet Macbeth as Thane of Glamis, Thane of Cawdor and future king." },
      { question: "Why is Banquo an important foil to Macbeth?", options: ["He never hears a prophecy", "He hears prophecy but does not murder to force it", "He is Duncan’s eldest son", "He becomes king at the end"], answer: 1, explanation: "Banquo experiences temptation but responds with greater caution and moral restraint." },
      { question: "What does Lady Macbeth’s sleepwalking chiefly reveal?", options: ["Political confidence", "Her hidden guilt and fractured mind", "A plan to escape", "Supernatural powers"], answer: 1, explanation: "Her compulsive hand-washing and broken speech reveal guilt she once denied." },
      { question: "How is the prophecy about Birnam Wood fulfilled?", options: ["The forest moves by magic", "Soldiers carry cut branches as camouflage", "Macbeth dreams it", "A storm uproots the trees"], answer: 1, explanation: "Malcolm’s soldiers carry branches, making the wood appear to advance." },
    ],
  },
  {
    id: "romeo-and-juliet",
    title: "Romeo and Juliet",
    author: "William Shakespeare",
    level: "GCSE English Literature",
    accent: "#db2777",
    description: "The complete public-domain play with act-and-scene navigation, relationship profiles, themes, quotations and tragedy practice.",
    textPath: "/revision/books/romeo-and-juliet.txt",
    sourceUrl: "https://www.gutenberg.org/ebooks/1513",
    rights: "Public-domain underlying work. Project Gutenberg eBook 1513 distribution terms retained in the source file.",
    structureLabel: "Acts and scenes",
    characters: [
      { name: "Juliet", role: "Young tragic protagonist", arc: "Obedient daughter → decisive lover → isolated resistance → death beside Romeo.", evidence: ["“It is an honour that I dream not of”", "“My only love sprung from my only hate”", "“If all else fail, myself have power to die”"], links: ["Love", "Family conflict", "Youth", "Agency"] },
      { name: "Romeo", role: "Young tragic protagonist", arc: "Performs love-sickness, finds mutual love, kills Tybalt in anger and dies through haste and misinformation.", evidence: ["“O brawling love”", "“Juliet is the sun”", "“Then I defy you, stars!”"], links: ["Love", "Fate", "Masculinity", "Violence"] },
      { name: "Mercutio", role: "Romeo’s witty friend and dramatic catalyst", arc: "Mocks romantic convention, fights Tybalt and curses both houses as he dies.", evidence: ["Queen Mab speech", "“A plague o’ both your houses”", "“grave man”"], links: ["Masculinity", "Violence", "Fate", "Comedy"] },
      { name: "Tybalt", role: "Defender of Capulet honour", arc: "Turns inherited hatred into immediate violence and triggers the play’s fatal reversal.", evidence: ["“What, drawn, and talk of peace?”", "“I hate the word”", "“thou art a villain”"], links: ["Conflict", "Honour", "Masculinity"] },
      { name: "The Nurse", role: "Juliet’s carer and confidante", arc: "Enables the marriage but later advises Juliet to marry Paris, breaking their trust.", evidence: ["earthquake memory", "“Go, girl, seek happy nights”", "“Romeo’s a dishclout to him”"], links: ["Family", "Love", "Loyalty", "Comedy"] },
      { name: "Friar Lawrence", role: "Mentor whose plan fails", arc: "Hopes marriage will reconcile the families, then creates the potion plan and abandons Juliet in the tomb.", evidence: ["“Wisely and slow”", "“These violent delights have violent ends”", "“I dare no longer stay”"], links: ["Fate", "Responsibility", "Haste"] },
    ],
    themes: [
      { name: "Love", summary: "The play contrasts Petrarchan performance, sexual humour, parental arrangements and Romeo and Juliet’s mutual devotion.", moments: ["1.1 Rosaline", "1.5 shared sonnet", "2.2 balcony scene", "5.3 tomb"] },
      { name: "Conflict", summary: "Public violence grows from inherited identity and codes of masculine honour, invading private relationships.", moments: ["1.1 brawl", "3.1 deaths", "3.5 Capulet’s rage", "5.3 reconciliation"] },
      { name: "Fate and choice", summary: "Prologue and repeated omens frame the tragedy, but haste, secrecy and individual decisions produce its events.", moments: ["Prologue", "1.4 foreboding", "3.5 lark/nightingale", "5.1 failed message"] },
      { name: "Youth and age", summary: "Young people are constrained by adult conflict, yet their own speed and absolutism also contribute to disaster.", moments: ["1.3 marriage discussion", "2.3 Friar’s warning", "3.5 family rupture"] },
    ],
    quotations: [
      { text: "From forth the fatal loins of these two foes / A pair of star-cross’d lovers take their life.", speaker: "Chorus", location: "Prologue", analysis: "The oxymoronic union of love and hostile lineage makes the tragedy feel predetermined." },
      { text: "My only love sprung from my only hate!", speaker: "Juliet", location: "Act 1, Scene 5", analysis: "The balanced antithesis compresses the central conflict between individual love and inherited identity." },
      { text: "These violent delights have violent ends.", speaker: "Friar Lawrence", location: "Act 2, Scene 6", analysis: "Repetition links intensity to destruction and warns against the lovers’ speed." },
      { text: "A plague o’ both your houses!", speaker: "Mercutio", location: "Act 3, Scene 1", analysis: "Mercutio’s curse assigns responsibility to both families and marks the tonal turn into tragedy." },
      { text: "O happy dagger, / This is thy sheath.", speaker: "Juliet", location: "Act 5, Scene 3", analysis: "The paradox of “happy” death and the intimate metaphor unite love, violence and agency." },
    ],
    examQuestions: [
      "Starting with Act 1, Scene 5, explore how Shakespeare presents love and conflict.",
      "Starting with Act 3, Scene 1, explore how Shakespeare presents masculine honour and violence.",
      "How does Shakespeare present Juliet as a character who changes?",
      "Explore the importance of fate and personal choice in the tragedy.",
    ],
    quiz: [
      { question: "What form shapes Romeo and Juliet’s first shared speech?", options: ["A sonnet", "A ballad", "A soliloquy", "A prose letter"], answer: 0, explanation: "Their dialogue forms a shared sonnet, presenting cooperation and harmony." },
      { question: "Which event is the play’s major turning point?", options: ["The opening brawl", "Mercutio and Tybalt’s deaths", "The Capulet ball", "Paris visiting the tomb"], answer: 1, explanation: "Act 3, Scene 1 changes the play from romantic comedy toward irreversible tragedy." },
      { question: "Why does Romeo miss Friar Lawrence’s message?", options: ["The letter is burned", "Friar John is quarantined", "The Nurse steals it", "Benvolio hides it"], answer: 1, explanation: "Friar John cannot deliver the letter because of a plague-related quarantine." },
      { question: "What finally ends the feud?", options: ["The Prince leaves Verona", "The lovers’ deaths expose its cost", "Tybalt apologises", "Friar Lawrence becomes ruler"], answer: 1, explanation: "The families reconcile only after seeing the fatal consequence of their hatred." },
    ],
  },
  {
    id: "a-christmas-carol",
    title: "A Christmas Carol",
    author: "Charles Dickens",
    level: "GCSE English Literature",
    accent: "#047857",
    description: "The complete public-domain novella, divided into its five staves, with character arcs, social themes, quotation analysis and exam practice.",
    textPath: "/revision/books/a-christmas-carol.txt",
    sourceUrl: "https://www.gutenberg.org/ebooks/46",
    rights: "Public-domain underlying work. Project Gutenberg eBook 46 distribution terms retained in the source file.",
    structureLabel: "Five staves",
    characters: [
      { name: "Ebenezer Scrooge", role: "Miser who undergoes moral transformation", arc: "Isolated and contemptuous → confronted by memory and suffering → terrified by consequences → generous participant in society.", evidence: ["“solitary as an oyster”", "“Are there no prisons?”", "“I am as light as a feather”"], links: ["Redemption", "Isolation", "Responsibility", "Christmas"] },
      { name: "Bob Cratchit", role: "Underpaid clerk and devoted father", arc: "Endures Scrooge’s exploitation while preserving warmth, gratitude and family unity.", evidence: ["“little, little salary”", "toasts Scrooge", "“my little child!”"], links: ["Poverty", "Family", "Compassion"] },
      { name: "Tiny Tim", role: "Vulnerable child and moral symbol", arc: "His possible death makes social neglect personal; transformed Scrooge becomes a second father to him.", evidence: ["“God bless us every one!”", "“patient and mild”", "empty stool vision"], links: ["Childhood", "Poverty", "Responsibility"] },
      { name: "Jacob Marley", role: "Warning figure and catalyst", arc: "Returns burdened by the chain he forged and gives Scrooge a chance to avoid the same fate.", evidence: ["“I wear the chain I forged in life”", "“Mankind was my business”"], links: ["Consequences", "Responsibility", "The supernatural"] },
      { name: "The Spirits", role: "Teachers through memory, empathy and fear", arc: "Past restores emotional memory, Present expands social vision, Yet to Come confronts consequences.", evidence: ["light from Past", "abundance of Present", "silence of Yet to Come"], links: ["Time", "Memory", "Redemption", "Social responsibility"] },
      { name: "Fred", role: "Scrooge’s generous nephew", arc: "Offers belonging without bitterness and models the social, forgiving Christmas Scrooge rejects then joins.", evidence: ["“a kind, forgiving, charitable, pleasant time”", "keeps inviting Scrooge"], links: ["Family", "Christmas", "Forgiveness"] },
    ],
    themes: [
      { name: "Redemption", summary: "Dickens makes change demanding but possible: Scrooge must see, feel, admit and then act differently.", moments: ["Marley’s warning", "Fezziwig and Belle", "Ignorance and Want", "Christmas morning"] },
      { name: "Social responsibility", summary: "The novella attacks indifference to poverty and insists that human welfare is everyone’s business.", moments: ["charity collectors", "Cratchit home", "miners and lighthouse", "Ignorance and Want"] },
      { name: "Family and belonging", summary: "Warmth comes from mutual care rather than wealth; isolation is Scrooge’s chosen punishment.", moments: ["Fred’s party", "Fezziwig", "Cratchit Christmas", "final dinner"] },
      { name: "Christmas", summary: "Christmas becomes a moral practice of generosity, memory, hospitality and connection rather than decoration alone.", moments: ["Fred’s speech", "Present’s journey", "Scrooge’s transformed behaviour"] },
    ],
    quotations: [
      { text: "Hard and sharp as flint, from which no steel had ever struck out generous fire.", speaker: "Narrator", location: "Stave I", analysis: "The simile presents hardness but also preserves the possibility that generosity can be struck into life." },
      { text: "Mankind was my business.", speaker: "Marley", location: "Stave I", analysis: "The blunt declarative corrects a narrow view of business and states Dickens’s social ethic." },
      { text: "Another idol has displaced me … a golden one.", speaker: "Belle", location: "Stave II", analysis: "Religious imagery makes money a false god that has replaced human love." },
      { text: "This boy is Ignorance. This girl is Want. Beware them both.", speaker: "Ghost of Christmas Present", location: "Stave III", analysis: "Allegorical children embody society’s neglected problems and turn political abstraction into vulnerable bodies." },
      { text: "I will honour Christmas in my heart, and try to keep it all the year.", speaker: "Scrooge", location: "Stave IV", analysis: "The future-tense promise makes redemption an ongoing practice rather than one emotional morning." },
    ],
    examQuestions: [
      "Starting with Stave I, explore how Dickens presents Scrooge as isolated from society.",
      "Starting with the Cratchits’ Christmas, explore how Dickens presents family and happiness.",
      "How does Dickens use the spirits to bring about Scrooge’s redemption?",
      "Explore how Dickens presents social responsibility and attitudes to poverty.",
    ],
    quiz: [
      { question: "Why is Scrooge compared with an oyster?", options: ["He lives by the sea", "He is closed and solitary but may contain hidden value", "He enjoys expensive food", "He is physically weak"], answer: 1, explanation: "The image stresses his hard enclosure while hinting that something valuable can still be uncovered." },
      { question: "What does Marley’s chain represent?", options: ["His former job", "Consequences created by selfish choices", "Scrooge’s inheritance", "A prison sentence"], answer: 1, explanation: "Marley forged the chain through his conduct in life; it materialises moral consequence." },
      { question: "Which spirit reveals Ignorance and Want?", options: ["Marley", "Christmas Past", "Christmas Present", "Christmas Yet to Come"], answer: 2, explanation: "The Ghost of Christmas Present reveals the two allegorical children beneath his robe." },
      { question: "How is Scrooge’s change proved at the end?", options: ["Only through a speech", "Through sustained generous actions and relationships", "By leaving London", "By becoming poorer"], answer: 1, explanation: "He gives, raises Bob’s salary, supports Tiny Tim and participates in family and community." },
    ],
  },
  {
    id: "an-inspector-calls",
    title: "An Inspector Calls",
    author: "J. B. Priestley",
    level: "GCSE English Literature",
    accent: "#b45309",
    description: "A copyright-safe study companion with original act summaries, character profiles, themes, brief quotation prompts and exam practice. The full play is not reproduced.",
    sourceUrl: "https://jbpriestley.co.uk/work/an-inspector-calls/",
    rights: "Copyrighted work. J. B. Priestley died in 1984; this app provides original study material, not the full text.",
    structureLabel: "Three-act study guide",
    characters: [
      { name: "Inspector Goole", role: "Moral interrogator and structural catalyst", arc: "Controls the evening, connects each action to Eva’s life and delivers the play’s collective warning.", evidence: ["one person and one line of enquiry", "fire and blood and anguish", "final telephone call"], links: ["Responsibility", "Socialism", "Judgement", "Generational conflict"] },
      { name: "Arthur Birling", role: "Capitalist patriarch and dramatic target", arc: "Begins with confident predictions, is exposed as selfish and exploitative, and ends concerned mainly with scandal.", evidence: ["unsinkable Titanic claim", "lower costs and higher prices", "public scandal fears"], links: ["Capitalism", "Dramatic irony", "Class", "Responsibility"] },
      { name: "Sheila Birling", role: "Character capable of change", arc: "Moves from sheltered excitement to remorse, insight and resistance to her parents’ denial.", evidence: ["accepts responsibility", "recognises the Inspector’s method", "rejects the ring at that moment"], links: ["Change", "Gender", "Generation", "Responsibility"] },
      { name: "Eric Birling", role: "Troubled younger generation", arc: "His exploitation and theft are exposed; unlike his parents, he accepts lasting moral responsibility.", evidence: ["uneasy stage directions", "stolen money", "final anger at parents"], links: ["Gender", "Power", "Alcohol", "Responsibility"] },
      { name: "Sybil Birling", role: "Gatekeeper of class prejudice", arc: "Uses charity authority to refuse Eva, condemns the unknown father, then learns that father is Eric.", evidence: ["prejudiced assumptions", "refusal of aid", "insistence she did nothing wrong"], links: ["Class", "Hypocrisy", "Gender", "Responsibility"] },
      { name: "Gerald Croft", role: "Privileged intermediary", arc: "Temporarily rescues and exploits Daisy Renton, shows some feeling, then searches for a way to dismiss the lesson.", evidence: ["Palace bar encounter", "kept mistress arrangement", "returns with hoax theory"], links: ["Class", "Gender", "Power", "Responsibility"] },
      { name: "Eva Smith / Daisy Renton", role: "Absent centre of the play", arc: "Never appears, so the audience reconstructs how institutions and individuals restrict a working-class woman’s choices.", evidence: ["factory dismissal", "shop dismissal", "relationship with Gerald", "charity refusal"], links: ["Class", "Gender", "Exploitation", "Collective responsibility"] },
    ],
    themes: [
      { name: "Responsibility", summary: "Priestley contrasts collective responsibility with the older Birlings’ narrow concern for legal blame and reputation.", moments: ["factory strike", "Sheila’s remorse", "Inspector’s final speech", "final phone call"] },
      { name: "Class and capitalism", summary: "Economic power allows comfortable characters to treat Eva as cheap labour, a nuisance or a case to judge.", moments: ["Birling’s speech", "factory dismissal", "Milwards", "charity committee"] },
      { name: "Gender and power", summary: "Eva’s vulnerability is intensified by men’s sexual and economic power and by Sybil’s policing of respectability.", moments: ["shop complaint", "Gerald and Daisy", "Eric’s coercion", "charity refusal"] },
      { name: "Generational conflict", summary: "Sheila and Eric can change; Arthur and Sybil repeatedly convert a moral test into a question of exposure.", moments: ["Sheila’s warnings", "Eric’s return", "hoax debate", "final call"] },
    ],
    quotations: [
      { text: "We are members of one body.", speaker: "Inspector", location: "Act 3", analysis: "The collective metaphor rejects individualism and makes social connection a moral fact." },
      { text: "Girls of that class—", speaker: "Mrs Birling", location: "Act 2", analysis: "The unfinished generalisation reveals automatic prejudice and dehumanising categorisation." },
      { text: "These girls aren’t cheap labour—they’re people.", speaker: "Sheila", location: "Act 1", analysis: "The correction challenges the language of economics by restoring human identity." },
      { text: "The famous younger generation who know it all.", speaker: "Mr Birling", location: "Act 3", analysis: "His sarcasm is undercut because the younger characters have understood the moral test more clearly." },
    ],
    examQuestions: [
      "How does Priestley present responsibility through the Inspector and the Birling family?",
      "Explore how Sheila changes and why her change matters to the play’s message.",
      "How does Priestley use dramatic irony to shape the audience’s view of Mr Birling?",
      "Explore how class and gender affect Eva Smith’s choices.",
    ],
    quiz: [
      { question: "Why are Mr Birling’s early predictions important?", options: ["They prove his expertise", "Dramatic irony undermines his authority", "They explain the Inspector’s identity", "They reveal Eva survived"], answer: 1, explanation: "The original audience knows his confident claims about the Titanic and war are wrong." },
      { question: "Who changes most clearly during the investigation?", options: ["Arthur and Sybil", "Sheila and Eric", "Edna and Gerald", "Gerald and Arthur"], answer: 1, explanation: "Sheila and Eric accept responsibility and keep the lesson even when the visit may have been a hoax." },
      { question: "What does the final telephone call do?", options: ["Confirms the family can forget", "Restarts the moral test and creates a cyclical ending", "Proves Gerald was the Inspector", "Ends the engagement happily"], answer: 1, explanation: "The call announces a real inspector is coming, returning the family to the start of an investigation." },
      { question: "Why is Eva absent from the stage?", options: ["She is unimportant", "Her absence makes others’ competing constructions of her visible", "The play has no female characters", "She narrates from backstage"], answer: 1, explanation: "The audience must reconstruct her life through the people whose power affected her." },
    ],
    studySections: [
      { title: "Act 1 — confidence interrupted", summary: "The Birlings celebrate Sheila and Gerald’s engagement. Arthur Birling delivers complacent speeches about business and individualism before Inspector Goole announces Eva Smith’s death. Birling’s factory dismissal and Sheila’s complaint at Milwards establish a chain of power used against a working-class woman.", keyMoments: ["Dramatic irony in Birling’s predictions", "Inspector’s entrance and control of information", "Sheila’s immediate remorse", "Eva changes her name to Daisy Renton"] },
      { title: "Act 2 — respectability exposed", summary: "Gerald’s relationship with Daisy and Mrs Birling’s refusal of charity deepen the investigation. The comfortable language of rescue and respectability is tested against unequal power. Mrs Birling condemns the child’s father without knowing that the Inspector is leading the family toward Eric.", keyMoments: ["Gerald’s mixture of care and exploitation", "Sheila recognises the Inspector’s method", "Mrs Birling’s class prejudice", "The trap involving the unborn child’s father"] },
      { title: "Act 3 — judgement, denial and return", summary: "Eric’s actions and theft complete the chain. The Inspector delivers his warning about collective responsibility. After he leaves, Gerald and the older Birlings try to prove the evening was a hoax, while Sheila and Eric insist that the moral truth remains. The final telephone call announces that an inspector is on the way.", keyMoments: ["Eric’s confession", "The Inspector’s final speech", "Generational division after the visit", "Cyclical ending and second chance"] },
    ],
  },
];

export const scienceBooks: ScienceBook[] = [
  {
    id: "open-biology",
    subject: "Biology",
    title: "Biology",
    edition: "OpenStax full online textbook",
    level: "GCSE foundations → A-level depth",
    description: "A complete, professionally reviewed biology text. Use the exam map below to move from specification wording to the relevant full chapters.",
    bookUrl: "https://openstax.org/books/biology/pages/1-introduction",
    prefaceUrl: "https://openstax.org/books/biology/pages/preface",
    licence: "Openly licensed by OpenStax (see the live preface for current reuse terms)",
    licenceNote: "Linked from the official source; the app does not copy or rebrand OpenStax content.",
    maps: [
      { gcse: "Cell biology", aLevel: "Cell structure, membranes and transport", chapters: "Chapters 4–5", url: "https://openstax.org/books/biology/pages/4-introduction" },
      { gcse: "Organisation and bioenergetics", aLevel: "Enzymes, respiration and photosynthesis", chapters: "Chapters 6–8", url: "https://openstax.org/books/biology/pages/6-introduction" },
      { gcse: "Inheritance and variation", aLevel: "DNA, gene expression and genetics", chapters: "Chapters 14–17", url: "https://openstax.org/books/biology/pages/14-introduction" },
      { gcse: "Ecology", aLevel: "Populations, ecosystems and biodiversity", chapters: "Chapters 44–47", url: "https://openstax.org/books/biology/pages/44-introduction" },
    ],
  },
  {
    id: "open-chemistry",
    subject: "Chemistry",
    title: "Chemistry",
    edition: "OpenStax full online textbook",
    level: "GCSE foundations → A-level depth",
    description: "A complete general chemistry book with worked examples and practice. The map prioritises chapters most useful for UK exam courses.",
    bookUrl: "https://openstax.org/books/chemistry/pages/1-introduction",
    prefaceUrl: "https://openstax.org/books/chemistry/pages/preface",
    licence: "Creative Commons Attribution 4.0 source edition",
    licenceNote: "Linked from the official source with attribution; check the live preface before redistributing or adapting content.",
    maps: [
      { gcse: "Atomic structure and the periodic table", aLevel: "Atomic structure, amount of substance and periodicity", chapters: "Chapters 2–3 and 6", url: "https://openstax.org/books/chemistry/pages/2-introduction" },
      { gcse: "Bonding and properties", aLevel: "Bonding, shapes and intermolecular forces", chapters: "Chapters 7–10", url: "https://openstax.org/books/chemistry/pages/7-introduction" },
      { gcse: "Quantitative chemistry", aLevel: "Moles, equilibria and energetics", chapters: "Chapters 4, 13 and 16", url: "https://openstax.org/books/chemistry/pages/4-introduction" },
      { gcse: "Organic chemistry", aLevel: "Mechanisms, functional groups and analysis", chapters: "Chapter 20 plus mapped extensions", url: "https://openstax.org/books/chemistry/pages/20-introduction" },
    ],
  },
  {
    id: "open-physics",
    subject: "Physics",
    title: "Physics",
    edition: "OpenStax full online textbook",
    level: "GCSE foundations → A-level depth",
    description: "A complete algebra-based physics text. Topic links support selective reading instead of forcing students through university-order chapters.",
    bookUrl: "https://openstax.org/books/physics/pages/1-introduction",
    prefaceUrl: "https://openstax.org/books/physics/pages/preface",
    licence: "Creative Commons Attribution 4.0 source edition",
    licenceNote: "Linked from the official source with attribution; check the live preface before redistributing or adapting content.",
    maps: [
      { gcse: "Forces and motion", aLevel: "Mechanics and materials", chapters: "Chapters 2–6 and 9", url: "https://openstax.org/books/physics/pages/2-introduction" },
      { gcse: "Energy", aLevel: "Work, energy, power and thermal physics", chapters: "Chapters 7 and 11–13", url: "https://openstax.org/books/physics/pages/7-introduction" },
      { gcse: "Waves", aLevel: "Waves, superposition and optics", chapters: "Chapters 14–17", url: "https://openstax.org/books/physics/pages/14-introduction" },
      { gcse: "Electricity and magnetism", aLevel: "Fields, circuits, capacitance and electromagnetism", chapters: "Chapters 18–22", url: "https://openstax.org/books/physics/pages/18-introduction" },
      { gcse: "Atomic physics", aLevel: "Particles, quantum and nuclear physics", chapters: "Chapters 29–33", url: "https://openstax.org/books/physics/pages/29-introduction" },
    ],
  },
];
