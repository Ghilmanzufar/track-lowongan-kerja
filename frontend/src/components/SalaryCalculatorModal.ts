// Salary & PPh 21 TER 2024 Take Home Pay Calculator Modal
// Mengimplementasikan perhitungan pajak resmi PP 58/2023 & PMK 168/2023 tanpa potongan BPJS

import { getIconSvg } from '../utils/icons';
import { showToast } from '../ui/toast';
import { store } from '../services/store';
import {
  PTKP_OPTIONS,
  PtkpStatus,
  calculateTakeHomePay,
  formatRupiah,
  parseRupiahInput,
  type TaxCalculationResult
} from '../utils/taxCalculator';

export interface SalaryCalculatorOptions {
  initialGross?: number;
  initialAllowances?: number;
  companyName?: string;
  position?: string;
  jobTitle?: string;
  applicationId?: string;
  onApplyToOffer?: (result: TaxCalculationResult) => void;
}

export class SalaryCalculatorModal {
  private static dialog: HTMLDialogElement | null = null;
  private static currentOptions: SalaryCalculatorOptions = {};
  private static currentGross: number = 10_000_000;
  private static currentAllowances: number = 0;
  private static currentPtkp: PtkpStatus = 'TK/0';

  public static open(options: SalaryCalculatorOptions = {}): void {
    this.currentOptions = options;
    if (options.initialGross && options.initialGross > 0) {
      this.currentGross = options.initialGross;
    }
    if (options.initialAllowances && options.initialAllowances > 0) {
      this.currentAllowances = options.initialAllowances;
    }

    let dialog = document.getElementById('salaryCalculatorModal') as HTMLDialogElement | null;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'salaryCalculatorModal';
      dialog.className = 'custom-dialog salary-calc-dialog';
      document.body.appendChild(dialog);
    }

