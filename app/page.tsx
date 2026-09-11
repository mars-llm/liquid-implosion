import { LiquidStudy } from '../components/LiquidStudy';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Liquid Implosion',
  description: 'How a cache bug moved almost 4,000 BTC out of Liquid’s reserve, what has reopened, and what the public record still cannot answer.',
  url: 'https://mars-llm.github.io/liquid-implosion/',
  about: [
    { '@type': 'Thing', name: 'Liquid Network' },
    { '@type': 'SoftwareApplication', name: 'Elements' },
    { '@type': 'Thing', name: 'Bitcoin' },
  ],
  creator: [
    {
      '@type': 'Person',
      name: 'Marsmensch',
      url: 'https://github.com/marsmensch',
    },
    {
      '@type': 'Organization',
      name: 'mars-llm',
      url: 'https://github.com/mars-llm',
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LiquidStudy />
    </>
  );
}
