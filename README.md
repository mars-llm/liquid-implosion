# Liquid Implosion

[Read the case study](https://mars-llm.github.io/liquid-implosion/)

Liquid’s incident report says a cache flaw allowed about 4,000 L-BTC without matching BTC backing. The federation’s batched Bitcoin transaction then paid 3,998.67 BTC across two peg-outs. Public explorers split at the disputed block on 6 September 2026.

The page links each claim to the public transactions, Blockstream’s statements or the relevant Elements code. A four-step walkthrough shows how different records can become the same cache input when field boundaries are missing. The real payout is shown separately.

The transactions and source code are public. The exact software builds and cached data on the servers that signed the disputed chain are not. The identity and intent of the actors are also unconfirmed.

Block production and transactions resumed on 10 September. Peg-outs remain disabled. SideSwap reopened peg-ins on 11 September while reporting 4,229 L-BTC in circulation against 3,627 BTC in the federation reserve. A confirmed transaction returned 3,400 BTC, and about 598.50 BTC remained at the reported address when the page was checked on 13 September at 09:39 CEST. At that time, the two public explorers agreed on the accepted chain. An independent exact-transaction monitor reported that all 608 expected legitimate transactions from the abandoned fork had reappeared on that chain and none of the eight tainted transactions had. Elements 23.3.4 is the latest signed release and hardens the proof-cache keys.

This project is not affiliated with Blockstream, Liquid or SideSwap.

## Local development

```bash
npm install
npm run dev
```

Node.js 24 or newer is required.

## Verification

```bash
npm run check
```

The production build is a static export in `out/` and is configured for the `/liquid-implosion/` GitHub Pages path.

## Sources

- [Liquid statement](https://x.com/Liquid_BTC/status/2096696272447218108)
- [Liquid incident report](https://x.com/Liquid_BTC/status/2097404704028545175)
- [Liquid transaction-resumption update](https://x.com/Liquid_BTC/status/2098140614239920622)
- [Blockstream incident status](https://status.blockstream.com/incidents/b8b719f3-db70-4487-9cff-946e69509228)
- [Blockstream restart update](https://x.com/Blockstream/status/2097127976672342487)
- [Blockstream recovery position](https://x.com/Blockstream/status/2098281867908690394)
- [BULL service update](https://x.com/BULLBITCOIN_/status/2098119275709915464)
- [SideSwap incident statement](https://sideswap.io/news/statement-on-the-liquid-network-incident-of-6-september-2026/)
- [SideSwap peg-in update](https://sideswap.io/news/liquid-peg-ins-are-open-again-on-sideswap/)
- [Primer transaction A](https://blockstream.info/liquid/tx/271147100a94f6337b6c3db39b30c92d5b97ed91597307b6f721f73a15187ec5)
- [Primer transaction B](https://blockstream.info/liquid/tx/71c93d4339fe8328981a2ec0dd23808d1ff104dc4c4cbcfc5c06fb2bb622f411)
- [Disputed Liquid transaction](https://blockstream.info/liquid/tx/f24a4b179b5cc7e88b25a763911f7cbdf2bf45d1d1b5ab611e94461cef0a183f)
- [Bitcoin federation payout](https://blockstream.info/tx/8db751a650ae2f12006b7e8c69a75e4df360e8afd6b9e05ae0b9fa6458a7b140)
- [3,400 BTC return transaction](https://mempool.space/tx/a6d697a25266ce3c78774fd1d75f896b7af522ada209b0f6228ea497bc49a46d)
- [2018 cache-key simplification](https://github.com/ElementsProject/elements/commit/957216523881768d9bcd6c5092dd5d50495dcd4e)
- [2026 cache-key change](https://github.com/ElementsProject/elements/commit/c26d719c29a40da280a825b25657e9c3d8bc7d99)
- [Elements pull request #1592](https://github.com/ElementsProject/elements/pull/1592)
- [Elements pull request #1600](https://github.com/ElementsProject/elements/pull/1600)
- [Elements 23.3.4 release](https://github.com/ElementsProject/elements/releases/tag/elements-23.3.4)
- [Liquid peg-out documentation](https://docs.liquid.net/docs/advanced-pegin-pegout)
- [Independent forensic report](https://gist.github.com/1440000bytes/211ac92dd4433bb1a2e674bf0ff7db2e)
- [Independent transaction replay monitor](https://github.com/orangesurf/liquid-transaction-replay-monitor)
- [Steven Roose code walkthrough](https://insider.btcpp.dev/p/how-cache-optimization-not-broken)

## License

[0BSD](LICENSE). You may use, copy, modify or distribute this project for any purpose, without attribution. The license includes warranty and liability disclaimers.
