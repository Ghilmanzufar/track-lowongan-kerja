// Client-side Hash Router and View Dispatcher for JobTrack

import { store } from './services/store';
import { renderDashboardView } from './components/dashboard';
import { renderBoardView } from './components/BoardView';
import { renderListView } from './components/ListView';
import { renderAgendaView } from './components/AgendaView';
import { renderAnalyticsView } from './components/AnalyticsView';
import { renderCareerLinksView } from './components/CareerLinksView';
import { renderDocumentVaultView } from './components/DocumentVaultView';
import { renderTrashView } from './components/TrashView';
import { renderProfileView } from './components/ProfileView';
import { renderFooter } from './components/Footer';
import { renderApplicationDetailView } from './components/ApplicationDetailView';
import { renderStageDetailView } from './components/StageDetailView';
import { TabKey } from './components/DetailModal';
import { AppView, ApplicationStage } from './types';
import { closeMobileSidebar } from './ui/layout';

// Dynamic Topbar View Headings
const viewMeta: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Ringkasan aktivitas pelacakan karir dan perkembangan terkini'
  },
  board: {
    title: 'Kanban Lamaran',
    subtitle: 'Visualisasi alur tahapan pipeline lamaran'
  },
  list: {
    title: 'Daftar Lamaran',
    subtitle: 'Tabel ringkas seluruh lamaran pekerjaan tersimpan'
  },
  agenda: {
    title: 'Agenda & Pengingat',
    subtitle: 'Jadwal wawancara, tes seleksi, dan tenggat waktu'
  },
  analytics: {
    title: 'Analitik & Metrik',
    subtitle: 'Insights tingkat konversi dan rasio efektivitas'
  },
  'career-links': {
    title: 'Direktori Karir',
    subtitle: 'Kumpulan link karir perusahaan swasta, BUMN, kementerian, dan multinasional'
  },
  documents: {
    title: 'Vault Dokumen & Resume',
    subtitle: 'Kelola master CV, cover letter, dan portofolio dengan versioning terstruktur'
  },
  trash: {
    title: 'Tempat Sampah / Recently Deleted',
    subtitle: 'Pulihkan item yang terhapus kapan saja atau hapus secara permanen'
  },
  profile: {
    title: 'Profil Pengguna',
    subtitle: 'Informasi akun, ringkasan aktivitas, dan pengaturan'
  },
  application: {
    title: 'Workspace Lamaran',
    subtitle: 'Detail komprehensif, persiapan wawancara, catatan, dan dokumen lamaran'
  },
  stage: {
    title: 'Tahap Lamaran',
    subtitle: 'Daftar lengkap lowongan pekerjaan pada tahap pipeline'
  }
};

export function renderCurrentView(): void {
  const viewContainer = document.getElementById('viewContainer');
  const navTabs = document.getElementById('navTabs');
  if (!viewContainer) return;

  const currentView = store.getView();
  document.body.setAttribute('data-current-view', currentView);

  // Update topbar title & subtitle
  const titleEl = document.getElementById('topbarViewTitle');
  const subEl = document.getElementById('topbarViewSubtitle');
  if (titleEl && viewMeta[currentView]) titleEl.textContent = viewMeta[currentView].title;
  if (subEl && viewMeta[currentView]) subEl.textContent = viewMeta[currentView].subtitle;

  // Update tab button active states
  if (navTabs) {
    navTabs.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
      const view = btn.getAttribute('data-view');
      btn.classList.toggle('active', view === currentView);
    });
  }

  // Update badge counters
  const allItems = store.getItems();
  const filteredItems = store.getFilteredItems();

  const countBoard = document.getElementById('tabCountBoard');
  const countList = document.getElementById('tabCountList');
  const countAgenda = document.getElementById('tabCountAgenda');

  if (countBoard) countBoard.textContent = String(allItems.length);
  if (countList) countList.textContent = String(filteredItems.length);

  if (countAgenda) {
    const activeTasks = allItems.flatMap((i) => i.tasks || []).filter((t) => t.status === 'Open');
    countAgenda.textContent = String(activeTasks.length);
  }

  const countDocs = document.getElementById('tabCountDocuments');
  if (countDocs) {
    countDocs.textContent = String(store.getUserDocuments().length);
  }

  const countTrash = document.getElementById('tabCountTrash');
  if (countTrash) {
    countTrash.textContent = String(store.getTrashSummary().total);
  }

  // Render View Component
  viewContainer.innerHTML = '';
  switch (currentView) {
    case 'dashboard':
      renderDashboardView(viewContainer);
      break;
    case 'board':
      renderBoardView(viewContainer);
      break;
    case 'list':
      renderListView(viewContainer);
      break;
    case 'agenda':
      renderAgendaView(viewContainer);
      break;
    case 'analytics':
      renderAnalyticsView(viewContainer);
      break;
    case 'career-links':
      renderCareerLinksView(viewContainer);
      break;
    case 'documents':
      renderDocumentVaultView(viewContainer);
      break;
    case 'trash':
      renderTrashView(viewContainer);
      break;
    case 'profile':
      renderProfileView(viewContainer);
      break;
    case 'application': {
      const rawHash = window.location.hash.slice(1);
      if (rawHash.startsWith('application/')) {
        const pathPart = rawHash.slice('application/'.length);
        const [appId, queryStr] = pathPart.split('?');
        let tabKey: TabKey | undefined;
        if (queryStr) {
          const params = new URLSearchParams(queryStr);
          const tabParam = params.get('tab');
          if (tabParam) tabKey = tabParam as TabKey;
        }
        renderApplicationDetailView(viewContainer, appId, tabKey);
      }
      break;
    }
    case 'stage': {
      const rawHash = window.location.hash.slice(1);
      let stageKey: ApplicationStage = 'Applied';
      if (rawHash.startsWith('stage/')) {
        stageKey = rawHash.slice('stage/'.length).split('?')[0] as ApplicationStage;
      }
      renderStageDetailView(viewContainer, stageKey);
      break;
    }
  }

  // Always render subtle footer at the bottom of views
  renderFooter(viewContainer);
}

export function handleRoute(): void {
  const rawHash = window.location.hash.slice(1);
  if (rawHash.startsWith('application/')) {
    store.setView('application');
    return;
  }
  if (rawHash.startsWith('stage/')) {
    store.setView('stage');
    return;
  }
  const hash = rawHash as AppView;
  const validViews: AppView[] = ['dashboard', 'board', 'list', 'agenda', 'analytics', 'career-links', 'documents', 'trash', 'profile'];
  if (validViews.includes(hash)) {
    store.setView(hash);
  } else {
    window.location.hash = 'dashboard';
  }
}

export function initRouter(): void {
  const navTabs = document.getElementById('navTabs');

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // Tab click events
  navTabs?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.tab-btn');
    if (!btn) return;
    const view = btn.getAttribute('data-view') as AppView;
    if (view) {
      store.setView(view);
      window.location.hash = view;
      closeMobileSidebar();
    }
  });

  // Subscribe to store updates
  store.subscribe(renderCurrentView);
  renderCurrentView();
}
