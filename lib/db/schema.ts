import { pgTable, serial, text, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  careerPhase: varchar("career_phase", { length: 50 }), // slug e.g. early_career
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careerPhases = pgTable("career_phases", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
});

export const objectives = pgTable("objectives", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id")
    .notNull()
    .references(() => careerPhases.id),
  objectiveText: text("objective_text").notNull(),
  priority: integer("priority").notNull().default(1),
  category: varchar("category", { length: 50 }),
});

export const evidence = pgTable("evidence", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 20 }).notNull(), // project | credential | achievement
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  isShareable: boolean("is_shareable").default(false).notNull(),
  shareToken: varchar("share_token", { length: 64 }), // unique slug for public read
  credibilityScore: integer("credibility_score"), // 0-100
  skillTags: text("skill_tags"), // JSON array or comma-separated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  phaseId: integer("phase_id").references(() => careerPhases.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id),
  role: varchar("role", { length: 20 }).notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const githubIntegrations = pgTable("github_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  accessToken: text("access_token").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const evidenceCompilerDrafts = pgTable("evidence_compiler_drafts", {
  id: serial("id").primaryKey(),
  runId: varchar("run_id", { length: 255 }).notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  draftJson: text("draft_json").notNull(), // JSON: { repos: [{ name, analysis, narrative }], ... }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cvGenerations = pgTable("cv_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  targetRole: varchar("target_role", { length: 255 }).notNull(),
  targetCompany: varchar("target_company", { length: 255 }),
  structureJson: text("structure_json").notNull(), // deterministic structure
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companyResearch = pgTable("company_research", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  targetRole: varchar("target_role", { length: 255 }).notNull(),
  dataJson: text("data_json").notNull(), // deterministic aggregate
  briefingText: text("briefing_text"), // Claude synthesis
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviewPrepSessions = pgTable("interview_prep_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  roleType: varchar("role_type", { length: 50 }).notNull(),
  company: varchar("company", { length: 255 }),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  problemTemplateId: integer("problem_template_id").notNull(),
  problemStatement: text("problem_statement").notNull(),
  rubricJson: text("rubric_json").notNull(),
  solutionText: text("solution_text"),
  scoresJson: text("scores_json"),
  feedbackText: text("feedback_text"),
  status: varchar("status", { length: 20 }).default("awaiting_submission").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviewPrepProblems = pgTable("interview_prep_problems", {
  id: serial("id").primaryKey(),
  roleType: varchar("role_type", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  templateText: text("template_text").notNull(),
  rubricJson: text("rubric_json").notNull(),
});

export const userPhaseEvidence = pgTable("user_phase_evidence", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  phaseId: integer("phase_id")
    .notNull()
    .references(() => careerPhases.id),
  confidenceScore: integer("confidence_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
