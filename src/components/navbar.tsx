import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">AudioSync</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/host"
              className="text-sm font-medium hover:text-primary"
            >
              Host
            </Link>
            <Link
              href="/client"
              className="text-sm font-medium hover:text-primary"
            >
              Join
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
