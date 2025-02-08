import { SignedIn, UserButton, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center justify-between p-4 dark:bg-black dark:text-white">
      <Link href="/">Home</Link>
      <div>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
      </div>
    </nav>
  );
}
