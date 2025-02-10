import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { utapi } from "~/utils/ut_server";
import Replicate from "replicate";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { images } from "~/server/db/schema";

import { File } from "buffer"; // Node >= 20 supports `File` natively, otherwise use a polyfill.
import posthog from "posthog-js";

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

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const imagesRouter = createTRPCRouter({
  getUserImages: protectedProcedure.query(async ({ ctx }) => {
    const images = await ctx.db.query.images.findMany({
      where: (images, { eq }) => eq(images.userId, ctx.user.userId!),
    });
    posthog.capture("user_images", {
      images: images.length,
    });
    return images;
  }),

  deleteImage: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db.query.images.findFirst({
        where: (images, { eq }) => eq(images.id, input.imageId),
      });
      if (!image) {
        throw new Error("Image not found");
      }
      await utapi.deleteFiles([image.url.replace("https://utfs.io/f/", "")]);
      if (image.removedBgUrl)
        await utapi.deleteFiles([
          image.removedBgUrl.replace("https://utfs.io/f/", ""),
        ]);
      await ctx.db
        .delete(images)
        .where(
          and(
            eq(images.id, input.imageId),
            eq(images.userId, ctx.user.userId!),
          ),
        );
      posthog.capture("image_deleted");
      console.log(`Image deleted: ${input.imageId}`);
    }),

  removeBackground: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db.query.images.findFirst({
        where: (images, { eq }) => eq(images.id, input.imageId),
      });
      if (!image) {
        throw new Error("Image not found");
      }
      if (image.removedBgUrl)
        throw new Error("Image background already removed");

      const output = (await replicate.run(
        // "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
        "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
        {
          input: {
            image: image.url,
          },
        },
      )) as ReadableStream;
      // Fetch the image and convert to blob
      const file = await readableStreamToFile(
        output,
        `${input.imageId}_removed-bg.png`,
        "image/png",
      );

      const files = await utapi.uploadFiles([file]);

      posthog.capture("image_removed_bg", {
        image: input.imageId,
        removed_bg: files[0]?.data?.url,
      });
      await ctx.db
        .update(images)
        .set({
          removedBgUrl: files[0]?.data?.url,
        })
        .where(eq(images.id, input.imageId));
    }),
});
