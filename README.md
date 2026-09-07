# Liquid Implosion

[Read the case study](https://mars-llm.github.io/liquid-implosion/)

On 6 September 2026, Liquid split into two versions of its transaction history. Two peg-outs accepted on one side were later paid together in one Bitcoin transaction, sending 3,998.67 BTC from the federation wallet.

The page links each claim to the public transactions, Blockstream’s statements or the relevant Elements code. A five-step reconstruction shows how different records can become the same cache input when field boundaries are missing. It uses fictional data and the browser’s SHA-256 implementation; it does not replay the incident, validate a real range proof or create a transaction.

The transactions and source code are public. The exact software builds and cached data on the servers that signed the disputed chain are not. The identity and intent of the actors are also unconfirmed.

The status snapshot on the page was checked on 7 September 2026 at 18:58 CEST. This project is not affiliated with Blockstream, Liquid or SideSwap.

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
- [Blockstream incident status](https://status.blockstream.com/incidents/b8b719f3-db70-4487-9cff-946e69509228)
- [Disputed Liquid transaction](https://blockstream.info/liquid/tx/f24a4b179b5cc7e88b25a763911f7cbdf2bf45d1d1b5ab611e94461cef0a183f)
- [Bitcoin federation payout](https://blockstream.info/tx/8db751a650ae2f12006b7e8c69a75e4df360e8afd6b9e05ae0b9fa6458a7b140)
- [2019 cache implementation](https://github.com/ElementsProject/elements/commit/0b5066143dcdfc3ba7780d1a2c6f18c2c6fefd6a)
- [2026 cache-key change](https://github.com/ElementsProject/elements/commit/c26d719c29a40da280a825b25657e9c3d8bc7d99)
- [Elements pull request #1592](https://github.com/ElementsProject/elements/pull/1592)
- [Liquid peg-out documentation](https://docs.liquid.net/docs/advanced-pegin-pegout)
- [Independent forensic report](https://gist.github.com/1440000bytes/211ac92dd4433bb1a2e674bf0ff7db2e)

## License

[0BSD](LICENSE). You may use, copy, modify or distribute this project for any purpose, without attribution. The license includes warranty and liability disclaimers.
