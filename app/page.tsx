import NavBar from "@/components/nav-bar";
import StartSwappingButton from "@/components/start-swapping-button";


export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

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
            <StartSwappingButton />
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
          <p className="font-mono text-sm text-muted-foreground">
            Built with ❤️ for the Base ecosystem
          </p>
        </div>
      </footer>
    </div>
  );
}