import Image from "next/image"
import Link from "next/link"
import { RefreshButton } from "./refresh-button"

export function Header() {
  return (
    <header className="h-16 bg-card flex items-center px-8 sticky top-0 z-30 shadow-md">
      <Link href="/" aria-label="Home" className="inline-flex items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Image
          src="/img/logo.png"
          alt="AI Principles"
          width={140}
          height={36}
          priority
          className="h-9 w-auto"
        />
      </Link>
      <div className="flex-1" />
      <RefreshButton />
    </header>
  )
}
