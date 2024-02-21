import type { FunctionComponent } from 'react';
import { StylingHelper } from '../utils';

type mediaData = {
  src: string;
  alt?: string;
};

export interface CardMediaProps {
  /**
   * Optional class name for the card component.
   */
  className?: string;

  /**
   * Optional media type for the card component.
   */
  mediaType?: 'video' | 'image' | 'iframe';

  mediaData: mediaData;
}

/**
 * The MediaCard component is the media of the card
 */
export const CardMedia: FunctionComponent<CardMediaProps> = ({
  className,
  mediaType,
  mediaData,
}: CardMediaProps) => {
  const mediaClass = StylingHelper.classNames([
    className,
    'rounded-xl object-cover w-full m-auto',
    {
      'max-w-80': mediaType === 'image',
    },
  ]);

  if (mediaType === 'image') {
    return (
      <img className={mediaClass} src={mediaData.src} alt={mediaData?.alt} />
    );
  }
  if (mediaType === 'video') {
    return (
      <video className={mediaClass} title={mediaData?.alt}>
        <source src={mediaData.src} />
      </video>
    );
  }
  return (
    <iframe
      className={mediaClass}
      src={mediaData.src}
      title={mediaData?.alt}
    ></iframe>
  );
};
