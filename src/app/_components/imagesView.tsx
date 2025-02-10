"use client";
import { api } from "~/trpc/react";
import { ImageCard } from "./imageCard";
import { toast } from "sonner";

export function ImagesView() {
  const [userImagesQuery] = api.images.getUserImages.useSuspenseQuery();
  const utils = api.useUtils();
  console.log(userImagesQuery);
  return (
    <div>
      <div className="flex flex-row flex-wrap items-center justify-center gap-4">
        {userImagesQuery?.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onDelete={() => {
              toast.success("Image deleted!", { icon: "🎉", richColors: true });
              void utils.images.getUserImages.invalidate();
            }}
            onRemoveBackground={() => {
              toast.success("Image background removed!", {
                icon: "🎉",
                richColors: true,
              });
              void utils.images.getUserImages.invalidate();
            }}
          />
        ))}
      </div>
    </div>
  );
}
