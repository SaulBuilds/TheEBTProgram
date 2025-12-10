import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import SharePageClient from './SharePageClient';

interface Props {
  params: Promise<{ memeId: string }>;
}

// Generate dynamic metadata for Twitter/Open Graph cards
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { memeId } = await params;
  const id = parseInt(memeId, 10);

  if (isNaN(id)) {
    return {
      title: 'EBT Meme | The EBT Program',
      description: 'Blockchain welfare memes for the modern breadline.',
    };
  }

  try {
    const meme = await prisma.memeGeneration.findUnique({
      where: { id },
    });

    if (!meme || !meme.imageUrl) {
      return {
        title: 'EBT Meme | The EBT Program',
        description: 'Blockchain welfare memes for the modern breadline.',
      };
    }

    // For base64 images, we need to serve them through an API route
    const imageUrl = meme.imageUrl.startsWith('data:')
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://web3welfare.com'}/api/memes/image/${id}`
      : meme.imageUrl;

    return {
      title: 'EBT Meme | The EBT Program',
      description: 'Made with the EBT Meme Machine. Blockchain welfare for the modern breadline.',
      openGraph: {
        title: 'EBT Meme',
        description: 'Made with the EBT Meme Machine. Blockchain welfare for the modern breadline.',
        images: [
          {
            url: imageUrl,
            width: 1024,
            height: 1024,
            alt: 'EBT Meme',
          },
        ],
        type: 'website',
        siteName: 'The EBT Program',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'EBT Meme',
        description: 'Made with the EBT Meme Machine. Blockchain welfare for the modern breadline.',
        images: [imageUrl],
      },
    };
  } catch {
    return {
      title: 'EBT Meme | The EBT Program',
      description: 'Blockchain welfare memes for the modern breadline.',
    };
  }
}

export default async function SharePage({ params }: Props) {
  const { memeId } = await params;
  const id = parseInt(memeId, 10);

  if (isNaN(id)) {
    redirect('/memes');
  }

  let imageUrl: string | null = null;

  try {
    const meme = await prisma.memeGeneration.findUnique({
      where: { id },
    });

    if (meme?.imageUrl) {
      imageUrl = meme.imageUrl;
    }
  } catch {
    // Fall through to redirect
  }

  if (!imageUrl) {
    redirect('/memes');
  }

  return <SharePageClient memeId={id} imageUrl={imageUrl} />;
}
