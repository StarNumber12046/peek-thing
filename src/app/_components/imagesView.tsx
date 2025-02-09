"use client";
import { api } from "~/trpc/react";
import { DefaultUploaderButton } from "./fileUpload";
import { ImageCard } from "./imageCard";

export function ImagesView() {
  const userImagesQuery = api.images.getUserImages.useQuery();
  return (
    <div>
      <DefaultUploaderButton />
      <div className="flex flex-row flex-wrap items-center justify-center gap-4">
        {userImagesQuery.data?.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onDelete={() => userImagesQuery.refetch()}
            onRemoveBackground={() => userImagesQuery.refetch()}
          />
        ))}
      </div>
    </div>
  );
}
