import { useDownloadStore } from '../store/downloadStore';
import { Book } from '../types';

export function useCoverSource(book: Book | null | undefined): { uri: string } | null {
  const localUri = useDownloadStore(s => book ? s.localCoverUris[book.id] : undefined);
  if (localUri) return { uri: localUri };
  if (book?.cover_url) return { uri: book.cover_url };
  return null;
}
