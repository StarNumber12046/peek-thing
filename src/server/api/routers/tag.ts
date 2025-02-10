import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { imageTags, tags } from "~/server/db/schema";

export const tagsRouter = createTRPCRouter({
  getUserTags: protectedProcedure.query(async ({ ctx }) => {
    const tags = await ctx.db.query.tags.findMany({
      where: (tags, { eq }) => eq(tags.userId, ctx.user.userId!),
    });

    return tags;
  }),

  getImageTags: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tags = await ctx.db.query.imageTags.findMany({
        where: (imageTags, { eq }) => eq(imageTags.imageId, input.imageId),
        with: {
          tag: true,
        },
      });

      return tags.map((tagMapping) => tagMapping.tag);
    }),

  createTag: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [tag] = await ctx.db
        .insert(tags)
        .values({
          name: input.name,
          userId: ctx.user.userId!,
        })
        .returning({ id: tags.id, name: tags.name });
      console.log(`Tag created: ${tag?.id}`);

      return tag;
    }),

  deleteTag: protectedProcedure
    .input(
      z.object({
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(tags)
        .where(
          and(eq(tags.id, input.tagId), eq(tags.userId, ctx.user.userId!)),
        );
      console.log(`Tag deleted: ${input.tagId}`);
    }),

  addToImage: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
        tagId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.tagId) throw new Error("Tag not found");
      const image = await ctx.db.query.images.findFirst({
        where: (images, { eq }) => eq(images.id, input.imageId),
      });
      const tag = await ctx.db.query.tags.findFirst({
        where: (tags, { eq }) => eq(tags.id, input.tagId),
      });
      if (!image) {
        throw new Error("Image not found");
      }
      if (image.userId != ctx.user.userId) {
        throw new Error("You can only add tags to your own images");
      }
      if (tag?.userId != ctx.user.userId) {
        throw new Error("You can only add your tags");
      }
      const result = await ctx.db
        .insert(imageTags)
        .values({
          imageId: input.imageId,
          tagId: input.tagId,
        })
        .returning({
          imageId: imageTags.imageId,
          tagId: imageTags.tagId,
        });
      return result;
    }),
});
