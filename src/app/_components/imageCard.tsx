"use client";
import { api } from "~/trpc/react";
import Image from "next/image";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { Download, Trash, Wallpaper } from "lucide-react";
import { toast } from "sonner";
import { usePostHog } from "posthog-js/react";

type ImageCardProps = {
  image: {
    id: string;
    name: string;
    url: string;
    removedBgUrl: string | null;
  };
  onDelete: () => void;
  onRemoveBackground: () => void;
};

const copyImageToClipboard = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Convert to PNG if JPEG is not supported
    if (!navigator.clipboard.write || blob.type === "image/jpeg") {
      throw new Error("Clipboard API does not support this format.");
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob, // Convert to PNG if needed
      }),
    ]);
    toast.success("Image copied to clipboard!");
  } catch (error) {
    console.error("Clipboard write failed, copying URL instead", error);
    await navigator.clipboard.writeText(imageUrl);
    toast.success("Image URL copied to clipboard!");
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BackgroundTypes = ["background", "remove-background"] as const;
type BackgroundType = (typeof BackgroundTypes)[number];
const openInNewTab = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export function ImageCard({
  image,
  onDelete,
  onRemoveBackground,
}: ImageCardProps) {
  const posthog = usePostHog();
  const deleteImage = api.images.deleteImage.useMutation();
  const removeBgMutation = api.images.removeBackground.useMutation();
  const [backgroundType, setBackgroundType] =
    useState<BackgroundType>("remove-background");
  return (
    <div
      className="group rounded-md border border-neutral-500 p-3 dark:border-neutral-800"
      key={image.id}
    >
      <div className="absolute ml-2 mt-2 hidden justify-between gap-2 group-hover:flex">
        <button
          className="rounded-md bg-red-500 p-2 text-white hover:bg-red-400"
          onClick={() => {
            deleteImage
              .mutateAsync({ imageId: image.id })
              .then(() => {
                setTimeout(() => {
                  posthog.capture("image_deleted", {
                    imageId: image.id,
                  });
                });
                onDelete();
              })
              .catch((error) => {
                console.error(error);
                posthog.capture("image_delete_error", {
                  // I could use sentry but I can't be bothered
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                  error: error.message,
                });
                toast.error("Error deleting image", { icon: "💥" });
              });
          }}
        >
          <Trash />
        </button>
        <button
          className={`rounded-md p-2 text-white ${backgroundType === "background" ? "bg-green-500 hover:bg-green-400" : "bg-red-500 hover:bg-red-400"}`}
          onClick={() => {
            setBackgroundType(
              backgroundType === "background"
                ? "remove-background"
                : "background",
            );
            setTimeout(() => {
              posthog.capture("image_background_toggle", {
                imageId: image.id,
                backgroundType,
              });
            });
          }}
        >
          <Wallpaper />
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative ml-auto mr-2 mt-2 flex text-right"
          asChild
        >
          <button>
            <Download />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Download</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <button
              onClick={() => {
                setTimeout(() => {
                  posthog.capture("image_download", {
                    imageId: image.id,
                    backgroundType: "with-bg",
                  });
                });
                openInNewTab(image.url);
              }}
            >
              With Background
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <button
              onClick={() => {
                setTimeout(() => {
                  posthog.capture("image_download", {
                    imageId: image.id,
                    backgroundType: "without-bg",
                  });
                });
                openInNewTab(image.removedBgUrl ?? image.url);
              }}
            >
              Without Background
            </button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Copy</DropdownMenuLabel>
          <DropdownMenuItem>
            <button
              onClick={() => {
                setTimeout(() => {
                  posthog.capture("image_copy", {
                    imageId: image.id,
                    backgroundType: "with-bg",
                  });
                });
                void copyImageToClipboard(image.url);
              }}
            >
              Copy Image
            </button>
          </DropdownMenuItem>
          {image.removedBgUrl && (
            <DropdownMenuItem>
              <button
                onClick={() => {
                  setTimeout(() => {
                    posthog.capture("image_copy", {
                      imageId: image.id,
                      backgroundType: "without-bg",
                    });
                  });
                  void copyImageToClipboard(image.removedBgUrl!);
                }}
              >
                Copy Image Without Background
              </button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Image
        src={
          backgroundType === "background"
            ? image.url
            : (image.removedBgUrl ?? image.url)
        }
        alt={image.id.toString()}
        height={250}
        width={250}
        style={{ width: 250, height: 250, objectFit: "contain" }}
        objectFit="cover"
        className="rounded-md"
      />
      <p>
        {image.name.slice(0, 25)}
        {image.name.length > 25 && "..."}
      </p>
      {!image.removedBgUrl && (
        <button
          onClick={() => {
            setTimeout(() => {
              posthog.capture("image_remove_bg", {
                imageId: image.id,
              });
            });
            removeBgMutation
              .mutateAsync({ imageId: image.id })
              .then(onRemoveBackground)
              .catch((error) => {
                console.error(error);
                posthog.capture("image_remove_bg_error", {
                  // I could use sentry but I can't be bothered
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                  error: error.message,
                });
                toast.error("Error removing background", { icon: "💥" });
              });
          }}
        >
          Remove BG
        </button>
      )}
    </div>
  );
}
