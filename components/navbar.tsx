"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Goal, Award, LogOut } from "lucide-react"

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl flex items-center">
          <Award className="mr-2 h-5 w-5" />
          Goal Tracker
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/goals" className="text-sm font-medium hover:text-primary">
            Goals
          </Link>
          <Link href="/referee" className="text-sm font-medium hover:text-primary">
            Referee
          </Link>
          <Link href="/claim-escrow" className="text-sm font-medium hover:text-primary">
            Claim Escrow
          </Link>
        </nav>
      </div>
    </header>
  )
}
