// Career Links Event Binding & User Interaction Handlers

import type { CareerLink, CareerLinkCategory, UserCareerLink, CareerVerificationStatus } from '../../types';
import type { CareerLinksState } from './careerLinksState';
import type { FilterTab } from './careerLinksTypes';
import { getLinkVerificationStatus } from './careerLinksTypes';
import {
  createUserCareerLink,
  updateUserCareerLink,
  deleteUserCareerLink,
  verifyCareerLink,
  toggleStarCareerLink
} from '../../services/api';
import { toast } from '../../ui/toast';

export function attachCareerLinksEvents(
  container: HTMLElement,
  state: CareerLinksState,
  onRerender: () => void
): void {
  // Search
  const searchInput = container.querySelector<HTMLInputElement>('#clSearchInput');
  let debounce: ReturnType<typeof setTimeout>;
  searchInput?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.searchQuery = searchInput.value.trim();
      onRerender();
    }, 200);
  });

  // Custom Sector Dropdown Trigger
  const triggerBtn = container.querySelector('#clSectorTrigger');
  triggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.isSectorDropdownOpen = !state.isSectorDropdownOpen;
    onRerender();
    if (state.isSectorDropdownOpen) {
      setTimeout(() => {
        container.querySelector<HTMLInputElement>('#clSectorFilterInput')?.focus();
      }, 50);
    }
  });

  // Prevent menu clicks from closing the dropdown
  container.querySelector('#clSectorMenu')?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Search input inside sector dropdown
  const sectorFilterInput = container.querySelector<HTMLInputElement>('#clSectorFilterInput');
  sectorFilterInput?.addEventListener('input', () => {
    state.sectorSearchQuery = sectorFilterInput.value;
    onRerender();
    const updatedInput = container.querySelector<HTMLInputElement>('#clSectorFilterInput');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
    }
  });

  // Select sector option
  container.querySelectorAll<HTMLElement>('.cl-sector-opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      state.activeSector = opt.dataset.sectorVal || 'all';
      state.isSectorDropdownOpen = false;
      state.sectorSearchQuery = '';
      onRerender();
    });
  });

  // Close dropdown on outside click
  const handleOutsideClick = (e: MouseEvent) => {
    const dropdown = container.querySelector('#clSectorDropdown');
    if (dropdown && !dropdown.contains(e.target as Node)) {
      if (state.isSectorDropdownOpen) {
        state.isSectorDropdownOpen = false;
        onRerender();
      }
    }
  };
  document.addEventListener('click', handleOutsideClick, { once: true });

  // Clear sector button
  const clearSector = () => {
    state.activeSector = 'all';
    state.isSectorDropdownOpen = false;
    state.sectorSearchQuery = '';
    onRerender();
  };
  container.querySelector('#clIndicatorClose')?.addEventListener('click', clearSector);

  // Reset all filters
  container.querySelector('#clResetAllFilters')?.addEventListener('click', () => {
    state.activeSector = 'all';
    state.activeFilter = 'all';
    state.activeVerificationFilter = 'all';
    state.searchQuery = '';
    state.isSectorDropdownOpen = false;
    state.sectorSearchQuery = '';
    onRerender();
  });

  // Filter tabs
  container.querySelector('#clFilterTabs')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!btn) return;
    state.activeFilter = btn.dataset.filter as FilterTab;
    onRerender();
  });

  // Verification filter tabs
  container.querySelector('#clVstatusTabs')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-vfilter]');
    if (!btn) return;
    state.activeVerificationFilter = btn.dataset.vfilter as CareerVerificationStatus;
    onRerender();
  });

  // Clear verification filter indicator
  container.querySelector('#clVstatusIndicatorClose')?.addEventListener('click', () => {
    state.activeVerificationFilter = 'all';
    onRerender();
  });

  // Add personal
  container.querySelector('#clBtnAddPersonal')?.addEventListener('click', () => {
    state.editingUserLink = null;
    state.showAddForm = true;
    onRerender();
    container.querySelector<HTMLInputElement>('#clFormName')?.focus();
  });

  // Cancel form
  const cancelForm = () => {
    state.showAddForm = false;
    state.editingUserLink = null;
    onRerender();
  };
  container.querySelector('#clFormCancel')?.addEventListener('click', cancelForm);
  container.querySelector('#clFormCancel2')?.addEventListener('click', cancelForm);

  // Submit form (add or edit)
  container.querySelector('#clFormSubmit')?.addEventListener('click', async () => {
    const nameEl = container.querySelector<HTMLInputElement>('#clFormName');
    const urlEl = container.querySelector<HTMLInputElement>('#clFormUrl');
    const catEl = container.querySelector<HTMLSelectElement>('#clFormCategory');
    const secEl = container.querySelector<HTMLSelectElement>('#clFormSector');
    const notesEl = container.querySelector<HTMLInputElement>('#clFormNotes');

    const name = nameEl?.value.trim() ?? '';
    const url = urlEl?.value.trim() ?? '';
    const category = (catEl?.value ?? 'Swasta') as CareerLinkCategory;
    const sector = secEl?.value.trim() || undefined;
    const notes = notesEl?.value.trim() ?? '';

    if (!name || !url) {
      toast('Nama dan URL wajib diisi.', 'error');
      return;
    }

    const submitBtn = container.querySelector<HTMLButtonElement>('#clFormSubmit');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (state.editingUserLink) {
        const updated = await updateUserCareerLink(state.editingUserLink.id, {
          name,
          url,
          category,
          sector,
          notes: notes || undefined
        });
        const idx = state.userLinks.findIndex((l) => l.id === updated.id);
        if (idx !== -1) state.userLinks[idx] = updated;
        toast('Link berhasil diperbarui.', 'success');
      } else {
        const created = await createUserCareerLink({
          name,
          url,
          category,
          sector,
          notes: notes || undefined
        });
        state.userLinks.push(created);
        toast('Link berhasil ditambahkan.', 'success');
      }
      state.showAddForm = false;
      state.editingUserLink = null;
    } catch (e: any) {
      toast(e.message ?? 'Terjadi kesalahan.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      onRerender();
    }
  });

  // Edit personal link
  container.querySelectorAll<HTMLButtonElement>('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.editId!;
      state.editingUserLink = state.userLinks.find((l) => l.id === id) ?? null;
      state.showAddForm = false;
      onRerender();
      container.querySelector<HTMLInputElement>('#clFormName')?.focus();
    });
  });

  // Delete personal link
  container.querySelectorAll<HTMLButtonElement>('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteId!;
      const link = state.userLinks.find((l) => l.id === id);
      if (!link) return;
      if (!confirm(`Hapus link "${link.name}"?`)) return;

      try {
        await deleteUserCareerLink(id);
        state.userLinks = state.userLinks.filter((l) => l.id !== id);
        toast('Link dihapus.', 'info');
      } catch (e: any) {
        toast(e.message ?? 'Gagal menghapus.', 'error');
      }
      onRerender();
    });
  });

  // Verify link on-demand (Live HTTP Probe)
  container.querySelectorAll<HTMLButtonElement>('[data-verify-id]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.verifyId!;
      const isUser = btn.dataset.isUser === 'true';

      if (state.verifyingLinkIds.has(id)) return;
      state.verifyingLinkIds.add(id);
      onRerender();

      try {
        const updated = await verifyCareerLink(id, isUser);
        if (isUser) {
          const idx = state.userLinks.findIndex((l) => l.id === id);
          if (idx !== -1) state.userLinks[idx] = updated as UserCareerLink;
        } else {
          const idx = state.globalLinks.findIndex((l) => l.id === id);
          if (idx !== -1) state.globalLinks[idx] = updated as CareerLink;
        }

        const vStatus = getLinkVerificationStatus(updated as any);
        if (vStatus === 'verified_recently') {
          toast(
            `Link "${updated.name}" terverifikasi aktif (${(updated as any).verifiedSource || '200 OK'})`,
            'success'
          );
        } else if (vStatus === 'broken') {
          toast(
            `Link "${updated.name}" tidak dapat diakses (${(updated as any).verifiedSource || 'Error / 404'})`,
            'warning'
          );
        } else {
          toast('Status verifikasi diperbarui.', 'info');
        }
      } catch (err: any) {
        toast(err.message ?? 'Gagal memverifikasi link.', 'error');
      } finally {
        state.verifyingLinkIds.delete(id);
        onRerender();
      }
    });
  });

  // Star toggle event
  container.querySelectorAll<HTMLButtonElement>('[data-star-btn]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = btn.dataset.starUrl!;
      const name = decodeURIComponent(btn.dataset.starName || '');
      const category = (btn.dataset.starCat as CareerLinkCategory) || 'Swasta';
      const sector = btn.dataset.starSec || undefined;
      const careerLinkId = btn.dataset.starGid || undefined;
      const userLinkId = btn.dataset.starUid || undefined;

      const willBeStarred = !state.starredUrls.has(url);

      // Optimistic update
      if (willBeStarred) {
        state.starredUrls.add(url);
        state.starredItems.push({
          id: 'temp-' + Date.now(),
          userId: '',
          name,
          url,
          category,
          sector,
          careerLinkId,
          userLinkId,
          createdAt: new Date().toISOString()
        });
      } else {
        state.starredUrls.delete(url);
        state.starredItems = state.starredItems.filter((s) => s.url !== url);
      }

      onRerender();

      try {
        const res = await toggleStarCareerLink({
          url,
          name,
          category,
          sector,
          careerLinkId,
          userLinkId
        });

        if (res.starred) {
          toast(`"${name}" ditambahkan ke Favorit ⭐`, 'success');
        } else {
          toast(`"${name}" dihapus dari Favorit`, 'info');
        }
      } catch (err: any) {
        // Rollback on error
        if (willBeStarred) {
          state.starredUrls.delete(url);
          state.starredItems = state.starredItems.filter((s) => s.url !== url);
        } else {
          state.starredUrls.add(url);
        }
        onRerender();
        toast(err.message ?? 'Gagal memperbarui favorit.', 'error');
      }
    });
  });

  // Shortcut to view all starred
  container.querySelector('#clFilterStarredBtn')?.addEventListener('click', () => {
    state.activeFilter = 'starred';
    onRerender();
  });

  // Reset to all tab from empty starred view
  container.querySelector('#clResetToAllTab')?.addEventListener('click', () => {
    state.activeFilter = 'all';
    onRerender();
  });
}
