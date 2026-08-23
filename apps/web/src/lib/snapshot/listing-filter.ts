import type { Prisma } from '@robot-jobs-board/db';
import type { ListingFilter } from '@robot-jobs-board/snapshot';

export function listingFilterToPrisma(filter: ListingFilter): Prisma.JobWhereInput {
  switch (filter.kind) {
    case 'remote':
      return { isRemote: true };
    case 'city':
      return { city: filter.value };
    case 'region':
      return { region: filter.value };
    case 'country':
      return { country: filter.value };
    case 'domain':
      return { robotDomains: { some: { domainId: filter.domainId } } };
    case 'tag':
      return { techTags: { some: { techTagId: filter.tagId } } };
    case 'and':
      return { AND: filter.filters.map(listingFilterToPrisma) };
    case 'or':
      return { OR: filter.filters.map(listingFilterToPrisma) };
    default:
      return {};
  }
}
