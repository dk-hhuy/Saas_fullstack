enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

type Companion = {
  id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
  voice: string;
  style: string;
  author: string;
  is_public: boolean;
  system_prompt?: string | null;
  session_locale?: string;
  created_at?: string;
  average_rating?: number;
  rating_count?: number;
  marketplace_status?: MarketplaceStatus;
  featured?: boolean;
  tags?: string[];
  clone_count?: number;
};

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
  is_public?: boolean;
  system_prompt?: string | null;
  session_locale?: string;
}

interface UpdateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
  is_public?: boolean;
  system_prompt?: string | null;
  session_locale?: string;
}

type LibrarySortOption = "newest" | "popular" | "top_rated" | "most_cloned";

type LibraryFilterOption = "all" | "featured" | "marketplace" | "mine" | "saved";

type MarketplaceStatus = "none" | "pending" | "approved" | "rejected";

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string | string[];
  topic?: string | string[];
  filter?: LibraryFilterOption;
  sort?: LibrarySortOption;
  tag?: string;
}

interface SessionRecord {
  id: string;
  user_id: string;
  companion_id: string;
  transcript: SavedMessage[];
  duration_seconds?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
  summary?: string | null;
  quiz?: QuizQuestion[] | null;
  flashcards?: Flashcard[] | null;
  companion_name?: string | null;
  companion_topic?: string | null;
  companion_subject?: string | null;
  created_at: string;
}

interface SaveSessionPayload {
  companionId: string;
  transcript: SavedMessage[];
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  companionName?: string;
  companionTopic?: string;
  companionSubject?: string;
}

interface CompanionsLibraryResult {
  companions: Companion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserSessionsResult {
  sessions: SessionCompanion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Flashcard {
  front: string;
  back: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice?: string;
  style?: string;
  systemPrompt?: string | null;
  sessionLocale?: string;
  canStartSession?: boolean;
  ragContext?: string | null;
}

interface SessionCompanion extends Companion {
  sessionDate?: string;
  sessionId?: string;
  actualDuration?: number | null;
  companionUnavailable?: boolean;
}

interface SessionWithCompanion extends SessionRecord {
  companions: Companion | null;
}

interface CompanionDocument {
  id: string;
  companion_id: string;
  author?: string;
  file_name: string;
  storage_path?: string;
  page_count?: number | null;
  chunk_count?: number;
  status: "processing" | "ready" | "failed";
  error_message?: string | null;
  created_at: string;
}
