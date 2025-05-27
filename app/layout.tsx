"use client";

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/navbar"
import { MetaMaskProvider } from "@metamask/sdk-react"

const inter = Inter({ subsets: ["latin"] })

const dappUrl = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}`
  : "https://default-dapp-url.com";

const sdkOptions = {
  logging: { developerMode: false },
  checkInstallationImmediately: false,
  dappMetadata: {
    name: "Next-Metamask-Boilerplate",
    url: dappUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Smart Contract Goal Creator</title>
        <link rel="icon" href="/ethFavicon.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MetaMaskProvider sdkOptions={sdkOptions} debug={false}>
            <AuthProvider>
              <Navbar />
              <main>{children}</main>
              <Toaster />
            </AuthProvider>
          </MetaMaskProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
