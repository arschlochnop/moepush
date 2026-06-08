/* eslint-disable import/no-cycle */
import { relations, sql } from "drizzle-orm"
import { 
  text, 
  integer, 
  primaryKey 
} from "drizzle-orm/sqlite-core"
import { sqliteTable } from "drizzle-orm/sqlite-core"
import { endpoints } from "./endpoints"
import { users } from "./auth"

export const endpointGroups = sqliteTable("endpoint_groups", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const endpointToGroup = sqliteTable("endpoint_to_group", {
  endpointId: text("endpoint_id").notNull().references(() => endpoints.id, { onDelete: "cascade" }),
  groupId: text("group_id").notNull().references(() => endpointGroups.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.endpointId, t.groupId] })
}))

export const endpointGroupsRelations = relations(endpointGroups, ({ many, one }) => ({
  endpointToGroup: many(endpointToGroup),
  user: one(users, {
    fields: [endpointGroups.userId],
    references: [users.id],
  })
}))

export const endpointToGroupRelations = relations(endpointToGroup, ({ one }) => ({
  endpoint: one(endpoints, {
    fields: [endpointToGroup.endpointId],
    references: [endpoints.id],
  }),
  group: one(endpointGroups, {
    fields: [endpointToGroup.groupId],
    references: [endpointGroups.id],
  }),
})) 