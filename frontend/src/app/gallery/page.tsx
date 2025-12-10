import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled to avoid wagmi provider issues
const GalleryContent = dynamic(() => import('./GalleryContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-ebt-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-mono">Loading gallery...</p>
      </div>
    </div>
  ),
});

export const metadata = {
  title: 'Meme Gallery | The EBT Program',
  description: 'Browse and create EBT-style memes. Community propaganda by the people, for the algorithm.',
};

export default function GalleryPage() {
  return <GalleryContent />;
}
