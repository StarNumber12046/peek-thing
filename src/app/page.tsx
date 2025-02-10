import { SignedIn } from "@clerk/nextjs";
import { ImagesView } from "./_components/imagesView";
import { auth } from "@clerk/nextjs/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    void api.images.getUserImages.prefetch();
    void api.tags;
  }
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center dark:bg-black dark:text-white">
        <SignedIn>
          <ImagesView />
        </SignedIn>
      </main>
    </HydrateClient>
  );
}
