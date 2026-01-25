'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useInView } from 'react-intersection-observer';
import { useSession } from 'next-auth/react';
import { nip19 } from 'nostr-tools';
import { SunIcon, MoonIcon, PenLineIcon, ShieldIcon, ZapIcon, KeyIcon, ServerIcon, LayersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginButton from '@/components/auth/LoginButton';
import { fetchBlogs } from '@/lib/nostr/fetch';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { blogToNaddr } from '@/lib/nostr/naddr';
import { useSettingsStore, DEFAULT_RELAYS } from '@/lib/stores/settingsStore';
import { useDraftStore } from '@/lib/stores/draftStore';
import { generateAvatar } from '@/lib/avatar';
import type { Blog } from '@/lib/nostr/types';

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncatePubkey(pubkey: string): string {
  const npub = nip19.npubEncode(pubkey);
  return `${npub.slice(0, 8)}...${npub.slice(-4)}`;
}

// Animated section wrapper
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Article card component
function ArticleCard({ blog, profile, relays }: { blog: Blog; profile?: { name?: string; picture?: string }; relays: string[] }) {
  const router = useRouter();
  const naddr = blogToNaddr(blog, relays);
  const avatarUrl = profile?.picture || generateAvatar(blog.pubkey);
  const displayName = profile?.name || truncatePubkey(blog.pubkey);

  return (
    <button
      onClick={() => router.push(`/${naddr}`)}
      className="text-left p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group h-full w-full flex flex-col min-w-0 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3 min-w-0">
        {/*eslint-disable-next-line @next/next/no-img-element*/}
        <img
          src={avatarUrl}
          alt=""
          className="w-6 h-6 rounded-full object-cover shrink-0"
        />
        <span className="text-sm text-muted-foreground truncate min-w-0">
          {displayName}
        </span>
        <span className="text-sm text-muted-foreground/70 shrink-0">&middot;</span>
        <span className="text-sm text-muted-foreground/70 shrink-0 whitespace-nowrap">
          {formatDate(blog.publishedAt || blog.createdAt)}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2 break-words">
        {blog.title || 'Untitled'}
      </h3>
      <p className="text-muted-foreground mt-2 line-clamp-4 text-sm flex-1 wrap-break-word">
        {blog.summary || ''}
      </p>
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';
  const relays = useSettingsStore((state) => state.relays);
  const activeRelay = useSettingsStore((state) => state.activeRelay) || DEFAULT_RELAYS[0];
  const createDraft = useDraftStore((state) => state.createDraft);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch recent articles for the feed preview
  const { data: feedData } = useQuery({
    queryKey: ['landing-feed', activeRelay],
    queryFn: () => fetchBlogs({ limit: 6, relay: activeRelay }),
    staleTime: 60000,
    enabled: mounted,
  });

  const blogs = feedData?.blogs ?? [];
  const pubkeys = blogs.map((blog) => blog.pubkey);
  const { data: profiles } = useProfiles(pubkeys, relays);

  const handleStartWriting = () => {
    const draftId = createDraft();
    // Open drafts panel on desktop (768px+ matches md: breakpoint)
    const isDesktop = window.innerWidth >= 768;
    router.push(`/draft/${draftId}${isDesktop ? '?panel=drafts' : ''}`);
  };

  const handleExplore = () => {
    // Navigate to first blog with explore panel open, or create draft if no blogs
    if (blogs.length > 0) {
      const naddr = blogToNaddr(blogs[0], relays);
      router.push(`/${naddr}?panel=explore`);
    } else {
      const draftId = createDraft();
      router.push(`/draft/${draftId}?panel=explore`);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground flex-shrink-0" style={{ fontFamily: 'var(--font-source-serif-4)' }}>
              <LayersIcon className="w-5 h-5" />
              NoteStack
            </h1>
            <nav className="hidden sm:flex items-center gap-6">
              <button
                onClick={handleExplore}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Explore Articles
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {mounted ? (theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />) : <MoonIcon className="w-5 h-5" />}
            </button>
            <LoginButton size="default" />
            {isLoggedIn && (
              <Button onClick={handleStartWriting} className="hidden sm:inline-flex">
                Start Writing
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center overflow-hidden">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight"
          style={{ fontFamily: 'var(--font-source-serif-4)' }}
        >
          Write without permission.
        </h2>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A long-form editor built on Nostr—the decentralized protocol where you own your content, your audience, and your identity.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs sm:max-w-none mx-auto">
          <Button size="lg" onClick={handleStartWriting} className="text-base px-8 w-full sm:w-auto">
            Start Writing
          </Button>
          <Button size="lg" variant="outline" onClick={handleExplore} className="text-base px-8 w-full sm:w-auto">
            Explore Articles
          </Button>
        </div>
      </section>

      {/* Feature Triptych */}
      <section className="max-w-6xl mx-auto px-6 py-20 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 border border-border rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6">
              <PenLineIcon className="w-6 h-6 text-primary dark:text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3" style={{ fontFamily: 'var(--font-source-serif-4)' }}>
              Write Freely
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Rich text editor with markdown support, code blocks, images, and embeds. Beautiful typography that gets out of your way.
            </p>
          </div>
          <div className="p-8 border border-border rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6">
              <ShieldIcon className="w-6 h-6 text-primary dark:text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3" style={{ fontFamily: 'var(--font-source-serif-4)' }}>
              Publish Permanently
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Your words live on relays you choose. Decentralized, censorship-resistant, and cryptographically signed with your key.
            </p>
          </div>
          <div className="p-8 border border-border rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6">
              <ZapIcon className="w-6 h-6 text-primary dark:text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3" style={{ fontFamily: 'var(--font-source-serif-4)' }}>
              Connect Directly
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Zaps, mentions, comments, and highlights. Build your audience without a middleman taking a cut or controlling your reach.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-border overflow-hidden">
        <AnimatedSection>
          <h3 className="text-3xl font-bold text-center text-foreground mb-16" style={{ fontFamily: 'var(--font-source-serif-4)' }}>
            How it works
          </h3>
        </AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <AnimatedSection delay={0}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <PenLineIcon className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium text-primary dark:text-primary mb-2">Step 1</div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Write in a beautiful editor</h4>
              <p className="text-muted-foreground text-sm">
                Focus on your words. The editor handles formatting, media, and Nostr-native features.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <KeyIcon className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium text-primary dark:text-primary mb-2">Step 2</div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Sign with your Nostr identity</h4>
              <p className="text-muted-foreground text-sm">
                Use your existing Nostr key or create one. Your identity, your control.
              </p>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <ServerIcon className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium text-primary dark:text-primary mb-2">Step 3</div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Publish to relays you control</h4>
              <p className="text-muted-foreground text-sm">
                Choose where your content lives. Broadcast to multiple relays for redundancy.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Live Feed Preview */}
      {blogs.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border overflow-hidden">
          <AnimatedSection>
            <div className="flex items-center justify-between mb-10 gap-4">
              <h3 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-source-serif-4)' }}>
                Latest Articles
              </h3>
              <button
                onClick={handleExplore}
                className="text-sm text-primary hover:text-primary/80 font-medium flex-shrink-0"
              >
                See more on Explore
              </button>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {blogs.slice(0, 6).map((blog, index) => (
              <AnimatedSection key={blog.id} delay={index * 50} className="h-full">
                <ArticleCard
                  blog={blog}
                  profile={profiles?.get(blog.pubkey)}
                  relays={relays}
                />
              </AnimatedSection>
            ))}
          </div>
        </section>
      )}

      {/* CTA Footer */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <AnimatedSection>
            <h3
              className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
              style={{ fontFamily: 'var(--font-source-serif-4)' }}
            >
              Ready to own your words?
            </h3>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <Button size="lg" onClick={handleStartWriting} className="text-base px-10">
              Start Writing
            </Button>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm">
              <a
                href="https://nostr.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About Nostr
              </a>
              <a
                href="https://getalby.com/p/chrisatmachine"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Donate
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          Built on Nostr. Open protocol, open source.
        </div>
      </footer>
    </div>
  );
}
