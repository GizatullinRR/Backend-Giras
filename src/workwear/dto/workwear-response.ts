import { Workwear } from '../workwear.entity';

/** API response: DB keys + public URLs for clients. */
export type WorkwearResponse = Omit<Workwear, 'images'> & {
  imageKeys: string[];
  images: string[];
};
