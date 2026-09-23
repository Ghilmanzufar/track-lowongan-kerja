// Interview Round Navigation Sub-component

import type { InterviewItem } from '../../../types';
import { escapeHtml } from '../../../utils';

export function renderRoundNavHtml(interviews: InterviewItem[], currentInterviewId: string): string {
  return `
    <div class="interview-rounds-bar">
      ${interviews.map((iv, idx) => {
        const isActive = iv.id === currentInterviewId;
        return `
          <button class="interview-round-tab ${isActive ? 'active' : ''}" data-round-id="${iv.id}" type="button">
            <span class="status-dot ${iv.status}"></span>
            <span class="badge-interview-type ${iv.type}">${iv.type}</span>
            <span>${escapeHtml(iv.roundTitle || `Round ${idx + 1}`)}</span>
          </button>
        `;
      }).join('')}
      <button class="btn btn-secondary btn-sm" id="btnAddNewRound" type="button" style="padding: 5px 10px; font-size: 11.5px; gap: 4px;">
        <span>+</span> Tambah Sesi
      </button>
    </div>
  `;
}
