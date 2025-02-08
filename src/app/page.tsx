import { SignedIn, useUser } from "@clerk/nextjs";
import { ImagesView } from "./_components/imagesView";
type Image = {
  id: number;
  url: string;
};
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center dark:bg-black dark:text-white">
      <SignedIn>
        <ImagesView />
      </SignedIn>
    </main>
  );
}
