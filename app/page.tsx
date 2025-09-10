import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="brutalist-border border-b-4 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">INTENTSWAP</h1>
          <nav className="flex gap-4">
            <Link
              href="https://github.com/Emmo00/intent-swap"
              className="text-foreground hover:text-primary transition-colors font-mono font-bold"
            >
              GITHUB
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-balance">
              SWAP CRYPTO
              <br />
              <span className="text-primary">WITH JUST</span>
              <br />
              WORDS.
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl font-mono max-w-3xl mx-auto text-balance text-muted-foreground">
              Grant SpendPermissions once. Our AI agent executes swaps for you.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Link href="/app">
              <Button
                size="lg"
                className="brutalist-border brutalist-shadow bg-primary text-primary-foreground hover:bg-primary/90 text-xl font-black px-12 py-6 h-auto"
              >
                START SWAPPING
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="brutalist-border brutalist-shadow bg-card p-8 space-y-4">
              <div className="text-4xl">🤖</div>
              <h3 className="text-xl font-black">AI-POWERED</h3>
              <p className="font-mono text-sm text-muted-foreground">
                Natural language processing understands your swap intentions perfectly.
              </p>
            </div>

            <div className="brutalist-border brutalist-shadow bg-card p-8 space-y-4">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-black">INSTANT EXECUTION</h3>
              <p className="font-mono text-sm text-muted-foreground">
                Pre-approved permissions mean lightning-fast swaps without constant signing.
              </p>
            </div>

            <div className="brutalist-border brutalist-shadow bg-card p-8 space-y-4">
              <div className="text-4xl">🔒</div>
              <h3 className="text-xl font-black">SECURE BY DESIGN</h3>
              <p className="font-mono text-sm text-muted-foreground">
                Built on Base with SpendPermissions for maximum security and control.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="brutalist-border border-t-4 mt-20 p-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-mono text-sm text-muted-foreground">Built with ❤️ for the Base ecosystem</p>
        </div>
      </footer>
    </div>
  )
}
