'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Pause,
  Play,
} from 'lucide-react';
import {
  SHIFTED_RECORD,
  VALID_RECORD,
  cacheFingerprint,
  serializeCacheRecord,
  type CacheRecord,
} from '../lib/model';

const RESEARCH_CUTOFF = '13 September 2026, 09:39 CEST';
const STEP_DELAY = 8000;

const SEQUENCE = [
  {
    label: 'Normal peg',
    title: 'BTC in the federation wallet should match L-BTC in circulation.',
    body: 'When someone withdraws BTC, the matching L-BTC must first be removed from circulation.',
  },
  {
    label: 'First transaction',
    title: 'The first transaction passes its proof check.',
    body: 'Liquid hides transaction amounts. A range proof lets a node check a hidden amount without seeing it. The node saves the successful result in a cache.',
  },
  {
    label: 'Missing boundaries',
    title: 'Two different records produce the same cache input.',
    body: 'The cache joins four fields without recording where one ends and the next begins. Moving those boundaries can turn different records into the same byte string.',
  },
  {
    label: 'Cache hit',
    title: 'The second record reuses the first result.',
    body: 'The same byte string has the same SHA-256 fingerprint. The cache reports success without checking the second proof. Equal cache input is not a SHA-256 collision.',
  },
] as const;

const TIMELINE = [
  {
    date: '25 April 2018',
    title: 'A simplification reduced the range-proof cache key to the proof and value commitment. The asset and output script were left out.',
    href: 'https://github.com/ElementsProject/elements/commit/957216523881768d9bcd6c5092dd5d50495dcd4e',
    label: 'Cache-key change',
  },
  {
    date: '1 September 2026 · merged',
    title: 'PR #1592 restored the missing fields, but joined all four without recording their lengths. This is a source-code date, not a confirmed deployment date.',
    href: 'https://github.com/ElementsProject/elements/pull/1592',
    label: 'Merged change',
  },
  {
    date: '6 September 2026',
    title: 'Two valid records in block 4,050,335 could prime the cache. The next block reused the same bytes with different field boundaries, splitting the chain.',
    href: 'https://blockstream.info/liquid/block/e1d9a2aae69e0fc3ca18f7f7f84e0615e92a5e3b5000d66c10c34043346da0d5',
    label: 'View block',
  },
  {
    date: '7 September 2026',
    title: 'Blockstream disabled the bridge nodes and paused Liquid.',
    href: 'https://status.blockstream.com/incidents/b8b719f3-db70-4487-9cff-946e69509228',
    label: 'Official status',
  },
  {
    date: '7 September 2026',
    title: 'A confirmed Bitcoin transaction sent 3,400 BTC to the published federation return address.',
    href: 'https://mempool.space/tx/a6d697a25266ce3c78774fd1d75f896b7af522ada209b0f6228ea497bc49a46d',
    label: 'View transaction',
  },
  {
    date: '8 September 2026',
    title: 'Liquid published its incident report: about 4,000 unbacked L-BTC had reached the peg-out path.',
    href: 'https://x.com/Liquid_BTC/status/2097404704028545175',
    label: 'Incident report',
  },
  {
    date: '9 September 2026',
    title: 'Elements 23.3.4 was released with hardened proof-cache keys.',
    href: 'https://github.com/ElementsProject/elements/releases/tag/elements-23.3.4',
    label: 'Software release',
  },
  {
    date: '10 September 2026',
    title: 'Block production and transactions resumed. Peg-outs stayed disabled.',
    href: 'https://x.com/Liquid_BTC/status/2098140614239920622',
    label: 'Network update',
  },
  {
    date: '11 September 2026',
    title: 'SideSwap reopened peg-ins, while warning that the public reserve remained below the L-BTC in circulation.',
    href: 'https://sideswap.io/news/liquid-peg-ins-are-open-again-on-sideswap/',
    label: 'SideSwap update',
  },
] as const;

