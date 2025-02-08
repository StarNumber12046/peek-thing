// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
import { SnowflakeId } from "@akashrajpurohit/snowflake-id";

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

export const images = createTable("images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => snowflake.generate()),
  url: text("url").notNull(),
  userId: text("user_id").notNull(),
  removedBgUrl: text("removed_bg_url"),
  name: text("name").notNull(),
  createdAt: int("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});
