
export interface OriginalWord {
  word: string;
  original: string; // The Greek or Hebrew characters
  transliteration: string;
  language: 'Hebrew' | 'Greek' | 'Aramaic';
  definition: string;
  usage: string;
}

export interface InterlinearWord {
  original: string;
  transliteration: string;
  english: string;
  partOfSpeech: string; // e.g., Noun, Verb
}

export interface InterlinearData {
  reference: string;
  language: 'Hebrew' | 'Greek' | 'Aramaic';
  words: InterlinearWord[];
}

export interface BookStats {
  book: string;
  count: number; // Frequency/Occurrence count
}

export interface ScriptureReference {
  reference: string;
  text: string;
}

export interface MapLocation {
  title: string;
  uri: string;
}

export interface LocationImage {
  name: string;
  imageUrl: string;
}

export interface ExternalResource {
  title: string;
  uri: string;
  siteTitle: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Commentary {
  source: string; // e.g. "Rashi", "Matthew Henry"
  text: string;
  tradition: 'Jewish' | 'Christian' | 'Historical';
}

export interface StudyContent {
  literalAnswer: string; // Detailed breakdown
  keyTerms?: KeyTerm[]; 
  searchTopic: string; 
  geographicalAnchor: {
    location: string; 
    region: string;   
  };
  interlinear?: InterlinearData;
  scriptureReferences: ScriptureReference[];
  historicalContext: string;
  originalLanguageAnalysis: OriginalWord[];
  theologicalInsight: string;
  commentarySynthesis: Commentary[]; 
  biblicalBookFrequency: BookStats[];
}

export interface StudyResponse {
  isRelevant: boolean;
  refusalMessage?: string;
  content?: StudyContent;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
