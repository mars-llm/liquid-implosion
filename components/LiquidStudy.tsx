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
  RotateCcw,
} from 'lucide-react';
import {
  SHIFTED_RECORD,
  VALID_RECORD,
  cacheFingerprint,
  serializeCacheRecord,
  type CacheRecord,
} from '../lib/model';

const RESEARCH_CUTOFF = '9 September 2026, 09:42 CEST';
const STEP_DELAY = 3600;

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
    body: 'The same byte string has the same SHA-256 fingerprint. The cache reports success without checking the second proof.',
  },
  {
    label: 'Peg-out',
    title: 'The federation pays two peg-outs together.',
    body: 'The two peg-outs total 3,998.67 BTC. Both appear as outputs in one Bitcoin transaction from the federation wallet.',
  },
] as const;

const TIMELINE = [
  {
    date: 'March 2019',
    title: 'A proof cache was added. Its key omitted two inputs used by the proof check.',
    href: 'https://github.com/ElementsProject/elements/commit/0b5066143dcdfc3ba7780d1a2c6f18c2c6fefd6a',
    label: 'Original code',
  },
  {
    date: '3 August–1 September 2026',
    title: 'A patch added those inputs, but joined four fields without recording their lengths.',
    href: 'https://github.com/ElementsProject/elements/commit/c26d719c29a40da280a825b25657e9c3d8bc7d99',
    label: 'Cache change',
  },
  {
    date: '6 September 2026',
    title: 'Liquid explorers split at a disputed block. Two peg-outs followed on one side.',
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
    title: 'Elements 23.3.4 was published as a pre-release with hardened proof-cache keys.',
    href: 'https://github.com/ElementsProject/elements/releases/tag/elements-23.3.4',
    label: 'Emergency release',
  },
] as const;

const SOURCES = [
  {
    group: 'Incident and transactions',
    links: [
      ['Liquid statement', 'https://x.com/Liquid_BTC/status/2096696272447218108'],
      ['Liquid incident report', 'https://x.com/Liquid_BTC/status/2097404704028545175'],
      ['Blockstream incident status', 'https://status.blockstream.com/incidents/b8b719f3-db70-4487-9cff-946e69509228'],
      ['Blockstream restart update', 'https://x.com/Blockstream/status/2097127976672342487'],
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
      ['2019 cache implementation', 'https://github.com/ElementsProject/elements/commit/0b5066143dcdfc3ba7780d1a2c6f18c2c6fefd6a'],
      ['2026 cache-key change', 'https://github.com/ElementsProject/elements/commit/c26d719c29a40da280a825b25657e9c3d8bc7d99'],
      ['Pull request #1592', 'https://github.com/ElementsProject/elements/pull/1592'],
      ['Cache hardening pull request #1600', 'https://github.com/ElementsProject/elements/pull/1600'],
      ['Elements 23.3.4 emergency pre-release', 'https://github.com/ElementsProject/elements/releases/tag/elements-23.3.4'],
      ['Current Elements releases', 'https://github.com/ElementsProject/elements/releases'],
    ],
  },
  {
    group: 'Protocol background and independent analysis',
    links: [
      ['How Liquid peg-outs work', 'https://docs.liquid.net/docs/advanced-pegin-pegout'],
      ['Liquid technical overview', 'https://docs.liquid.net/docs/technical-overview'],
      ['Independent forensic report', 'https://gist.github.com/1440000bytes/211ac92dd4433bb1a2e674bf0ff7db2e'],
    ],
  },
] as const;

