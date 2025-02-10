import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { utapi } from "~/utils/ut_server";
import Replicate from "replicate";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { imageTags, tags } from "~/server/db/schema";

import { File } from "buffer"; // Node >= 20 supports `File` natively, otherwise use a polyfill.
import posthog from "posthog-js";
import { create } from "domain";

async function readableStreamToFile(
  stream: ReadableStream,
  filename: string,
  mimeType: string,
): Promise<File> {
  const response = new Response(stream);
  const blob = await response.blob(); // Convert stream to Blob
  const buffer = Buffer.from(await blob.arrayBuffer()); // Convert Blob to Buffer
  return new File([buffer], filename, { type: mimeType });
}

export const tagsRouter = createTRPCRouter({
  getUserTags: protectedProcedure.query(async ({ ctx }) => {
    const tags = await ctx.db.query.tags.findMany({
      where: (tags, { eq }) => eq(tags.userId, ctx.user.userId!),
    });
    posthog.capture("user_tags", {
      tags: tags.length,
    });
    return tags;
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
      posthog.capture("tag_created");
      console.log(`Tag created: ${tag?.id}`);
      return tag;
    }),

  deleteImage: protectedProcedure
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
      posthog.capture("tag_deleted");
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
      posthog.capture("image_tagged", { tagId: input.tagId });
      return result;
    }),
});
