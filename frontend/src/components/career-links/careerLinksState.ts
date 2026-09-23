// CareerLinks View State Management & Filter Logic

import type {
  CareerLink,
  CareerLinkCategory,
  UserCareerLink,
  CareerVerificationStatus,
  StarredCareerLink
} from '../../types';
import type { FilterTab } from './careerLinksTypes';
import { getLinkVerificationStatus } from './careerLinksTypes';

export class CareerLinksState {
  globalLinks: CareerLink[] = [];
  userLinks: UserCareerLink[] = [];
  starredItems: StarredCareerLink[] = [];
  starredUrls = new Set<string>();
  activeFilter: FilterTab = 'all';
  activeSector: string = 'all';
  activeVerificationFilter: CareerVerificationStatus = 'all';
  isSectorDropdownOpen = false;
  sectorSearchQuery = '';
  searchQuery = '';
  isLoading = true;
  editingUserLink: UserCareerLink | null = null;
  showAddForm = false;
  readonly verifyingLinkIds = new Set<string>();

  resetOnNavigate(): void {
    this.activeFilter = 'all';
    this.activeSector = 'all';
    this.activeVerificationFilter = 'all';
    this.verifyingLinkIds.clear();
    this.isSectorDropdownOpen = false;
    this.sectorSearchQuery = '';
    this.searchQuery = '';
    this.showAddForm = false;
    this.editingUserLink = null;
    this.isLoading = true;
  }

  applyFilters<T extends {
    url: string;
    name: string;
    category: CareerLinkCategory;
    sector?: string;
    isVerified: boolean;
    lastVerifiedAt?: string | null;
  }>(items: T[]): T[] {
    return items.filter((item) => {
      let matchCat = true;
      if (this.activeFilter === 'starred') {
        matchCat = this.starredUrls.has(item.url);
      } else if (this.activeFilter !== 'all') {
        matchCat = item.category === this.activeFilter;
      }

      const matchSector = this.activeSector === 'all' || item.sector === this.activeSector;
      const matchSearch =
        !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (item.sector && item.sector.toLowerCase().includes(this.searchQuery.toLowerCase()));

      let matchVerification = true;
      if (this.activeVerificationFilter !== 'all') {
        const vStatus = getLinkVerificationStatus(item as any);
        matchVerification = vStatus === this.activeVerificationFilter;
      }

      return matchCat && matchSector && matchSearch && matchVerification;
    });
  }
}