export function LiquidStudy() {
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [run, setRun] = useState(0);
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
    if (shouldReduceMotion || !playing) return;

    const timer = window.setTimeout(() => {
      setStage((current) => (current + 1) % SEQUENCE.length);
    }, STEP_DELAY);

    return () => window.clearTimeout(timer);
  }, [playing, run, shouldReduceMotion, stage]);

  const fingerprintsMatch = useMemo(
    () => Boolean(validFingerprint) && validFingerprint === shiftedFingerprint,
    [shiftedFingerprint, validFingerprint],
  );

  const replay = () => {
    setStage(0);
    setPlaying(!shouldReduceMotion);
    setRun((current) => current + 1);
  };

  return (
    <div id="top" className="min-h-[100dvh] overflow-hidden bg-canvas text-ink">
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
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            className="relative mx-auto max-w-6xl"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
              Liquid Implosion · 6 September 2026
            </p>
            <h1 className="mt-4 max-w-5xl font-serif text-4xl leading-[1.02] text-white sm:text-6xl">
              How a cache bug led to a 3,998.67 BTC payout
            </h1>
            <div className="mt-7 grid gap-5 lg:grid-cols-2 lg:gap-12">
              <p className="font-sans text-base leading-relaxed text-ink">
                Liquid&apos;s incident report says a cache flaw allowed about 4,000 L-BTC without matching BTC backing. The SideSwap peg-out route then released 3,998.67 BTC from the federation wallet.
              </p>
              <p className="font-sans text-sm leading-relaxed text-ink-muted">
                The explorers split at the disputed block on 6 September. The transactions and cache code are public; the exact software and cached data on every server that signed the disputed chain are not.
              </p>
            </div>
            <NetworkSnapshot />
          </motion.div>
        </section>

        <section id="mechanism" className="scroll-mt-14 border-b border-white/10 bg-panel px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 grid gap-4 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <SectionLabel index="01">How the cache failed</SectionLabel>
                <h2 className="mt-5 font-serif text-3xl leading-tight text-white sm:text-5xl">How the cache confused different records</h2>
              </div>
              <p className="max-w-2xl font-sans text-sm leading-relaxed text-ink-muted lg:justify-self-end">
                This reconstruction uses fictional data and the browser’s SHA-256 implementation. It demonstrates the cache-key error; it is not a replay of the incident.
              </p>
            </div>
            <AutomatedReconstruction
              stage={stage}
              run={run}
              playing={playing}
              reducedMotion={Boolean(shouldReduceMotion)}
              fingerprintsMatch={fingerprintsMatch}
              fingerprint={validFingerprint}
              onTogglePlaying={() => setPlaying((current) => !current)}
              onReplay={replay}
              onAdvance={() => setStage((current) => (current + 1) % SEQUENCE.length)}
            />
          </div>
        </section>

        <section id="guidance" className="scroll-mt-14 border-b border-accent/50 bg-accent/[0.06] px-4 py-12 md:px-8 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <SectionLabel index="02">Status and guidance</SectionLabel>
              <h2 className="mt-5 font-serif text-3xl text-white sm:text-5xl">Liquid is still paused. The emergency release is public.</h2>
            </div>
            <div className="border-t border-white/15">
              <FactLine label="Network" text="Blockstream still lists the incident as active. The two public explorers still disagree, and neither tip has moved since the previous check." />
              <FactLine label="Software" text="Elements 23.3.4 was published on 9 September as a pre-release. It hardens the proof caches; its publication is not a restart notice." />
              <FactLine label="Funds" text="A confirmed transaction sent 3,400 BTC to the published federation return address. Roughly 598.5 BTC remains at the sender address." />
              <FactLine label="Users" text="Liquid says users do not need to take proactive steps. Check the incident page and your service before trying a transaction." />
              <a
                href="https://status.blockstream.com/incidents/b8b719f3-db70-4487-9cff-946e69509228"
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex min-h-12 items-center gap-3 border border-accent bg-accent px-5 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas transition-colors hover:bg-transparent hover:text-accent"
              >
                Open Blockstream status <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-14 border-b border-white/10 px-4 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <SectionLabel index="03">Timeline</SectionLabel>
                <p className="number-outline mt-6 font-serif text-[5rem] leading-none sm:text-[7rem]">3,998.67</p>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white">BTC paid for two Liquid peg-outs</p>
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
              <SectionLabel index="04">Sources and limits</SectionLabel>
              <h2 className="mt-5 font-serif text-3xl text-white sm:text-5xl">Evidence and unanswered questions</h2>
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
                <p>Blockstream calls the actors “purported white-hat hackers.” Their identity and intent have not been independently confirmed.</p>
                <p>A PGP-signed message placed on Bitcoin says the bridge nodes were patched. The signature does not identify its sender.</p>
                <p>Elements 23.3.4 is public as a pre-release. Its fix records field lengths in both proof-cache keys, includes a previously missing surjection-proof input, and adds an option to bypass the range-proof cache.</p>
                <p>The incident report gives 15:53:10 UTC for block 4,050,336. The block explorer records 13:53:10 UTC, so this page uses the block height and does not treat either time as settled.</p>
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

function AutomatedReconstruction({
  fingerprint,
  fingerprintsMatch,
  onAdvance,
  onReplay,
  onTogglePlaying,
  playing,
  reducedMotion,
  run,
  stage,
}: {
  fingerprint: string;
  fingerprintsMatch: boolean;
  onAdvance: () => void;
  onReplay: () => void;
  onTogglePlaying: () => void;
  playing: boolean;
  reducedMotion: boolean;
  run: number;
  stage: number;
}) {
  const current = SEQUENCE[stage];

  return (
    <div className="border-y border-white/20 bg-canvas/80">
      <div className="flex items-center justify-between gap-4 border-b border-white/15 px-4 py-3 sm:px-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">Five steps</p>
        <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted">{stage + 1} / {SEQUENCE.length}</p>
      </div>

      <div className="h-0.5 bg-white/10" aria-hidden="true">
        <motion.div
          key={`${run}-${stage}-${playing}`}
          className="h-full bg-accent"
          initial={{ width: `${(stage / SEQUENCE.length) * 100}%` }}
          animate={{ width: `${((stage + 1) / SEQUENCE.length) * 100}%` }}
          transition={{ duration: reducedMotion || !playing ? 0 : STEP_DELAY / 1000, ease: 'linear' }}
        />
      </div>

      <div className="grid min-h-[29rem] sm:min-h-[27rem] sm:grid-cols-[0.78fr_1.22fr]">
        <motion.div
          key={current.label}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.28 }}
          className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r sm:p-6"
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">{current.label}</p>
          <h2 className="mt-4 font-serif text-2xl leading-tight text-white sm:text-3xl">{current.title}</h2>
          <p className="mt-4 font-sans text-sm leading-relaxed text-ink-muted">{current.body}</p>
        </motion.div>

        <div className="flex min-h-72 items-center p-5 sm:p-7">
          <ReconstructionScene
            stage={stage}
            fingerprint={fingerprint}
            fingerprintsMatch={fingerprintsMatch}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>

      <div className="flex min-h-14 items-center justify-end gap-4 border-t border-white/15 px-3 sm:px-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex min-h-11 items-center gap-2 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted hover:text-white"
          >
            <RotateCcw size={13} /> Replay
          </button>
          {reducedMotion ? (
            <button
              type="button"
              onClick={onAdvance}
              className="inline-flex min-h-11 items-center gap-2 border border-white/20 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white hover:border-accent hover:text-accent"
            >
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onTogglePlaying}
              className="inline-flex min-h-11 items-center gap-2 border border-white/20 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-white hover:border-accent hover:text-accent"
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? 'Pause' : 'Continue'}
            </button>
          )}
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
      initial={reducedMotion ? false : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
      className="w-full"
    >
      {stage === 0 && <BalancedPeg />}
      {stage === 1 && <FirstCheck />}
      {stage === 2 && <BoundaryShift />}
      {stage === 3 && <CacheHit fingerprint={fingerprint} match={fingerprintsMatch} />}
      {stage === 4 && <ReservePayout reducedMotion={reducedMotion} />}
    </motion.div>
  );
}