const SOURCES = [
  {
    group: 'Incident and transactions',
    links: [
      ['Liquid statement', 'https://x.com/Liquid_BTC/status/2096696272447218108'],
      ['Liquid incident report', 'https://x.com/Liquid_BTC/status/2097404704028545175'],
      ['Liquid transaction-resumption update', 'https://x.com/Liquid_BTC/status/2098140614239920622'],
      ['Blockstream incident status', 'https://status.blockstream.com/incidents/b8b719f3-db70-4487-9cff-946e69509228'],
      ['Blockstream restart update', 'https://x.com/Blockstream/status/2097127976672342487'],
      ['Blockstream recovery position', 'https://x.com/Blockstream/status/2098281867908690394'],
      ['BULL service update', 'https://x.com/BULLBITCOIN_/status/2098119275709915464'],
      ['SideSwap incident statement', 'https://sideswap.io/news/statement-on-the-liquid-network-incident-of-6-september-2026/'],
      ['SideSwap peg-in update', 'https://sideswap.io/news/liquid-peg-ins-are-open-again-on-sideswap/'],
      ['Primer transaction A', 'https://blockstream.info/liquid/tx/271147100a94f6337b6c3db39b30c92d5b97ed91597307b6f721f73a15187ec5'],
      ['Primer transaction B', 'https://blockstream.info/liquid/tx/71c93d4339fe8328981a2ec0dd23808d1ff104dc4c4cbcfc5c06fb2bb622f411'],
      ['Disputed Liquid transaction', 'https://blockstream.info/liquid/tx/f24a4b179b5cc7e88b25a763911f7cbdf2bf45d1d1b5ab611e94461cef0a183f'],
      ['Bitcoin federation payout', 'https://blockstream.info/tx/8db751a650ae2f12006b7e8c69a75e4df360e8afd6b9e05ae0b9fa6458a7b140'],
      ['Signed bridge-node message', 'https://blockstream.info/tx/87dc0a20099a94c2caaa3fa93d1724cfe41b05ae5e0778cc0e8994b22e81120c'],
      ['3,400 BTC return transaction', 'https://mempool.space/tx/a6d697a25266ce3c78774fd1d75f896b7af522ada209b0f6228ea497bc49a46d'],
      ['Reported withdrawal address', 'https://mempool.space/address/bc1ql4mfu6aundtkksxklfajs2h3t9nzcd6gyqjlte'],
    ],
  },
  {
    group: 'Source code',
    links: [
      ['2018 cache-key simplification', 'https://github.com/ElementsProject/elements/commit/957216523881768d9bcd6c5092dd5d50495dcd4e'],
      ['2026 cache-key change', 'https://github.com/ElementsProject/elements/commit/c26d719c29a40da280a825b25657e9c3d8bc7d99'],
      ['Pull request #1592', 'https://github.com/ElementsProject/elements/pull/1592'],
      ['Cache hardening pull request #1600', 'https://github.com/ElementsProject/elements/pull/1600'],
      ['Elements 23.3.4 release', 'https://github.com/ElementsProject/elements/releases/tag/elements-23.3.4'],
      ['Current Elements releases', 'https://github.com/ElementsProject/elements/releases'],
    ],
  },
  {
    group: 'Protocol background and independent analysis',
    links: [
      ['How Liquid peg-outs work', 'https://docs.liquid.net/docs/advanced-pegin-pegout'],
      ['Liquid technical overview', 'https://docs.liquid.net/docs/technical-overview'],
      ['Independent forensic report', 'https://gist.github.com/1440000bytes/211ac92dd4433bb1a2e674bf0ff7db2e'],
      ['Independent transaction replay monitor', 'https://github.com/orangesurf/liquid-transaction-replay-monitor'],
      ['Steven Roose code walkthrough', 'https://insider.btcpp.dev/p/how-cache-optimization-not-broken'],
    ],
  },
] as const;

