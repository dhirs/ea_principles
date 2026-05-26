import Image from "next/image"
import { RefreshButton } from "./refresh-button"

export function Header() {
  return (
    <header className="h-16 bg-card flex items-center px-8 sticky top-0 z-30 shadow-md">
      <Image
        src="/img/logo.png"
        alt="AI Principles"
        width={140}
        height={36}
        priority
        className="h-9 w-auto"
      />
      <div className="flex-1" />
      <RefreshButton />
    </header>
  )
}