    this.dialog = dialog;
    this.render();
    this.bindEvents();
    this.dialog.showModal();
  }

  public static close(): void {
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
  }

  private static render(): void {
    if (!this.dialog) return;

    const res = calculateTakeHomePay({
      grossMonthly: this.currentGross,
      allowancesMonthly: this.currentAllowances,
      ptkpStatus: this.currentPtkp
    });

    const isAppContext = Boolean(this.currentOptions.applicationId || this.currentOptions.companyName);
    const companyTitle = this.currentOptions.companyName
      ? `${this.currentOptions.companyName}${this.currentOptions.position ? ' — ' + this.currentOptions.position : ''}`
      : 'Simulasi Gaji & Pajak Indonesia';

    this.dialog.innerHTML = `
      <div class="salary-calc-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="salary-calc-header-icon">
            ${getIconSvg('calculator', { size: 20 })}
          </div>
          <div>
            <h3 class="salary-calc-title">Kalkulator Gaji Bersih (PPh 21 TER 2024)</h3>
            <p class="salary-calc-subtitle">${companyTitle}</p>
          </div>
        </div>
        <button type="button" class="btn-close-calc" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px;">
          ${getIconSvg('x', { size: 18 })}
        </button>
      </div>

      <div class="salary-calc-body">
        <div class="salary-calc-grid">
          <!-- ─── Form Input Kolom Kiri ──────────────────────────────────────── -->
          <div class="salary-calc-form-panel">
            <!-- Gaji Pokok -->
            <div class="calc-field-group">
              <label for="inputGrossSalary" class="calc-label">
                <span>Gaji Pokok Kotor (Gross / Bulan)</span>
                <span style="font-weight: 400; font-size: 11px; color: var(--text-muted);">Sebelum Pajak</span>
              </label>
              <div class="calc-input-wrap">
                <span class="calc-input-prefix">Rp</span>
                <input
                  type="text"
                  id="inputGrossSalary"
                  class="calc-input"
                  placeholder="10.000.000"
                  value="${this.currentGross.toLocaleString('id-ID')}"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- Preset Cepat -->
            <div class="calc-presets-row">
              <span class="calc-presets-label">Preset Cepat:</span>
              <div class="calc-presets-chips">
                <button type="button" class="calc-preset-btn" data-val="5067381">UMR Jkt (5jt)</button>
                <button type="button" class="calc-preset-btn" data-val="8000000">8 Juta</button>
                <button type="button" class="calc-preset-btn" data-val="12000000">12 Juta</button>
                <button type="button" class="calc-preset-btn" data-val="20000000">20 Juta</button>
                <button type="button" class="calc-preset-btn" data-val="35000000">35 Juta</button>
              </div>
            </div>

            <!-- Tunjangan Tambahan -->
            <div class="calc-field-group" style="margin-top: 14px;">
              <label for="inputAllowances" class="calc-label">
                <span>Tunjangan Tetap / Bonus Bulanan (Opsional)</span>
                <span style="font-weight: 400; font-size: 11px; color: var(--text-muted);">Kompensasi kotor lain</span>
              </label>
              <div class="calc-input-wrap">
                <span class="calc-input-prefix">Rp</span>
                <input
                  type="text"
                  id="inputAllowances"
                  class="calc-input"
                  placeholder="0"
                  value="${this.currentAllowances > 0 ? this.currentAllowances.toLocaleString('id-ID') : ''}"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- Status PTKP -->
            <div class="calc-field-group" style="margin-top: 14px;">
              <label for="selectPtkpStatus" class="calc-label">
                <span>Status PTKP (Penghasilan Tidak Kena Pajak)</span>
                <span class="calc-category-badge">Kategori TER ${res.terCategory}</span>
              </label>
              <select id="selectPtkpStatus" class="calc-select">
                ${Object.values(PTKP_OPTIONS)
                  .map(
                    (p) =>
                      `<option value="${p.key}" ${this.currentPtkp === p.key ? 'selected' : ''}>
                        ${p.label}
                      </option>`
                  )
                  .join('')}
              </select>
              <div class="calc-ptkp-hint">
                ${PTKP_OPTIONS[this.currentPtkp]?.description || ''}
              </div>
            </div>

            <!-- Banner info regulasi -->
            <div class="calc-legal-banner">
              <span style="color: var(--accent-blue); flex-shrink: 0; display: flex; align-items: center;">
                ${getIconSvg('info', { size: 14 })}
              </span>
              <span>
                Perhitungan menggunakan aturan <strong>PPh 21 TER 2024</strong> (PP 58/2023 & PMK 168/2023). Tanpa potongan BPJS (opsional).
              </span>
            </div>
          </div>

          <!-- ─── Panel Hasil Kolom Kanan ────────────────────────────────────── -->
          <div class="salary-calc-result-panel">
            <!-- Hero Result Card: Take Home Pay -->
            <div class="calc-hero-card">
              <div class="calc-hero-label">Gaji Bersih Diterima (Take Home Pay)</div>
              <div class="calc-hero-val" id="resTakeHomePay">${formatRupiah(res.takeHomePayMonthly)}</div>
              <div class="calc-hero-sub">Masuk rekening Anda per bulan (${res.takeHomePayPercent} dari bruto)</div>
            </div>

            <!-- Breakdown Kartu Rincian -->
            <div class="calc-breakdown-box">
              <div class="calc-breakdown-row">
                <span class="calc-breakdown-name">Total Penghasilan Bruto</span>
                <span class="calc-breakdown-val" id="resTotalGross">${formatRupiah(res.totalGrossMonthly)}</span>
              </div>
              <div class="calc-breakdown-row text-danger">
                <span class="calc-breakdown-name">
                  Potongan PPh 21 TER (Bulan Ini)
                  <span class="calc-tax-rate-pill">${res.effectiveRatePercent}</span>
                </span>
                <span class="calc-breakdown-val" id="resMonthlyTax">- ${formatRupiah(res.monthlyPPh21)}</span>
              </div>
              <div class="calc-divider"></div>
              <div class="calc-breakdown-row highlight">
                <span class="calc-breakdown-name">Gaji Bersih (Nett THP)</span>
                <span class="calc-breakdown-val" id="resNetto">${formatRupiah(res.takeHomePayMonthly)}</span>
              </div>
            </div>

            <!-- Visual Proportion Bar -->
            <div class="calc-proportion-section">
              <div class="calc-proportion-bar">
                <div class="calc-proportion-fill nett" style="width: ${res.takeHomePayPercent};" title="Gaji Bersih: ${res.takeHomePayPercent}"></div>
                <div class="calc-proportion-fill tax" style="width: ${res.effectiveRatePercent};" title="Pajak PPh 21: ${res.effectiveRatePercent}"></div>
              </div>
              <div class="calc-proportion-legend">
                <span class="legend-item"><span class="legend-dot nett"></span> Bersih (${res.takeHomePayPercent})</span>
                <span class="legend-item"><span class="legend-dot tax"></span> Pajak (${res.effectiveRatePercent})</span>
              </div>
            </div>

            <!-- Proyeksi Tahunan -->
            <div class="calc-annual-box">
              <div class="calc-annual-title">
                ${getIconSvg('calendar', { size: 13 })} Proyeksi Penghasilan 1 Tahun (12 Bulan)
              </div>
              <div class="calc-annual-grid">
                <div>
                  <div class="calc-annual-lbl">Total Gaji Bersih</div>
                  <div class="calc-annual-val">${formatRupiah(res.annualTakeHomePay)}</div>
                </div>
                <div>
                  <div class="calc-annual-lbl">Estimasi + 1x THR</div>
                  <div class="calc-annual-val" style="color: var(--accent-blue);">${formatRupiah(res.annualTakeHomePay + res.takeHomePayMonthly)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="salary-calc-footer">
        <button type="button" id="btnCopySalarySummary" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
          ${getIconSvg('copy', { size: 14 })} Salin Rincian
        </button>

        ${
          isAppContext
            ? `
          <button type="button" id="btnApplyToOffer" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
            ${getIconSvg('check', { size: 14 })} Terapkan ke Penawaran Lamaran
          </button>
          `
            : ''
        }

        <button type="button" class="btn btn-secondary btn-sm btn-close-calc">Tutup</button>
      </div>
    `;
  }

  private static bindEvents(): void {
    if (!this.dialog) return;

    this.dialog.querySelectorAll('.btn-close-calc').forEach((b) => {
      b.addEventListener('click', () => this.close());
    });

    const inputGross = this.dialog.querySelector('#inputGrossSalary') as HTMLInputElement | null;
    const inputAllowances = this.dialog.querySelector('#inputAllowances') as HTMLInputElement | null;
    const selectPtkp = this.dialog.querySelector('#selectPtkpStatus') as HTMLSelectElement | null;

    const handleUpdate = () => {
      if (inputGross) {
        this.currentGross = parseRupiahInput(inputGross.value);
      }
      if (inputAllowances) {
        this.currentAllowances = parseRupiahInput(inputAllowances.value);
      }
      if (selectPtkp) {
        this.currentPtkp = selectPtkp.value as PtkpStatus;
      }
      this.updateViewOnly();
    };

    inputGross?.addEventListener('input', () => {
      const raw = parseRupiahInput(inputGross.value);
      this.currentGross = raw;
      if (raw > 0) {
        const curPos = inputGross.selectionStart;
        inputGross.value = raw.toLocaleString('id-ID');
      }
      handleUpdate();
    });

    inputAllowances?.addEventListener('input', () => {
      const raw = parseRupiahInput(inputAllowances.value);
      this.currentAllowances = raw;
      if (raw > 0) {
        inputAllowances.value = raw.toLocaleString('id-ID');
      }
      handleUpdate();
    });

    selectPtkp?.addEventListener('change', handleUpdate);

    // Preset buttons
    this.dialog.querySelectorAll<HTMLButtonElement>('.calc-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.getAttribute('data-val') || '0', 10);
        if (val > 0) {
          this.currentGross = val;
          if (inputGross) inputGross.value = val.toLocaleString('id-ID');
          handleUpdate();
        }
      });
    });

    // Copy Summary Button
    const btnCopy = this.dialog.querySelector('#btnCopySalarySummary');
    btnCopy?.addEventListener('click', () => {
      const res = calculateTakeHomePay({
        grossMonthly: this.currentGross,
        allowancesMonthly: this.currentAllowances,
        ptkpStatus: this.currentPtkp
      });

      const summaryText = `Rincian Gaji & Pajak (PPh 21 TER 2024)\n` +
        `----------------------------------------\n` +
        `Gaji Pokok: ${formatRupiah(res.grossMonthly)}\n` +
        (res.allowancesMonthly > 0 ? `Tunjangan: ${formatRupiah(res.allowancesMonthly)}\n` : '') +
        `Total Bruto: ${formatRupiah(res.totalGrossMonthly)}\n` +
        `Status PTKP: ${res.ptkpStatus} (Kategori TER ${res.terCategory})\n` +
        `Tarif PPh 21 TER: ${res.effectiveRatePercent}\n` +
        `Potongan Pajak Bulanan: - ${formatRupiah(res.monthlyPPh21)}\n` +
        `========================================\n` +
        `Take Home Pay (Bersih): ${formatRupiah(res.takeHomePayMonthly)} / bulan\n` +
        `Proyeksi 1 Tahun (12x): ${formatRupiah(res.annualTakeHomePay)}\n` +
        `Dihitung via JobTrackId (PP 58/2023 & PMK 168/2023)`;

      navigator.clipboard.writeText(summaryText).then(() => {
        showToast('Rincian gaji bersih disalin ke clipboard!', 'success');
      }).catch(() => {
        showToast('Gagal menyalin ke clipboard', 'error');
      });
    });

    // Apply to Job Application (if in app context)
    const btnApply = this.dialog.querySelector('#btnApplyToOffer');
    btnApply?.addEventListener('click', async () => {
      const res = calculateTakeHomePay({
        grossMonthly: this.currentGross,
        allowancesMonthly: this.currentAllowances,
        ptkpStatus: this.currentPtkp
      });

      if (this.currentOptions.onApplyToOffer) {
        this.currentOptions.onApplyToOffer(res);
      } else if (this.currentOptions.applicationId) {
        try {
          await store.updateApplicationDetails(this.currentOptions.applicationId, {
            salaryMin: res.grossMonthly,
            salaryMax: res.takeHomePayMonthly
          });
          showToast(`Gaji penawaran diperbarui: ${formatRupiah(res.takeHomePayMonthly)} (Nett)`, 'success');
        } catch (err) {
          showToast('Gagal memperbarui nominal lamaran', 'error');
        }
      }

      this.close();
    });
  }

  private static updateViewOnly(): void {
    if (!this.dialog) return;

    const res = calculateTakeHomePay({
      grossMonthly: this.currentGross,
      allowancesMonthly: this.currentAllowances,
      ptkpStatus: this.currentPtkp
    });

    const elTHP = this.dialog.querySelector('#resTakeHomePay');
    const elTotalGross = this.dialog.querySelector('#resTotalGross');
    const elMonthlyTax = this.dialog.querySelector('#resMonthlyTax');
    const elNetto = this.dialog.querySelector('#resNetto');
    const ptkpBadge = this.dialog.querySelector('.calc-category-badge');
    const ptkpHint = this.dialog.querySelector('.calc-ptkp-hint');
    const taxRatePill = this.dialog.querySelector('.calc-tax-rate-pill');
    const heroSub = this.dialog.querySelector('.calc-hero-sub');
    const fillNett = this.dialog.querySelector('.calc-proportion-fill.nett') as HTMLElement | null;
    const fillTax = this.dialog.querySelector('.calc-proportion-fill.tax') as HTMLElement | null;
    const legendNett = this.dialog.querySelector('.legend-item:first-child');
    const legendTax = this.dialog.querySelector('.legend-item:last-child');
    const annualVal1 = this.dialog.querySelector('.calc-annual-grid div:first-child .calc-annual-val');
    const annualVal2 = this.dialog.querySelector('.calc-annual-grid div:last-child .calc-annual-val');

    if (elTHP) elTHP.textContent = formatRupiah(res.takeHomePayMonthly);
    if (elTotalGross) elTotalGross.textContent = formatRupiah(res.totalGrossMonthly);
    if (elMonthlyTax) elMonthlyTax.textContent = `- ${formatRupiah(res.monthlyPPh21)}`;
    if (elNetto) elNetto.textContent = formatRupiah(res.takeHomePayMonthly);
    if (ptkpBadge) ptkpBadge.textContent = `Kategori TER ${res.terCategory}`;
    if (ptkpHint) ptkpHint.textContent = PTKP_OPTIONS[this.currentPtkp]?.description || '';
    if (taxRatePill) taxRatePill.textContent = res.effectiveRatePercent;
    if (heroSub) heroSub.textContent = `Masuk rekening Anda per bulan (${res.takeHomePayPercent} dari bruto)`;
    if (fillNett) fillNett.style.width = res.takeHomePayPercent;
    if (fillTax) fillTax.style.width = res.effectiveRatePercent;
    if (legendNett) legendNett.innerHTML = `<span class="legend-dot nett"></span> Bersih (${res.takeHomePayPercent})`;
    if (legendTax) legendTax.innerHTML = `<span class="legend-dot tax"></span> Pajak (${res.effectiveRatePercent})`;
    if (annualVal1) annualVal1.textContent = formatRupiah(res.annualTakeHomePay);
    if (annualVal2) annualVal2.textContent = formatRupiah(res.annualTakeHomePay + res.takeHomePayMonthly);
  }
}
