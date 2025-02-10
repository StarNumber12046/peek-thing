// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
import { SnowflakeId } from "@akashrajpurohit/snowflake-id";
import { relations } from "drizzle-orm";

const snowflake = SnowflakeId({
  workerId: 1,
  epoch: Date.now(),
});
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `peek-thing_${name}`);

export const images = createTable(
  "images",
  {
    id: text("id").primaryKey().$defaultFn(snowflake.generate),
    url: text("url").notNull(),
    userId: text("user_id").notNull(),
    removedBgUrl: text("removed_bg_url"),
    name: text("name").notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: int("update_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`unixepoch()`),
  },
  (table) => ({
    idIndex: index("name_idx").on(table.id),
    userIdIndex: index("user_id_idx").on(table.userId),
  }),
);

export const tags = createTable("tags", {
  id: text("id").primaryKey().$defaultFn(snowflake.generate),
  name: text("name").notNull(),
  userId: text("user_id").notNull(),
  createdAt: int("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: int("update_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`unixepoch()`),
});

export const imageTags = createTable(
  "image_tags",
  {
    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: int("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    imageIdx: index("image_tags_image_idx").on(table.imageId),
    tagIdx: index("image_tags_tag_idx").on(table.tagId),
  }),
);

// Add relations configuration
export const imagesRelations = relations(images, ({ many }) => ({
  imageTags: many(imageTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  imageTags: many(imageTags),
}));

export const imageTagsRelations = relations(imageTags, ({ one }) => ({
  image: one(images, {
    fields: [imageTags.imageId],
    references: [images.id],
  }),
  tag: one(tags, {
    fields: [imageTags.tagId],
    references: [tags.id],
  }),
}));
