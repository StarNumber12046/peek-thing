import "~/styles/globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { fileRouter } from "~/app/api/uploadthing/core";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";
import { Nav } from "./_components/nav";
import { Toaster } from "sonner";
import { CSPostHogProvider } from "./_providers/posthog";

export const metadata: Metadata = {
  title: "Peek Thing",
  description: "Organize your images I guess",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <NextSSRPlugin routerConfig={extractRouterConfig(fileRouter)} />
      <html lang="en" className={`${GeistSans.variable} dark`}>
        <body className="dark bg-white dark:bg-black">
          <CSPostHogProvider>
            <TRPCReactProvider>
              <Nav />
              {children}
              <Toaster />
            </TRPCReactProvider>
          </CSPostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
