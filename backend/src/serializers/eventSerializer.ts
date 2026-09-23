export function formatCalendarEvent(e: any) {
  if (!e) return null;

  return {
    id: e.id,
    userId: e.userId,
    applicationId: e.applicationId ?? undefined,
    interviewId: e.interviewId ?? undefined,
    title: e.title,
    eventType: e.eventType,
    status: e.status,
    startTime: e.startTime ? new Date(e.startTime).toISOString() : new Date().toISOString(),
    endTime: e.endTime ? new Date(e.endTime).toISOString() : new Date().toISOString(),
    allDay: Boolean(e.allDay),
    meetingUrl: e.meetingUrl ?? undefined,
    location: e.location ?? undefined,
    interviewer: e.interviewer ?? undefined,
    notes: e.notes ?? undefined,
    application: e.application
      ? {
          id: e.application.id,
          companyName: e.application.jobPosting?.company?.name || 'Perusahaan',
          jobTitle: e.application.jobPosting?.title || 'Posisi'
        }
      : undefined,
    reminders: Array.isArray(e.reminders)
      ? e.reminders.map((r: any) => ({
          id: r.id,
          title: r.title,
          remindAt: new Date(r.remindAt).toISOString(),
          channel: r.channel,
          isSent: r.isSent
        }))
      : undefined,
    createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : new Date().toISOString()
  };
}
