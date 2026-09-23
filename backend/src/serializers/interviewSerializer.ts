export function formatInterviewItem(i: any) {
  if (!i) return null;

  return {
    id: i.id,
    applicationId: i.applicationId,
    roundTitle: i.roundTitle,
    type: i.type,
    status: i.status,
    scheduledAt: i.scheduledAt ? new Date(i.scheduledAt).toISOString() : undefined,
    durationMinutes: i.durationMinutes ?? 60,
    location: i.location ?? undefined,
    meetingLink: i.meetingLink ?? undefined,
    interviewerName: i.interviewerName ?? undefined,
    interviewerRole: i.interviewerRole ?? undefined,
    interviewerEmail: i.interviewerEmail ?? undefined,
    interviewerPhone: i.interviewerPhone ?? undefined,
    interviewerLinkedin: i.interviewerLinkedin ?? undefined,
    interviewerNotes: i.interviewerNotes ?? undefined,
    preparation: i.preparation ?? undefined,
    questions: i.questions ?? undefined,
    starAnswers: i.starAnswers ?? undefined,
    notes: i.notes ?? undefined,
    evaluation: i.evaluation ?? undefined,
    followUp: i.followUp ?? undefined,
    tasks: Array.isArray(i.tasks)
      ? i.tasks.map((t: any) => ({
          id: t.id,
          applicationId: t.applicationId,
          type: t.type,
          title: t.title,
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
          priority: t.priority,
          status: t.status,
          interviewId: t.interviewId ?? undefined
        }))
      : undefined,
    createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: i.updatedAt ? new Date(i.updatedAt).toISOString() : new Date().toISOString()
  };
}