export function LiquidStudy() {
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [validFingerprint, setValidFingerprint] = useState('');
  const [shiftedFingerprint, setShiftedFingerprint] = useState('');

  useEffect(() => {
    let active = true;

    void Promise.all([
      cacheFingerprint(VALID_RECORD),
      cacheFingerprint(SHIFTED_RECORD),
    ]).then(([valid, shifted]) => {
      if (!active) return;
      setValidFingerprint(valid);
      setShiftedFingerprint(shifted);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;

    const timer = window.setTimeout(() => {
      if (stage === SEQUENCE.length - 1) {
        setPlaying(false);
      } else {
        setStage((current) => current + 1);
      }
    }, STEP_DELAY);

    return () => window.clearTimeout(timer);
  }, [playing, stage]);

  const fingerprintsMatch = useMemo(
    () => Boolean(validFingerprint) && validFingerprint === shiftedFingerprint,
    [shiftedFingerprint, validFingerprint],
  );

  const selectStage = (next: number) => {
    setStage(Math.max(0, Math.min(SEQUENCE.length - 1, next)));
    setPlaying(false);
  };

  return (
    <div id="top" className="min-h-[100dvh] overflow-x-clip bg-canvas text-ink">
      <header className="sticky top-0 z-50 grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-white/10 bg-canvas/95 px-4 backdrop-blur-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-8">
        <a
          href="https://mars-llm.github.io/hal-finney-trading-algorithms/"
          className="flex min-h-11 min-w-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-white"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Cryptographic Arts</span>
          <span className="sr-only sm:hidden">Return to Cryptographic Arts</span>
        </a>
        <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-ink-muted sm:block">
          Security case study / 02
        </p>
        <a href="#top" className="min-w-0 max-w-full truncate text-right font-serif text-sm uppercase tracking-[0.16em] text-white transition-colors hover:text-accent">
          Liquid Implosion
        </a>
      </header>

      <main>
        <section id="summary" className="relative scroll-mt-14 border-b border-white/10 px-4 py-10 md:px-8 md:py-14">
          <div className="fault-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            className="relative mx-auto max-w-6xl"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
              Liquid Implosion · 6 September 2026
            </p>
            <h1 className="mt-4 max-w-5xl font-serif text-4xl leading-[1.02] text-white sm:text-6xl">
              How a cache bug moved almost 4,000 BTC out of Liquid&apos;s reserve
            </h1>
            <div className="mt-7 grid gap-5 lg:grid-cols-2 lg:gap-12">
              <p className="font-sans text-base leading-relaxed text-ink">
                <SourceLink href="https://x.com/Liquid_BTC/status/2097404704028545175">Liquid&apos;s incident report</SourceLink> says a cache flaw allowed about 4,000 L-BTC without matching BTC backing. The <SourceLink href="https://blockstream.info/tx/8db751a650ae2f12006b7e8c69a75e4df360e8afd6b9e05ae0b9fa6458a7b140">federation&apos;s Bitcoin transaction</SourceLink> then paid 3,998.67 BTC across two peg-outs.
              </p>
              <p className="font-sans text-sm leading-relaxed text-ink-muted">
                Liquid is a Bitcoin-linked network: its L-BTC is meant to match BTC held by its operators, the federation, one-for-one. A peg-out withdraws BTC by removing the matching L-BTC from circulation.
              </p>
            </div>
            <NetworkSnapshot />
            <nav aria-label="On this page" className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-ink-muted">
              {[['summary', 'Overview'], ['guidance', 'Status'], ['mechanism', 'Cache flaw'], ['timeline', 'Timeline'], ['sources', 'Sources']].map(([id, label]) => (
                <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center underline decoration-white/20 underline-offset-4 hover:text-accent">{label}</a>
              ))}
            </nav>
          </motion.div>
        </section>

        <CurrentGuidance />

        <section id="mechanism" className="scroll-mt-14 border-b border-white/10 bg-panel px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <SectionLabel index="02">How the cache failed</SectionLabel>
                <h2 className="mt-5 font-serif text-3xl leading-tight text-white sm:text-5xl">How the cache confused different records</h2>
              </div>
              <p className="max-w-2xl font-sans text-sm leading-relaxed text-ink-muted lg:justify-self-end">
                The four steps below use shorter example records to show the cache mistake: different fields become the same bytes once their boundaries are removed.
              </p>
            </div>
            <CacheWalkthrough
              stage={stage}
              playing={playing}
              reducedMotion={Boolean(shouldReduceMotion)}
              fingerprintsMatch={fingerprintsMatch}
              fingerprint={validFingerprint}
              onTogglePlaying={() => {
                if (!playing && stage === SEQUENCE.length - 1) setStage(0);
                setPlaying((current) => !current);
              }}
              onSelectStage={selectStage}
            />
            <div className="mt-10 border-t border-accent/40 pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">What happened on Liquid</p>
              <h3 className="mt-3 font-serif text-2xl text-white">The same 4,301 bytes were read as different fields.</h3>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-ink-muted">
                Two transactions in block 4,050,335 contained a valid record that could prime affected caches. The <SourceLink href="https://blockstream.info/liquid/tx/f24a4b179b5cc7e88b25a763911f7cbdf2bf45d1d1b5ab611e94461cef0a183f">mint transaction</SourceLink> in the next block arranged different fields into the same byte sequence. Affected nodes could then reuse the earlier result instead of checking the invalid proof.
              </p>
              <p className="mt-3 max-w-3xl font-sans text-sm leading-relaxed text-ink-muted">
                The <SourceLink href="https://blockstream.info/tx/8db751a650ae2f12006b7e8c69a75e4df360e8afd6b9e05ae0b9fa6458a7b140">federation payout transaction</SourceLink> then paid two outputs totaling 3,998.67 BTC. The public record does not reveal the exact software and cached data on every server that signed the disputed chain.
              </p>
            </div>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-14 border-b border-white/10 px-4 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <SectionLabel index="03">Timeline</SectionLabel>
                <h2 className="mt-5 font-serif text-3xl text-white sm:text-5xl">Code history and incident events</h2>
                <p className="mt-5 font-sans text-sm leading-relaxed text-ink-muted">The vulnerable code is public. The software version running on each federation server has not been published.</p>
              </div>
              <div className="border-t border-white/15">
                {TIMELINE.map((item) => (
                  <article key={`${item.date}-${item.title}`} className="grid gap-2 border-b border-white/10 py-5 sm:grid-cols-[10rem_1fr_auto] sm:items-center">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">{item.date}</p>
                    <h3 className="font-serif text-lg text-white">{item.title}</h3>
                    <a href={item.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted hover:text-white">
                      {item.label}<ExternalLink size={12} />
                    </a>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="sources" className="scroll-mt-14 px-4 py-14 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <SectionLabel index="04">Sources</SectionLabel>
              <h2 className="mt-5 font-serif text-3xl text-white sm:text-5xl">What the public record shows</h2>
              <p className="mt-5 max-w-lg font-sans text-sm leading-relaxed text-ink-muted">
                The disputed transaction and Bitcoin payout are public, as is the relevant cache code. The exact software and cache contents on each Liquid server are not.
              </p>
            </div>
            <div>
              <details className="group border-y border-white/15">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-3 text-white transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                  <span className="font-serif text-lg">Sources and technical details</span>
                  <span className="flex shrink-0 items-center gap-3 font-mono text-[9px] uppercase tracking-[0.14em]">
                    <span className="group-open:hidden">Open</span>
                    <span className="hidden group-open:inline">Close</span>
                    <span className="flex size-8 items-center justify-center border border-accent/70 text-base leading-none transition-transform group-open:rotate-45 group-open:bg-accent group-open:text-canvas" aria-hidden="true">+</span>
                  </span>
                </summary>
                <div className="pb-6">
                  <div className="border-t border-white/10 py-5 font-sans text-sm leading-relaxed text-ink-muted">
                    <p><SourceLink href="https://github.com/ElementsProject/elements/releases/tag/elements-23.3.4">Elements 23.3.4</SourceLink> is now the latest signed release. It records field lengths in both proof-cache keys, includes a previously missing surjection-proof input, and can bypass the range-proof cache.</p>
                    <p className="mt-3">Explorer snapshot at {RESEARCH_CUTOFF}: <SourceLink href="https://blockstream.info/liquid/">Blockstream</SourceLink> and <SourceLink href="https://liquid.network/liquid/">liquid.network</SourceLink> agreed on block 4,055,272 and its hash. Both APIs showed the disputed mint transaction as unconfirmed on the current chain.</p>
                    <p className="mt-3">An <SourceLink href="https://github.com/orangesurf/liquid-transaction-replay-monitor">independent exact-transaction monitor</SourceLink> reported that all 608 expected legitimate transactions from the abandoned fork had later appeared on the accepted chain, while none of the eight tainted transactions had. Its last published check was 13 September at 06:15 UTC.</p>
                    <p className="mt-3"><SourceLink href="https://sideswap.io/news/statement-on-the-liquid-network-incident-of-6-september-2026/">SideSwap says</SourceLink> it found 70 balanced rehearsal transactions followed by the single unbalanced mint transaction. It also says its node ran a private security build supplied in August, yet still accepted the mint. These are SideSwap&apos;s findings; the build itself has not been published.</p>
                    <p className="mt-3">The demonstration hashes its bytes with the same fixed educational salt for both records. Full SHA-256 fingerprint:</p>
                    <code className="mt-2 block break-all text-xs text-ink">{validFingerprint || 'Calculating…'}</code>
                  </div>
                  {SOURCES.map((source) => (
                    <div key={source.group} className="border-t border-white/10 py-5">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">{source.group}</p>
                      <div className="mt-3">
                        {source.links.map(([label, href]) => (
                          <a key={href} href={href} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-4 border-b border-white/[0.06] font-sans text-sm text-ink-muted transition-colors hover:text-white">
                            {label}<ExternalLink size={12} className="shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
              <div className="mt-6 space-y-3 border-l border-accent pl-5 font-sans text-sm leading-relaxed text-ink-muted">
                <p><SourceLink href="https://x.com/Blockstream/status/2098281867908690394">Blockstream now says</SourceLink> it will not pay the requested ransom and will pursue legal and forensic recovery. That is Blockstream&apos;s position; the actors&apos; identity remains unconfirmed.</p>
                <p>A <SourceLink href="https://blockstream.info/tx/87dc0a20099a94c2caaa3fa93d1724cfe41b05ae5e0778cc0e8994b22e81120c">PGP-signed message placed on Bitcoin</SourceLink> says the bridge nodes were patched. The signature does not identify its sender.</p>
                <p>The <SourceLink href="https://x.com/Liquid_BTC/status/2097404704028545175">incident report</SourceLink> gives 15:53:10 UTC for block 4,050,336. The <SourceLink href="https://blockstream.info/liquid/block/e1d9a2aae69e0fc3ca18f7f7f84e0615e92a5e3b5000d66c10c34043346da0d5">block explorer</SourceLink> records 13:53:10 UTC, so this page uses the block height and does not treat either time as settled.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t border-white/10 px-4 py-4 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted sm:flex-row sm:items-center sm:justify-between md:px-8">
        <span>Unaffiliated with Blockstream, Liquid or SideSwap.</span>
        <span className="flex flex-wrap items-center gap-x-2">
          <span>Developed by</span>
          <a href="https://github.com/marsmensch" target="_blank" rel="noreferrer" className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent">
            Marsmensch
          </a>
          <span>/</span>
          <a href="https://github.com/mars-llm" target="_blank" rel="noreferrer" className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent">
            mars-llm
          </a>
          <span>/ 2026</span>
        </span>
      </footer>
    </div>
  );
}

function CacheWalkthrough({
  fingerprint,
  fingerprintsMatch,
  onSelectStage,
  onTogglePlaying,
  playing,
  reducedMotion,
  stage,
}: {
  fingerprint: string;
  fingerprintsMatch: boolean;
  onSelectStage: (stage: number) => void;
  onTogglePlaying: () => void;
  playing: boolean;
  reducedMotion: boolean;
  stage: number;
}) {
  const current = SEQUENCE[stage];

  return (
    <div className="border-y border-white/20 bg-canvas/80">
      <div className="sticky top-14 z-20 border-b border-white/15 bg-canvas px-2 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">Illustration · {stage + 1} / {SEQUENCE.length}</p>
          <button type="button" onClick={onTogglePlaying} aria-pressed={playing} className="inline-flex min-h-11 items-center gap-2 px-3 font-sans text-sm text-white hover:text-accent">
            {playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : 'Play'}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => onSelectStage(stage - 1)} disabled={stage === 0} className="inline-flex min-h-11 items-center gap-1 px-2 font-sans text-sm text-white hover:text-accent disabled:cursor-default disabled:opacity-30">
            <ArrowLeft size={14} />Previous
          </button>
          <div className="flex" aria-label="Walkthrough steps">
            {SEQUENCE.map((step, index) => (
              <button key={step.label} type="button" aria-label={`Step ${index + 1}: ${step.label}`} aria-current={stage === index ? 'step' : undefined} onClick={() => onSelectStage(index)} className={`flex min-h-11 min-w-6 items-center justify-center border-b-2 font-mono text-xs sm:min-w-11 ${stage === index ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-white'}`}>
                {index + 1}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => onSelectStage(stage + 1)} disabled={stage === SEQUENCE.length - 1} className="inline-flex min-h-11 items-center gap-1 px-2 font-sans text-sm text-white hover:text-accent disabled:cursor-default disabled:opacity-30">
            Next<ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="h-0.5 bg-white/10" aria-hidden="true">
        <motion.div
          key={`${stage}-${playing}`}
          className="h-full bg-accent"
          initial={{ width: `${(stage / SEQUENCE.length) * 100}%` }}
          animate={{ width: `${((stage + 1) / SEQUENCE.length) * 100}%` }}
          transition={{ duration: reducedMotion || !playing ? 0 : STEP_DELAY / 1000, ease: 'linear' }}
        />
      </div>

      <div className="grid sm:min-h-[27rem] lg:grid-cols-[0.78fr_1.22fr]" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
        <motion.div
          key={current.label}
          initial={stage === 0 || reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.28 }}
          className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">{current.label}</p>
          <h3 className="mt-4 font-serif text-2xl leading-tight text-white sm:text-3xl">{current.title}</h3>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ink-muted">{current.body}</p>
        </motion.div>

        <div className="flex min-h-64 min-w-0 items-center p-3 sm:p-7">
          <ReconstructionScene
            stage={stage}
            fingerprint={fingerprint}
            fingerprintsMatch={fingerprintsMatch}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

    </div>
  );
}

function ReconstructionScene({
  fingerprint,
  fingerprintsMatch,
  reducedMotion,
  stage,
}: {
  fingerprint: string;
  fingerprintsMatch: boolean;
  reducedMotion: boolean;
  stage: number;
}) {
  return (
    <motion.div
      key={stage}
      initial={stage === 0 || reducedMotion ? false : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
      className="w-full"
    >
      {stage === 0 && <BalancedPeg />}
      {stage === 1 && <FirstCheck />}
      {stage === 2 && <BoundaryShift />}
      {stage === 3 && <CacheHit fingerprint={fingerprint} match={fingerprintsMatch} />}
    </motion.div>
  );
}

function BalancedPeg() {
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <MarkerSet label="BTC reserve" filled />
        <div className="text-center">
          <div className="h-px w-8 bg-accent sm:w-12" />
          <p className="mt-3 font-mono text-xs text-accent">1 : 1</p>
        </div>
        <MarkerSet label="L-BTC" />
      </div>
      <p className="mt-5 font-sans text-xs leading-relaxed text-ink-muted">Eight squares stand in for the reserve and supply.</p>
    </div>
  );
}

function MarkerSet({ filled = false, label }: { filled?: boolean; label: string }) {
  return (
    <div>
      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className={`aspect-square border ${filled ? 'border-white/40 bg-white/75' : 'border-accent bg-accent/10'}`} />
        ))}
      </div>
    </div>
  );
}

function FirstCheck() {
  return (
    <div>
      <FieldLegend />
      <CacheRecordView label="Record A" record={VALID_RECORD} />
      <div className="mt-6 flex items-center gap-3 border-l-2 border-accent bg-accent/[0.06] px-4 py-4">
        <span className="flex size-8 shrink-0 items-center justify-center border border-accent text-accent"><Check size={16} /></span>
        <div>
          <p className="font-serif text-lg text-white">Proof accepted</p>
          <p className="mt-1 font-sans text-xs text-ink-muted">The node stores that answer in its cache.</p>
        </div>
      </div>
    </div>
  );
}

function BoundaryShift() {
  const bytes = serializeCacheRecord(VALID_RECORD);

  return (
    <div className="space-y-5">
      <FieldLegend />
      <CacheRecordView label="Record A" record={VALID_RECORD} />
      <CacheRecordView label="Record B · different boundaries" record={SHIFTED_RECORD} />
      <p className="font-sans text-xs leading-relaxed text-ink-muted">Read down: every byte stays in place. Only the field boundaries move. The real proofs are longer, but the mistake is the same.</p>
      <div className="border-t border-white/15 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent">Boundaries discarded → same cache input</p>
        <div className="mt-2 grid grid-cols-12 border-y border-white/30 py-3 font-mono text-[11px] text-white">
          {bytes.map((byte, index) => <span key={index} className="text-center">{byte}</span>)}
        </div>
      </div>
    </div>
  );
}

function CacheHit({ fingerprint, match }: { fingerprint: string; match: boolean }) {
  const shortFingerprint = fingerprint ? `${fingerprint.slice(0, 8)}…${fingerprint.slice(-7)}` : 'Calculating…';

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Fingerprint label="Record A" value={shortFingerprint} />
        <span className={`mx-auto flex size-10 items-center justify-center border ${match ? 'border-accent text-accent' : 'border-white/20 text-ink-muted'}`}>
          {match ? <Check size={18} /> : '…'}
        </span>
        <Fingerprint label="Record B" value={shortFingerprint} />
      </div>
      <div className="hairline-glow mt-7 border-l-2 border-accent bg-accent/[0.06] px-5 py-5">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-accent">Cache hit</p>
        <p className="mt-2 font-serif text-2xl text-white">The second proof is skipped.</p>
      </div>
    </div>
  );
}

const SEGMENTS = [
  ['proof', 'Proof', 'border-white/50 bg-white/10'],
  ['valueCommitment', 'Value', 'border-accent/70 bg-accent/10'],
  ['assetGenerator', 'Asset', 'border-white/35 bg-white/[0.04]'],
  ['script', 'Script', 'border-accent/40 bg-accent/[0.04]'],
] as const;

function CacheRecordView({ label, record }: { label: string; record: CacheRecord }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">{label}</p>
      <div className="mt-2 grid grid-cols-12">
        {SEGMENTS.map(([key, segmentLabel, color], fieldIndex) => {
          const bytes = record[key];
          return (
            <div
              key={key}
              className={`min-w-0 border-y border-l-2 py-2 last:border-r ${color}`}
              style={{ gridColumn: `span ${bytes.length}` }}
              aria-label={`${segmentLabel}: ${bytes.join(' ')}`}
            >
              <p aria-hidden="true" className="text-center font-mono text-[10px] text-ink-muted">{fieldIndex + 1}</p>
              <div aria-hidden="true" className="mt-2 grid font-mono text-[11px] text-white" style={{ gridTemplateColumns: `repeat(${bytes.length}, minmax(0, 1fr))` }}>
                {bytes.map((byte, index) => <span key={index} className="text-center">{byte}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldLegend() {
  return (
    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 font-sans text-xs text-ink-muted" aria-label="Record fields">
      {SEGMENTS.map(([key, label], index) => <span key={key}><span className="mr-1 font-mono text-accent">{index + 1}</span>{label}</span>)}
    </div>
  );
}

function Fingerprint({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center sm:text-left">
      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <p className="mt-2 font-mono text-[10px] text-white">{value}</p>
    </div>
  );
}

function FactLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-white/10 py-5 sm:grid-cols-[7rem_1fr]">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">{label}</p>
      <p className="font-sans text-sm leading-relaxed text-ink">{children}</p>
    </div>
  );
}

function NetworkSnapshot() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-white/15 py-4 font-sans text-sm text-ink-muted">
      <a
        href="https://x.com/Liquid_BTC/status/2098140614239920622"
        target="_blank"
        rel="noreferrer"
        className="text-accent underline decoration-accent/40 underline-offset-4 hover:text-white"
      >
        Transactions running · peg-outs disabled
      </a>
      <a
        href="https://mempool.space/tx/a6d697a25266ce3c78774fd1d75f896b7af522ada209b0f6228ea497bc49a46d"
        target="_blank"
        rel="noreferrer"
        className="text-white underline decoration-white/30 underline-offset-4 hover:text-accent"
      >
        3,400 BTC returned · confirmed
      </a>
      <p className="text-xs">Checked {RESEARCH_CUTOFF}</p>
    </div>
  );
}

function SourceLink({ children, href }: { children: React.ReactNode; href: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="text-ink underline decoration-white/35 underline-offset-4 hover:text-accent">{children}</a>;
}

function CurrentGuidance() {
  return (
    <section id="guidance" className="scroll-mt-14 border-b border-accent/50 bg-accent/[0.06] px-4 py-10 md:px-8 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <SectionLabel index="01">Status and guidance</SectionLabel>
          <h2 className="mt-5 font-serif text-3xl text-white sm:text-5xl">Transactions are running. Peg-outs are not.</h2>
          <p className="mt-5 font-sans text-xs leading-relaxed text-ink-muted">Checked {RESEARCH_CUTOFF}. Availability depends on the service.</p>
          <a href="https://x.com/Liquid_BTC/status/2098140614239920622" target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-12 items-center gap-3 border border-accent bg-accent px-4 font-sans text-sm text-canvas transition-colors hover:bg-transparent hover:text-accent">
            Read the network update <ExternalLink size={13} />
          </a>
        </div>
        <div className="border-t border-white/15">
          <FactLine label="Network"><SourceLink href="https://x.com/Liquid_BTC/status/2098140614239920622">Liquid says</SourceLink> block production and transactions have resumed. The two public explorers now agree on the current chain.</FactLine>
          <FactLine label="Backing"><SourceLink href="https://sideswap.io/news/liquid-peg-ins-are-open-again-on-sideswap/">SideSwap reported</SourceLink> 4,229 L-BTC in circulation against 3,627 BTC in the federation reserve on 11 September. The difference was about 602 BTC. Peg-outs remain closed, so L-BTC cannot currently be redeemed for BTC through the federation.</FactLine>
          <FactLine label="Funds">A <SourceLink href="https://mempool.space/tx/a6d697a25266ce3c78774fd1d75f896b7af522ada209b0f6228ea497bc49a46d">confirmed transaction</SourceLink> returned 3,400 BTC. About 598.50 BTC remained at the <SourceLink href="https://mempool.space/address/bc1ql4mfu6aundtkksxklfajs2h3t9nzcd6gyqjlte">reported address</SourceLink> at the check above.</FactLine>
          <FactLine label="Services"><SourceLink href="https://x.com/BULLBITCOIN_/status/2098119275709915464">BULL says</SourceLink> its Bitcoin wallet is unaffected. In its Liquid wallet, swaps from L-BTC to Bitcoin or Lightning and the automatic sweep above 1,000,000 sats remain unavailable. Check your own provider before sending.</FactLine>
          <FactLine label="Software"><SourceLink href="https://github.com/ElementsProject/elements/releases/tag/elements-23.3.4">Elements 23.3.4</SourceLink> is the latest signed release and hardens the proof caches. A software release does not by itself restore the peg.</FactLine>
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children, index }: { children: React.ReactNode; index: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
      <span className="flex size-6 items-center justify-center border border-accent/60">{index}</span>
      {children}
    </p>
  );
}
