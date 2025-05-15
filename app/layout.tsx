"use client"; // Make sure this is at the top if any of its direct children use client-side features
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/navbar"
import { MetaMaskProvider } from "@metamask/sdk-react"

const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "Goal Accountability Tracker",
//   description: "Set goals, stake ETH, and achieve more with blockchain-powered accountability",
//     generator: 'v0.dev'
// }

const host =
    typeof window !== "undefined" ? window.location.host : "defaultHost";
console.log(host)
  const sdkOptions = {
    logging: { developerMode: false },
    checkInstallationImmediately: false,
    dappMetadata: {
      name: "Next-Metamask-Boilerplate",
      url: host, // using the host constant defined above
    },
  };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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