function BalancedPeg() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <MarkerSet label="BTC reserve" filled />
      <div className="text-center">
        <div className="h-px w-8 bg-accent sm:w-12" />
        <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.12em] text-accent">1 : 1</p>
      </div>
      <MarkerSet label="L-BTC" />
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
  const bytes = serializeCacheRecord(VALID_RECORD).join(' ');

  return (
    <div className="space-y-5">
      <CacheRecordView label="Record A" record={VALID_RECORD} />
      <CacheRecordView label="Record B · different boundaries" record={SHIFTED_RECORD} />
      <div className="border-t border-white/15 pt-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-accent">The same bytes are sent to SHA-256</p>
        <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap border border-white/30 px-3 py-3 font-mono text-[9px] tracking-[0.08em] text-white">{bytes}</p>
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
      <span className="sr-only">Full SHA-256 fingerprint: {fingerprint}</span>
    </div>
  );
}

function ReservePayout({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted">Federation reserve</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }, (_, index) => (
            <motion.span
              key={index}
              className="aspect-square border border-white/35 bg-white/75"
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: index < 14 ? 0.08 : 0.85, x: index < 14 ? 12 : 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : index * 0.025 }}
            />
          ))}
        </div>
      </div>
      <ArrowRight size={22} className="text-accent" aria-hidden="true" />
      <div>
        <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted">Bitcoin payout</p>
        <p className="mt-3 font-serif text-3xl leading-none text-white sm:text-4xl">3,998.67</p>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-accent">BTC</p>
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
      <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <div className="mt-2 flex gap-1 overflow-hidden">
        {SEGMENTS.map(([key, segmentLabel, color]) => {
          const bytes = record[key];
          return (
            <div
              key={key}
              className={`min-w-0 border py-3 ${color}`}
              style={{ flexGrow: bytes.length, flexBasis: 0 }}
            >
              <p className="truncate px-2 font-mono text-[7px] uppercase tracking-[0.06em] text-ink-muted">{segmentLabel}</p>
              <p className="mt-1 truncate px-2 font-mono text-[8px] tracking-[0.06em] text-white sm:text-[9px]">{bytes.join(' ')}</p>
            </div>
          );
        })}
      </div>
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

function FactLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid gap-2 border-b border-white/10 py-5 sm:grid-cols-[7rem_1fr]">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">{label}</p>
      <p className="font-serif text-lg leading-snug text-white">{text}</p>
    </div>
  );
}

function NetworkSnapshot() {
  return (
    <div className="mt-8 grid grid-cols-2 border-y border-white/15 font-mono text-[8px] uppercase tracking-[0.12em] text-ink-muted lg:grid-cols-[1fr_1fr_1.7fr_auto]">
      <a
        href="https://status.blockstream.com/incidents/b8b719f3-db70-4487-9cff-946e69509228"
        target="_blank"
        rel="noreferrer"
        className="border-b border-r border-white/10 px-3 py-3 hover:text-white lg:border-b-0"
      >
        <span className="block">Incident page</span>
        <span className="mt-1 block text-[10px] text-accent">Active · says Liquid paused</span>
      </a>
      <a
        href="https://mempool.space/tx/a6d697a25266ce3c78774fd1d75f896b7af522ada209b0f6228ea497bc49a46d"
        target="_blank"
        rel="noreferrer"
        className="border-b border-white/10 px-3 py-3 hover:text-white lg:border-b-0 lg:border-r"
      >
        <span className="block">Returned on Bitcoin</span>
        <span className="mt-1 block text-[10px] text-white">3,400 BTC confirmed</span>
      </a>
      <div className="col-span-2 border-white/10 px-3 py-3 lg:col-span-1 lg:border-r">
        <span className="block">Public explorers show different latest blocks</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] normal-case tracking-normal">
          <a href="https://blockstream.info/liquid/" target="_blank" rel="noreferrer" className="text-white hover:text-accent">Blockstream 4,051,232</a>
          <span className="text-accent">≠</span>
          <a href="https://liquid.network/liquid/" target="_blank" rel="noreferrer" className="text-white hover:text-accent">liquid.network 4,050,335</a>
        </span>
      </div>
      <p className="col-span-2 px-3 py-3 lg:col-span-1 lg:text-right">Checked {RESEARCH_CUTOFF}</p>
    </div>
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
