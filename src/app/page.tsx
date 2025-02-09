import { SignedIn } from "@clerk/nextjs";
import { ImagesView } from "./_components/imagesView";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center dark:bg-black dark:text-white">
      <SignedIn>
        <ImagesView />
      </SignedIn>
    </main>
  );
}
