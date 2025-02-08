"use client";
import { UploadButton, useUploadThing } from "~/utils/uploadthing";
import { toast } from "sonner";
import { api } from "~/trpc/react";
// inferred input off useUploadThing
type Input = Parameters<typeof useUploadThing>;

const useUploadThingInputProps = (...args: Input) => {
  const $ut = useUploadThing(...args);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    await $ut.startUpload(selectedFiles);
  };

  return {
    inputProps: {
      onChange,
      multiple: true,
      accept: "image/*",
    },
    isUploading: $ut.isUploading,
  };
};

function UploadSpinner() {
  return (
    <svg
      width="24"
      height="24"
      stroke="#000"
      fill="dodgerblue"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="spinner_V8m1">
        <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth="3"></circle>
      </g>
    </svg>
  );
}

function MakeToast() {
  return toast.info(
    <div className="dark flex items-center gap-2">
      <UploadSpinner />
      Uploading file...
    </div>,
    {
      duration: 100000,
      id: "uploading",
      richColors: true,
    },
  );
}

export function UploaderButton({ userImagesQuery }: { userImagesQuery: any }) {
  const removeBackgroundMutation = api.images.removeBackground.useMutation();
  const { inputProps, isUploading } = useUploadThingInputProps(
    "imageUploader",
    {
      onUploadBegin: () => {
        MakeToast();
      },
      onClientUploadComplete: (data) => {
        toast.dismiss("uploading");
        toast("Upload complete! Removing background...", { icon: "🎉" });
        const promises = data.map(async (element, index) => {
          await removeBackgroundMutation.mutateAsync({
            imageId: element.serverData.imageId!,
          });
          toast(`Background removed for image ${index + 1}/${data.length}`);
          userImagesQuery.refetch();
        });
        Promise.all(promises);
      },
    },
  );
  return (
    <div className="absolute right-14 top-5 flex items-center">
      <label htmlFor="upload-input" className="cursor-pointer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      </label>
      <input {...inputProps} type="file" id="upload-input" className="hidden" />
    </div>
  );
}

export function DefaultUploaderButton({
  userImagesQuery,
}: {
  userImagesQuery: any;
}) {
  const removeBackgroundMutation = api.images.removeBackground.useMutation();
  return (
    <UploadButton
      endpoint="imageUploader"
      onClientUploadComplete={(data) => {
        toast.dismiss("uploading");
        toast.info("Upload complete! Removing background...", {
          icon: "🎉",
          duration: 10000,
          id: "removing",
          richColors: true,
        });
        const promises = data.map(async (element, index) => {
          await removeBackgroundMutation.mutateAsync({
            imageId: element.serverData.imageId!,
          });
        });
        Promise.all(promises).then(() => {
          userImagesQuery.refetch();
          toast.dismiss("removing");
        });
      }}
      onUploadBegin={() => {
        MakeToast();
      }}
      onUploadError={(error: Error) => {
        // Do something with the error.
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}
