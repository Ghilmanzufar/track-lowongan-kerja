// Interview Synchronization, Memory Sync, and Event Attachments

import type { ApplicationItem, InterviewItem, InterviewType, StarStoryItem, PredictedQuestionItem } from '../../../types';
import { store } from '../../../services/store';
import { toast } from '../shared';
import { getIconSvg } from '../../../utils/icons';
import { DEFAULT_PREP_CHECKLIST } from './wawancaraConstants';

export function syncCurrentSubTabToMemory(container: HTMLElement, interview: InterviewItem): void {
  // 1. Jadwal & Pewawancara
  const roundTitleInput = container.querySelector('#ivRoundTitleInput') as HTMLInputElement | null;
  if (roundTitleInput) interview.roundTitle = roundTitleInput.value;

  const typeSelect = container.querySelector('#ivTypeSelect') as HTMLSelectElement | null;
  if (typeSelect) interview.type = typeSelect.value as InterviewType;

  const scheduledAtInput = container.querySelector('#ivScheduledAtInput') as HTMLInputElement | null;
  if (scheduledAtInput) {
    interview.scheduledAt = scheduledAtInput.value ? new Date(scheduledAtInput.value).toISOString() : undefined;
  }

  const durationInput = container.querySelector('#ivDurationInput') as HTMLInputElement | null;
  if (durationInput) interview.durationMinutes = Number(durationInput.value) || 60;

  const locationInput = container.querySelector('#ivLocationInput') as HTMLInputElement | null;
  if (locationInput) interview.location = locationInput.value;

  const meetingLinkInput = container.querySelector('#ivMeetingLinkInput') as HTMLInputElement | null;
  if (meetingLinkInput) interview.meetingLink = meetingLinkInput.value;

  const interviewerNameInput = container.querySelector('#ivInterviewerNameInput') as HTMLInputElement | null;
  if (interviewerNameInput) interview.interviewerName = interviewerNameInput.value;

  const interviewerRoleInput = container.querySelector('#ivInterviewerRoleInput') as HTMLInputElement | null;
  if (interviewerRoleInput) interview.interviewerRole = interviewerRoleInput.value;

  const interviewerEmailInput = container.querySelector('#ivInterviewerEmailInput') as HTMLInputElement | null;
  if (interviewerEmailInput) interview.interviewerEmail = interviewerEmailInput.value;

  const interviewerLinkedinInput = container.querySelector('#ivInterviewerLinkedinInput') as HTMLInputElement | null;
  if (interviewerLinkedinInput) interview.interviewerLinkedin = interviewerLinkedinInput.value;

  const interviewerNotesInput = container.querySelector('#ivInterviewerNotesInput') as HTMLTextAreaElement | null;
  if (interviewerNotesInput) interview.interviewerNotes = interviewerNotesInput.value;

  // 2. Persiapan & Riset
  const prepCheckboxes = container.querySelectorAll<HTMLInputElement>('.iv-prep-checkbox');
  const companyNotesInput = container.querySelector('#ivCompanyNotesInput') as HTMLTextAreaElement | null;
  const techNotesInput = container.querySelector('#ivTechNotesInput') as HTMLTextAreaElement | null;

  if (prepCheckboxes.length > 0 || companyNotesInput || techNotesInput) {
    if (!interview.preparation) interview.preparation = { completedChecklist: [] };
    if (prepCheckboxes.length > 0) {
      const checked: string[] = [];
      prepCheckboxes.forEach((cb) => {
        if (cb.checked) checked.push(cb.value);
      });
      interview.preparation.completedChecklist = checked;
    }
    if (companyNotesInput) interview.preparation.companyNotes = companyNotesInput.value;
    if (techNotesInput) interview.preparation.techStackNotes = techNotesInput.value;
  }

  // 3. Pertanyaan & Q&A
  const questionCards = container.querySelectorAll('.question-item-card');
  const toAskInput = container.querySelector('#ivQuestionsToAskInput') as HTMLTextAreaElement | null;

  if (questionCards.length > 0 || toAskInput) {
    if (!interview.questions) interview.questions = { predicted: [], toAsk: [] };
    if (questionCards.length > 0) {
      const predicted: PredictedQuestionItem[] = [];
      questionCards.forEach((el, idx) => {
        const q = (el.querySelector('.q-title-input') as HTMLInputElement)?.value || '';
        const a = (el.querySelector('.q-answer-input') as HTMLTextAreaElement)?.value || '';
        if (q.trim()) {
          predicted.push({ id: `pred-${idx}`, question: q.trim(), answerNotes: a.trim() });
        }
      });
      interview.questions.predicted = predicted;
    }
    if (toAskInput) {
      interview.questions.toAsk = toAskInput.value.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }

  // 4. STAR Answers
  const starCards = container.querySelectorAll('.star-story-card');
  if (starCards.length > 0) {
    const starAnswers: StarStoryItem[] = [];
    starCards.forEach((el, idx) => {
      const title = (el.querySelector('.star-title-input') as HTMLInputElement)?.value || `Cerita #${idx + 1}`;
      const situation = (el.querySelector('.star-situation-input') as HTMLTextAreaElement)?.value || '';
      const task = (el.querySelector('.star-task-input') as HTMLTextAreaElement)?.value || '';
      const action = (el.querySelector('.star-action-input') as HTMLTextAreaElement)?.value || '';
      const result = (el.querySelector('.star-result-input') as HTMLTextAreaElement)?.value || '';
      starAnswers.push({ id: `star-${idx}`, title, situation, task, action, result });
    });
    interview.starAnswers = starAnswers;
  }

  // 5. Catatan Sesi
  const liveNotesInput = container.querySelector('#ivLiveNotesInput') as HTMLTextAreaElement | null;
  if (liveNotesInput) interview.notes = liveNotesInput.value;

  // 6. Evaluasi
  const ratingInput = container.querySelector('#ivRatingVal') as HTMLInputElement | null;
  const diffSelect = container.querySelector('#ivDifficultySelect') as HTMLSelectElement | null;
  const strengthsInput = container.querySelector('#ivStrengthsInput') as HTMLTextAreaElement | null;
  const improveInput = container.querySelector('#ivImprovementsInput') as HTMLTextAreaElement | null;
  const feedbackInput = container.querySelector('#ivFeedbackInput') as HTMLTextAreaElement | null;

  if (ratingInput || diffSelect || strengthsInput || improveInput || feedbackInput) {
    if (!interview.evaluation) interview.evaluation = {};
    if (ratingInput && ratingInput.value) interview.evaluation.rating = Number(ratingInput.value) || 0;
    if (diffSelect) interview.evaluation.difficulty = diffSelect.value as any;
    if (strengthsInput) interview.evaluation.strengths = strengthsInput.value;
    if (improveInput) interview.evaluation.improvements = improveInput.value;
    if (feedbackInput) interview.evaluation.feedback = feedbackInput.value;
  }

  // 7. Follow-up
  const followUpSelect = container.querySelector('#ivFollowUpStatusSelect') as HTMLSelectElement | null;
  const followUpTemplate = container.querySelector('#ivThankYouTemplateInput') as HTMLTextAreaElement | null;
  if (followUpSelect || followUpTemplate) {
    if (!interview.followUp) interview.followUp = { status: 'None' };
    if (followUpSelect) interview.followUp.status = followUpSelect.value as any;
    if (followUpTemplate) interview.followUp.template = followUpTemplate.value;
  }
}

export async function collectAndSaveInterviewData(
  container: HTMLElement,
  interview: InterviewItem,
  onUpdateCallback?: () => void
): Promise<void> {
  // Synchronize active sub-tab into interview object first
  syncCurrentSubTabToMemory(container, interview);

  const payload: Partial<InterviewItem> = {
    roundTitle: interview.roundTitle,
    type: interview.type,
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
    location: interview.location,
    meetingLink: interview.meetingLink,
    interviewerName: interview.interviewerName,
    interviewerRole: interview.interviewerRole,
    interviewerEmail: interview.interviewerEmail,
    interviewerLinkedin: interview.interviewerLinkedin,
    interviewerNotes: interview.interviewerNotes,
    preparation: interview.preparation,
    questions: interview.questions,
    starAnswers: interview.starAnswers,
    notes: interview.notes,
    evaluation: interview.evaluation,
    followUp: interview.followUp
  };

  try {
    const updated = await store.updateInterview(interview.id, payload);
    Object.assign(interview, updated);
    toast('Seluruh catatan & evaluasi wawancara berhasil disimpan ke database!', 'success');
    if (onUpdateCallback) onUpdateCallback();
  } catch {
    toast('Gagal menyimpan perubahan wawancara', 'error');
  }
}

export async function createQuickRound(
  item: ApplicationItem,
  type: InterviewType,
  onUpdateCallback?: () => void
): Promise<InterviewItem | null> {
  const roundCount = (item.interviews?.length || 0) + 1;
  const title = `${type === 'HR' ? 'HR Screening' : `${type} Interview`} (Round ${roundCount})`;

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  tomorrow.setHours(14, 0, 0, 0);

  try {
    const created = await store.createInterview(item.application.id, {
      roundTitle: title,
      type,
      status: 'Scheduled',
      scheduledAt: tomorrow.toISOString(),
      durationMinutes: 60,
      location: 'Google Meet',
      syncOptions: {
        createInterviewTask: true,
        createPrepTask: true
      }
    });

    toast(`Sesi wawancara "${title}" berhasil dibuat dan ditautkan ke Agenda!`, 'success');
    if (onUpdateCallback) onUpdateCallback();
    return created;
  } catch {
    toast('Gagal membuat sesi wawancara baru', 'error');
    return null;
  }
}

export function attachSubTabSpecificListeners(
  container: HTMLElement,
  interview: InterviewItem,
  onUpdateCallback?: () => void
): void {
  // Prep checklist toggles
  container.querySelectorAll<HTMLInputElement>('.iv-prep-checkbox').forEach((cb) => {
    cb.addEventListener('change', () => {
      const itemEl = cb.closest('.prep-check-item');
      if (cb.checked) {
        itemEl?.classList.add('done');
      } else {
        itemEl?.classList.remove('done');
      }
      const badge = container.querySelector('#prepCountBadge');
      const doneCount = container.querySelectorAll<HTMLInputElement>('.iv-prep-checkbox:checked').length;
      if (badge) badge.textContent = `${doneCount} / ${DEFAULT_PREP_CHECKLIST.length} Selesai`;
    });
  });

  // Star rating selector
  container.querySelectorAll<HTMLButtonElement>('.star-rating-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = Number(btn.getAttribute('data-val'));
      const hiddenInput = container.querySelector<HTMLInputElement>('#ivRatingVal');
      if (hiddenInput) hiddenInput.value = String(val);

      container.querySelectorAll<HTMLButtonElement>('.star-rating-btn').forEach((b) => {
        const bVal = Number(b.getAttribute('data-val'));
        if (bVal <= val) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      const label = container.querySelector('#ratingValueLabel');
      if (label) label.textContent = `${val} / 5`;
    });
  });

  // Add predicted question button
  container.querySelector('#btnAddPredictedQuestion')?.addEventListener('click', () => {
    const listContainer = container.querySelector('#predictedQuestionsContainer');
    if (!listContainer) return;
    const count = listContainer.children.length;
    const card = document.createElement('div');
    card.className = 'question-item-card';
    card.setAttribute('data-idx', String(count));
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <input type="text" class="form-control q-title-input" value="" placeholder="Tuliskan pertanyaan prediksi..." style="font-weight: 600; font-size: 12.5px;" />
        <button type="button" class="btn btn-sm btnDeletePredictedQ" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:inline-flex; align-items:center;" title="Hapus">${getIconSvg('x', { size: 14 })}</button>
      </div>
      <textarea class="form-control q-answer-input" style="min-height: 54px; font-size: 12px;" placeholder="Poin-poin jawaban yang ingin Anda sampaikan..."></textarea>
    `;
    card.querySelector('.btnDeletePredictedQ')?.addEventListener('click', () => card.remove());
    listContainer.appendChild(card);
  });

  container.querySelectorAll('.btnDeletePredictedQ').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.question-item-card')?.remove());
  });

  // Add STAR story card
  container.querySelector('#btnAddStarStory')?.addEventListener('click', () => {
    const listContainer = container.querySelector('#starStoriesContainer');
    if (!listContainer) return;
    const count = listContainer.children.length;
    const card = document.createElement('div');
    card.className = 'star-story-card';
    card.setAttribute('data-idx', String(count));
    card.innerHTML = `
      <div class="star-story-header">
        <input type="text" class="form-control star-title-input" value="Cerita Pengalaman #${count + 1}" placeholder="Judul Topik Cerita..." style="font-weight: 700; font-size: 13px; max-width: 80%;" />
        <button type="button" class="btn btn-sm btnDeleteStarStory" style="background:none; border:none; color:var(--text-muted); cursor:pointer; display:inline-flex; align-items:center; gap:4px;" title="Hapus Cerita">${getIconSvg('trash', { size: 12 })} Hapus</button>
      </div>
      <div class="star-grid">
        <div class="star-box">
          <div class="star-box-title">S — Situation (Konteks & Masalah)</div>
          <textarea class="star-situation-input" placeholder="Jelaskan situasi latar belakang..."></textarea>
        </div>
        <div class="star-box">
          <div class="star-box-title">T — Task (Tantangan & Tugas)</div>
          <textarea class="star-task-input" placeholder="Apa tujuan yang harus dicapai?..."></textarea>
        </div>
        <div class="star-box">
          <div class="star-box-title">A — Action (Langkah Aksi Konkret)</div>
          <textarea class="star-action-input" placeholder="Langkah nyata apa yang Anda ambil?..."></textarea>
        </div>
        <div class="star-box">
          <div class="star-box-title">R — Result (Hasil & Dampak Terukur)</div>
          <textarea class="star-result-input" placeholder="Hasil akhir, angka metrik peningkatan..."></textarea>
        </div>
      </div>
    `;
    card.querySelector('.btnDeleteStarStory')?.addEventListener('click', () => card.remove());
    listContainer.appendChild(card);
  });

  container.querySelectorAll('.btnDeleteStarStory').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.star-story-card')?.remove());
  });

  // Copy thank you note
  container.querySelector('#btnCopyThankYouNote')?.addEventListener('click', () => {
    const text = (container.querySelector('#ivThankYouTemplateInput') as HTMLTextAreaElement)?.value || '';
    if (text) {
      navigator.clipboard.writeText(text);
      toast('Pesan follow-up berhasil disalin ke clipboard!', 'success');
    }
  });

  // Create Follow-up Reminder in Agenda
  container.querySelector('#btnCreateFollowUpReminder')?.addEventListener('click', async () => {
    try {
      await store.syncInterviewTasks(interview.id, {
        createInterviewTask: false,
        createPrepTask: false,
        createFollowUpTask: true,
        followUpOffsetDays: 1
      });
      toast(`Pengingat follow-up berhasil dibuat di Agenda!`, 'success');
      if (onUpdateCallback) onUpdateCallback();
    } catch {
      toast('Gagal membuat pengingat follow-up', 'error');
    }
  });

  // Local Save Buttons (inside subtab footer cards)
  container.querySelectorAll<HTMLButtonElement>('.btn-subtab-save').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `${getIconSvg('repeat', { size: 13 })} Menyimpan...`;
      try {
        await collectAndSaveInterviewData(container, interview, onUpdateCallback);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    });
  });
}
