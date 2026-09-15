// Offer & Salary Comparison Calculator Modal Component
// Allows side-by-side comparison of 2 or 3 job offers/applications

import { store } from '../services/store';
import { escapeHtml, formatSalary } from '../utils';

export class OfferComparisonModal {
  private static instance: OfferComparisonModal | null = null;
  private dialog: HTMLDialogElement;
  private selectedAppIds: string[] = [];

  private constructor() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'app-dialog offer-comparison-dialog';
    this.dialog.id = 'offerComparisonDialog';
    this.dialog.style.maxWidth = '900px';
    this.dialog.style.width = '92vw';
    this.dialog.style.padding = '0';
    this.dialog.style.borderRadius = 'var(--radius-md)';
    this.dialog.style.border = '1px solid var(--border-color)';
    this.dialog.style.backgroundColor = 'var(--bg-surface)';
    this.dialog.style.color = 'var(--text-primary)';
    this.dialog.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) this.close();
    });

    document.body.appendChild(this.dialog);
  }

  public static open(): void {
    if (!OfferComparisonModal.instance) {
      OfferComparisonModal.instance = new OfferComparisonModal();
    }
    const allItems = store.getItems();
    // Default select up to 3 applications that have offers or are in interview/applied
    const prioritized = allItems.filter(i => ['Offer', 'Accepted', 'Interview', 'Screening'].includes(i.application.stage));
    OfferComparisonModal.instance.selectedAppIds = (prioritized.length >= 2 ? prioritized : allItems)
      .slice(0, 3)
      .map(i => i.application.id);

    OfferComparisonModal.instance.render();
    OfferComparisonModal.instance.dialog.showModal();
  }

  public close(): void {
    this.dialog.close();
  }

  private render(): void {
    const allItems = store.getItems();
    const selectedItems = allItems.filter(i => this.selectedAppIds.includes(i.application.id));

    this.dialog.innerHTML = `
      <div style="display: flex; flex-direction: column; max-height: 85vh;">
        <!-- Modal Header -->
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background-color: var(--bg-surface);">
          <div>
            <h2 style="font-size: 16px; font-weight: 700; margin: 0 0 2px 0; display: flex; align-items: center; gap: 8px;">
              <span>⚖️</span> Kalkulator Komparasi Penawaran & Gaji
            </h2>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">
              Bandingkan penawaran kerja, benefit, fleksibilitas kerja, dan estimasi take-home pay berdampingan.
            </p>
          </div>
          <button type="button" class="btn btn-secondary btn-icon" id="btnCloseOfferModal" style="border-radius: 50%; width: 32px; height: 32px;">✕</button>
        </div>

        <!-- Modal Body -->
        <div style="padding: 20px; overflow-y: auto;">
          
          <!-- Select Candidates Selector -->
          <div style="margin-bottom: 16px; background-color: var(--bg-subtle); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px; color: var(--text-secondary);">
              PILIH LAMARAN YANG DIBANDINGKAN (Maksimal 3):
            </label>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${allItems.map(item => {
                const isChecked = this.selectedAppIds.includes(item.application.id);
                return `
                  <label style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; background-color: ${isChecked ? 'rgba(37,99,235,0.1)' : 'var(--bg-surface)'}; border: 1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}; border-radius: var(--radius-xs); cursor: pointer; font-size: 12px;">
                    <input type="checkbox" class="offer-app-picker" value="${item.application.id}" ${isChecked ? 'checked' : ''} />
                    <span><strong>${escapeHtml(item.company.name)}</strong> - ${escapeHtml(item.jobPosting.title)}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Comparison Table -->
          ${selectedItems.length === 0 ? `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 13px;">
              Pilih minimal 1 atau 2 lamaran di atas untuk melihat perbandingan.
            </div>
          ` : `
            <div class="comparison-table-wrapper">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th class="feature-label">Faktor Perbandingan</th>
                    ${selectedItems.map(item => `
                      <th>
                        <div class="comparison-card-top">
                          <span style="font-size: 14px; font-weight: 700; color: var(--text-primary);">${escapeHtml(item.company.name)}</span>
                          <span style="font-size: 12px; color: var(--text-secondary);">${escapeHtml(item.jobPosting.title)}</span>
                        </div>
                      </th>
                    `).join('')}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="feature-label">Tahap Saat Ini</td>
                    ${selectedItems.map(item => `
                      <td><span class="stage-badge stage-${item.application.stage.toLowerCase()}">${item.application.stage}</span></td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Rentang Gaji Lowongan</td>
                    ${selectedItems.map(item => `
                      <td class="mono font-semibold">${formatSalary(item.jobPosting.salaryMin, item.jobPosting.salaryMax) || 'Tidak dicantumkan'}</td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Ekspektasi Gaji / Offer</td>
                    ${selectedItems.map(item => `
                      <td class="mono font-semibold" style="color: #10b981; font-size: 13.5px;">
                        ${item.application.expectedSalary ? `Rp ${item.application.expectedSalary.toLocaleString('id-ID')}` : '-'}
                      </td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Estimasi Take-Home Pay Bulanan</td>
                    ${selectedItems.map(item => {
                      const base = item.application.expectedSalary || item.jobPosting.salaryMin || 0;
                      const estimatedThp = base > 0 ? Math.round(base * 0.92) : 0;
                      return `
                        <td class="mono font-bold" style="color: var(--primary);">
                          ${estimatedThp > 0 ? `~Rp ${estimatedThp.toLocaleString('id-ID')}` : '-'}
                          <span style="font-size: 10.5px; color: var(--text-muted); display: block; font-weight: normal;">(est. setelah BPJS & PPh21)</span>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Model Kerja</td>
                    ${selectedItems.map(item => {
                      const wt = item.jobPosting.workType || 'onsite';
                      const color = wt === 'remote' ? '#10b981' : wt === 'hybrid' ? '#3b82f6' : '#6b7280';
                      return `
                        <td><span style="display: inline-block; padding: 2px 8px; border-radius: var(--radius-xs); background-color: rgba(0,0,0,0.05); color: ${color}; font-weight: 600; text-transform: uppercase; font-size: 11px;">${wt}</span></td>
                      `;
                    }).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Lokasi Kantor</td>
                    ${selectedItems.map(item => `
                      <td>${escapeHtml(item.jobPosting.location || item.company.location || '-')}</td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Tunjangan & Fasilitas</td>
                    ${selectedItems.map(item => `
                      <td style="font-size: 12px; line-height: 1.4;">${escapeHtml(item.application.benefits || 'Belum ada data benefit')}</td>
                    `).join('')}
                  </tr>
                  <tr>
                    <td class="feature-label">Total Skor Fleksibilitas</td>
                    ${selectedItems.map(item => {
                      let score = 70;
                      if (item.jobPosting.workType === 'remote') score += 20;
                      if (item.jobPosting.workType === 'hybrid') score += 10;
                      if (item.application.expectedSalary) score += 10;
                      return `
                        <td>
                          <span class="comparison-score-badge ${score >= 85 ? 'score-high' : 'score-med'}">
                            ★ Skor Rekomendasi: ${score}/100
                          </span>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          `}

        </div>

        <!-- Footer -->
        <div style="padding: 12px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; background-color: var(--bg-surface);">
          <button type="button" class="btn btn-secondary btn-sm" id="btnDoneOfferModal">Tutup Komparasi</button>
        </div>
      </div>
    `;

    // Listeners
    this.dialog.querySelector('#btnCloseOfferModal')?.addEventListener('click', () => this.close());
    this.dialog.querySelector('#btnDoneOfferModal')?.addEventListener('click', () => this.close());

    this.dialog.querySelectorAll<HTMLInputElement>('.offer-app-picker').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(this.dialog.querySelectorAll<HTMLInputElement>('.offer-app-picker:checked')).map(el => el.value);
        if (checked.length > 3) {
          cb.checked = false;
          alert('Anda dapat membandingkan maksimal 3 penawaran sekaligus.');
          return;
        }
        this.selectedAppIds = checked;
        this.render();
      });
    });
  }
}
