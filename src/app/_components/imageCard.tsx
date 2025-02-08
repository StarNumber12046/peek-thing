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
import { Delete, Download, Trash, Wallpaper } from "lucide-react";
import { toast } from "sonner";

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

const BackgroundTypes = ["background", "remove-background"] as const;

export function ImageCard({
  image,
  onDelete,
  onRemoveBackground,
}: ImageCardProps) {
  const deleteImage = api.images.deleteImage.useMutation();
  const removeBgMutation = api.images.removeBackground.useMutation();
  const [backgroundType, setBackgroundType] =
    useState<(typeof BackgroundTypes)[number]>("remove-background");
  return (
    <div
      className="group rounded-md border border-neutral-500 p-3 dark:border-neutral-800"
      key={image.id}
    >
      <div className="absolute ml-2 mt-2 hidden justify-between gap-2 group-hover:flex">
        <button
          className="rounded-md bg-red-500 p-2 text-white hover:bg-red-400"
          onClick={() =>
            deleteImage.mutateAsync({ imageId: image.id }).then(onDelete)
          }
        >
          <Trash />
        </button>
        <button
          className={`rounded-md p-2 text-white ${backgroundType === "background" ? "bg-green-500 hover:bg-green-400" : "bg-red-500 hover:bg-red-400"}`}
          onClick={() =>
            setBackgroundType(
              backgroundType === "background"
                ? "remove-background"
                : "background",
            )
          }
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
            <a href={image.url} target="_blank" rel="noopener noreferrer">
              With Background
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <a href={image.url} target="_blank" rel="noopener noreferrer">
              Without Background
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Copy</DropdownMenuLabel>
          <DropdownMenuItem>
            <button onClick={() => copyImageToClipboard(image.url)}>
              Copy Image
            </button>
          </DropdownMenuItem>
          {image.removedBgUrl && (
            <DropdownMenuItem>
              <button onClick={() => copyImageToClipboard(image.removedBgUrl!)}>
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
          onClick={() =>
            removeBgMutation
              .mutateAsync({ imageId: image.id })
              .then(onRemoveBackground)
          }
        >
          Remove BG
        </button>
      )}
    </div>
  );
}
