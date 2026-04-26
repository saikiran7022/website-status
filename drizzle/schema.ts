import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  json,
  serial,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const membershipRoleEnum = pgEnum("role", ["admin", "editor", "viewer"]);
export const monitorTypeEnum = pgEnum("monitor_type", [
  "http",
  "https",
  "tcp",
  "ping",
  "dns",
]);
export const incidentStatusEnum = pgEnum("incident_status", [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]);
export const incidentSeverityEnum = pgEnum("incident_severity", [
  "critical",
  "major",
  "minor",
  "maintenance",
]);
export const alertTypeEnum = pgEnum("alert_type", [
  "down",
  "slow_response",
  "ssl_expiry",
]);
export const alertChannelEnum = pgEnum("alert_channel", ["email", "webhook"]);
export const alertHistoryStatusEnum = pgEnum("alert_history_status", [
  "triggered",
  "resolved",
]);
export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);

// Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  plan: planEnum("plan").default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  monitors: many(monitors),
  incidents: many(incidents),
  apiKeys: many(apiKeys),
  statusPages: many(statusPages),
  auditLogs: many(auditLogs),
}));

// Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  emailVerified: boolean("email_verified").default(false),
  githubId: varchar("github_id", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  emailVerifications: many(emailVerifications),
  passwordResets: many(passwordResets),
}));

// Memberships
export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: membershipRoleEnum("role").default("viewer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

// API Keys
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  keyHash: varchar("key_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}));

// Monitors
export const monitors = pgTable("monitors", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 2048 }).notNull(),
  type: monitorTypeEnum("type").default("https"),
  method: varchar("method", { length: 10 }).default("GET"),
  interval: integer("interval").default(300), // seconds
  timeout: integer("timeout").default(30000), // ms
  expectedStatusCode: integer("expected_status_code").default(200),
  keyword: varchar("keyword", { length: 255 }),
  headers: json("headers"),
  body: text("body"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const monitorsRelations = relations(monitors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [monitors.organizationId],
    references: [organizations.id],
  }),
  checks: many(checks),
  alerts: many(alerts),
  incidents: many(incidents),
  statusPageMonitors: many(statusPageMonitors),
}));

// Checks
export const checks = pgTable("checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  responseTime: integer("response_time"),
  statusCode: integer("status_code"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  attempt: integer("attempt").default(1),
});

export const checksRelations = relations(checks, ({ one }) => ({
  monitor: one(monitors, {
    fields: [checks.monitorId],
    references: [monitors.id],
  }),
}));

// Incidents
export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  monitorId: uuid("monitor_id").references(() => monitors.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 255 }).notNull(),
  status: incidentStatusEnum("status").default("investigating"),
  severity: incidentSeverityEnum("severity").default("minor"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [incidents.organizationId],
    references: [organizations.id],
  }),
  monitor: one(monitors, {
    fields: [incidents.monitorId],
    references: [monitors.id],
  }),
  updates: many(incidentUpdates),
}));

// Incident Updates
export const incidentUpdates = pgTable("incident_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  incidentId: uuid("incident_id")
    .notNull()
    .references(() => incidents.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const incidentUpdatesRelations = relations(
  incidentUpdates,
  ({ one }) => ({
    incident: one(incidents, {
      fields: [incidentUpdates.incidentId],
      references: [incidents.id],
    }),
  })
);

// Alerts
export const alerts = pgTable("alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  type: alertTypeEnum("type").default("down"),
  channel: alertChannelEnum("channel").default("email"),
  config: json("config").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  monitor: one(monitors, {
    fields: [alerts.monitorId],
    references: [monitors.id],
  }),
  history: many(alertHistory),
}));

// Alert History
export const alertHistory = pgTable("alert_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  alertId: uuid("alert_id")
    .notNull()
    .references(() => alerts.id, { onDelete: "cascade" }),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  status: alertHistoryStatusEnum("status").default("triggered"),
});

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertHistory.alertId],
    references: [alerts.id],
  }),
}));

// Status Pages
export const statusPages = pgTable("status_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  logo: text("logo"),
  accentColor: varchar("accent_color", { length: 7 }).default("#3b82f6"),
  public: boolean("public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const statusPagesRelations = relations(statusPages, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [statusPages.organizationId],
    references: [organizations.id],
  }),
  monitors: many(statusPageMonitors),
}));

// Status Page Monitors (many-to-many)
export const statusPageMonitors = pgTable("status_page_monitors", {
  id: uuid("id").defaultRandom().primaryKey(),
  statusPageId: uuid("status_page_id")
    .notNull()
    .references(() => statusPages.id, { onDelete: "cascade" }),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
});

export const statusPageMonitorsRelations = relations(
  statusPageMonitors,
  ({ one }) => ({
    statusPage: one(statusPages, {
      fields: [statusPageMonitors.statusPageId],
      references: [statusPages.id],
    }),
    monitor: one(monitors, {
      fields: [statusPageMonitors.monitorId],
      references: [monitors.id],
    }),
  })
);

// Email Verifications
export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const emailVerificationsRelations = relations(
  emailVerifications,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerifications.userId],
      references: [users.id],
    }),
  })
);

// Password Resets
export const passwordResets = pgTable("password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Export all tables
export const allTables = [
  organizations,
  users,
  memberships,
  apiKeys,
  monitors,
  checks,
  incidents,
  incidentUpdates,
  alerts,
  alertHistory,
  statusPages,
  statusPageMonitors,
  emailVerifications,
  passwordResets,
  auditLogs,
];
