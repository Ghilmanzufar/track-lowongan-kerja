// Interview 7 Sub-tabs Navigation Bar Sub-component

import type { WawancaraSubtab } from './wawancaraConstants';
import { getIconSvg } from '../../../utils/icons';

export function renderSubtabNavHtml(activeSubTab: WawancaraSubtab): string {
  return `
    <div class="wawancara-subtabs">
      <button class="wawancara-subtab-btn ${activeSubTab === 'schedule' ? 'active' : ''}" data-subtab="schedule" type="button">
        ${getIconSvg('clock', { size: 13 })} Jadwal & Pewawancara
      </button>
      <button class="wawancara-subtab-btn ${activeSubTab === 'prep' ? 'active' : ''}" data-subtab="prep" type="button">
        ${getIconSvg('clipboard', { size: 13 })} Persiapan & Riset
      </button>
      <button class="wawancara-subtab-btn ${activeSubTab === 'questions' ? 'active' : ''}" data-subtab="questions" type="button">
        ${getIconSvg('helpCircle', { size: 13 })} Pertanyaan & Q&A
      </button>
      <button class="wawancara-subtab-btn ${activeSubTab === 'star' ? 'active' : ''}" data-subtab="star" type="button">
        ${getIconSvg('star', { size: 13 })} Jawaban STAR
      </button>
      <button class="wawancara-subtab-btn ${activeSubTab === 'notes' ? 'active' : ''}" data-subtab="notes" type="button">
        ${getIconSvg('fileText', { size: 13 })} Catatan Sesi
      </button>
      <button class="wawancara-subtab-btn ${activeSubTab === 'evaluation' ? 'active' : ''}" data-subtab="evaluation" type="button">
        ${getIconSvg('barChart', { size: 13 })} Evaluasi
      </button>
      <button class="wawancara-subtab-btn ${activeSubTab === 'followup' ? 'active' : ''}" data-subtab="followup" type="button">
        ${getIconSvg('mail', { size: 13 })} Follow-up
      </button>
    </div>
  `;
}
