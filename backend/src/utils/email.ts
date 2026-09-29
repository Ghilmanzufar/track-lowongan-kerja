import nodemailer from 'nodemailer';

// Buat transporter Nodemailer dari variabel environment
function createMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true untuk port 465 (SSL), false untuk 587 (STARTTLS)
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Mengirim email berisi tautan reset kata sandi ke pengguna.
 * Selalu mencetak tautan di log konsol untuk kemudahan debugging/pengujian lokal.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  displayName?: string | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const name = displayName?.trim() || 'Pengguna JobTrackId';

  // Log URL token hanya di development saat SMTP belum aktif (testing offline)
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[Dev Fallback] Permintaan reset untuk: ${to}`);
    console.log(`[Dev Fallback] Tautan Reset: ${resetUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log(`[Email] Permintaan reset kata sandi dikirim untuk: ${to}`);
  }

  const transporter = createMailTransporter();

  if (!transporter) {
    console.warn('[Email] SMTP_USER atau SMTP_PASS belum dikonfigurasi di .env. Email fisik dilewati.');
    return { success: false, error: 'SMTP belum dikonfigurasi' };
  }

  const from = process.env.SMTP_FROM || `"JobTrackId" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Kata Sandi</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #2563eb; padding: 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .btn:hover { background-color: #1d4ed8; }
        .footer { background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
        .note { font-size: 13px; color: #64748b; margin-top: 16px; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
        .link-text { word-break: break-all; color: #2563eb; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>JobTrackId — Pelacak Lowongan Kerja</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun JobTrackId Anda.</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn" target="_blank">Atur Ulang Kata Sandi</a>
          </p>
          <p class="note">
            Tautan ini hanya berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan <strong>1 kali</strong>.<br>
            Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini dengan aman.
          </p>
          <p class="note">
            Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di peramban Anda:<br>
            <span class="link-text">${resetUrl}</span>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} JobTrackId. Email ini dikirim secara otomatis, mohon tidak membalas.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Atur Ulang Kata Sandi Akun JobTrackId',
      text: `Halo ${name},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun JobTrackId Anda.\nSilakan buka tautan berikut (berlaku 1 jam):\n${resetUrl}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
      html: htmlContent,
    });

    console.log(`[Email] Sukses mengirim email reset password ke ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] Gagal mengirim email ke ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mengirim email verifikasi alamat email ke pengguna baru.
 */
export async function sendVerificationEmail(
  to: string,
  verifyUrl: string,
  displayName?: string | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const name = displayName?.trim() || 'Pengguna JobTrackId';

  // Log URL token hanya di development saat SMTP belum aktif (testing offline)
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[Dev Fallback] Pengiriman verifikasi untuk: ${to}`);
    console.log(`[Dev Fallback] Tautan Verifikasi: ${verifyUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.log(`[Email] Permintaan verifikasi email dikirim untuk: ${to}`);
  }

  const transporter = createMailTransporter();
  if (!transporter) {
    console.warn('[Email] SMTP belum dikonfigurasi. Email verifikasi dilewati.');
    return { success: false, error: 'SMTP belum dikonfigurasi' };
  }

  const from = process.env.SMTP_FROM || `"JobTrackId" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifikasi Email</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #16a34a; padding: 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .btn { display: inline-block; background-color: #16a34a; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; }
        .note { font-size: 13px; color: #64748b; margin-top: 16px; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
        .link-text { word-break: break-all; color: #16a34a; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>JobTrackId — Verifikasi Email Anda</h1>
        </div>
        <div class="content">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Terima kasih telah mendaftar di JobTrackId! Klik tombol di bawah untuk memverifikasi alamat email Anda.</p>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="btn" target="_blank">Verifikasi Email Saya</a>
          </p>
          <p class="note">
            Tautan ini berlaku selama <strong>24 jam</strong> dan hanya dapat digunakan <strong>1 kali</strong>.<br>
            Jika Anda tidak mendaftar di JobTrackId, abaikan email ini.
          </p>
          <p class="note">
            Jika tombol tidak berfungsi, salin tautan berikut:<br>
            <span class="link-text">${verifyUrl}</span>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} JobTrackId. Email ini dikirim secara otomatis.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Verifikasi Alamat Email Akun JobTrackId',
      text: `Halo ${name},\n\nSilakan verifikasi alamat email Anda dengan membuka tautan berikut (berlaku 24 jam):\n${verifyUrl}\n\nJika Anda tidak mendaftar di JobTrackId, abaikan email ini.`,
      html: htmlContent,
    });

    console.log(`[Email] Sukses mengirim email verifikasi ke ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] Gagal mengirim verifikasi ke ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mengirim email pengingat wawancara mendatang ke pengguna.
 */
export async function sendInterviewReminderEmail(params: {
  to: string;
  displayName?: string | null;
  companyName: string;
  position: string;
  roundTitle: string;
  scheduledAt: Date;
  location?: string | null;
  meetingLink?: string | null;
  timingNote: string; // e.g. "Besok" atau "Dalam 2 Jam"
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, displayName, companyName, position, roundTitle, scheduledAt, location, meetingLink, timingNote } = params;
  const name = displayName?.trim() || 'Pengguna JobTrackId';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const formattedDate = scheduledAt.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const transporter = createMailTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Dev Fallback Reminder] Email pengingat wawancara (${timingNote}) untuk ${to}: ${companyName} - ${position}`);
    }
    return { success: false, error: 'SMTP belum dikonfigurasi' };
  }

  const from = process.env.SMTP_FROM || `"JobTrackId Reminder" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pengingat Wawancara</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; line-height: 1.6; }
        .info-card { background: #f1f5f9; border-radius: 8px; padding: 18px; margin: 18px 0; border-left: 4px solid #4f46e5; }
        .info-row { margin-bottom: 8px; font-size: 14px; }
        .info-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-val { font-size: 15px; font-weight: 600; color: #0f172a; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Pengingat Wawancara (${timingNote})</h1>
          <p>Jangan lewatkan agenda wawancara karir Anda!</p>
        </div>
        <div class="content">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Ini adalah pengingat otomatis bahwa Anda memiliki jadwal wawancara kerja yang akan berlangsung <strong>${timingNote.toLowerCase()}</strong>:</p>
          
          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Perusahaan</div>
              <div class="info-val">${companyName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Posisi & Tahap</div>
              <div class="info-val">${position} — ${roundTitle}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Waktu Pelaksanaan</div>
              <div class="info-val" style="color:#4f46e5;">${formattedDate}</div>
            </div>
            ${location ? `
            <div class="info-row">
              <div class="info-label">Lokasi / Media</div>
              <div class="info-val">${location}</div>
            </div>` : ''}
            ${meetingLink ? `
            <div class="info-row">
              <div class="info-label">Link Meeting</div>
              <div class="info-val"><a href="${meetingLink}" target="_blank" style="color:#2563eb;">${meetingLink}</a></div>
            </div>` : ''}
          </div>

          <p style="text-align: center;">
            <a href="${clientUrl}/#kanban" class="btn" target="_blank">Buka JobTrack & Cek Persiapan</a>
          </p>
          <p style="font-size: 13px; color: #64748b; margin-top: 14px;">
            💡 <em>Tip: Siapkan catatan STAR Method, portofolio, dan pertanyaan terbaik Anda untuk pewawancara.</em>
          </p>
        </div>
        <div class="footer">
          Pengingat ini dikirim otomatis oleh JobTrackId berdasarkan preferensi notifikasi Anda.<br>
          Anda dapat mengatur frekuensi pengingat di menu Profil > Notifikasi.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `[Pengingat Wawancara ${timingNote}] ${companyName} - ${position}`,
      text: `Halo ${name},\n\nWawancara Anda untuk posisi ${position} di ${companyName} (${roundTitle}) dijadwalkan pada ${formattedDate}.\n\nBuka JobTrack: ${clientUrl}/#kanban`,
      html: htmlContent,
    });
    console.log(`[Email] Sukses mengirim pengingat wawancara ke ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] Gagal mengirim pengingat wawancara ke ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mengirim email pengingat tenggat lamaran / tugas (H-1).
 */
export async function sendDeadlineReminderEmail(params: {
  to: string;
  displayName?: string | null;
  companyName: string;
  position: string;
  deadline: Date;
  sourceUrl?: string | null;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, displayName, companyName, position, deadline, sourceUrl } = params;
  const name = displayName?.trim() || 'Pengguna JobTrackId';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const formattedDate = deadline.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const transporter = createMailTransporter();
  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Dev Fallback Reminder] Email tenggat lamaran untuk ${to}: ${companyName} - ${position}`);
    }
    return { success: false, error: 'SMTP belum dikonfigurasi' };
  }

  const from = process.env.SMTP_FROM || `"JobTrackId Reminder" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pengingat Tenggat Lamaran</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; line-height: 1.6; }
        .info-card { background: #fffbeb; border-radius: 8px; padding: 18px; margin: 18px 0; border-left: 4px solid #f59e0b; }
        .info-row { margin-bottom: 8px; font-size: 14px; }
        .info-label { font-weight: 600; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-val { font-size: 15px; font-weight: 600; color: #78350f; }
        .btn { display: inline-block; background-color: #f59e0b; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
        .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏳ Pengingat Tenggat Lamaran (H-1)</h1>
          <p>Tenggat penutupan lowongan kerja segera berakhir!</p>
        </div>
        <div class="content">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Lowongan kerja yang Anda simpan akan segera ditutup besok:</p>
          
          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Perusahaan</div>
              <div class="info-val">${companyName}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Posisi</div>
              <div class="info-val">${position}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Tenggat Waktu</div>
              <div class="info-val">${formattedDate}</div>
            </div>
            ${sourceUrl ? `
            <div class="info-row">
              <div class="info-label">Tautan Lowongan</div>
              <div class="info-val"><a href="${sourceUrl}" target="_blank" style="color:#d97706;">Buka Lowongan Asli</a></div>
            </div>` : ''}
          </div>

          <p style="text-align: center;">
            <a href="${clientUrl}/#kanban" class="btn" target="_blank">Lamar Sekarang & Catat di JobTrack</a>
          </p>
        </div>
        <div class="footer">
          Pengingat ini dikirim otomatis oleh JobTrackId berdasarkan preferensi notifikasi Anda.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `[Tenggat Besok] Lowongan ${position} di ${companyName}`,
      text: `Halo ${name},\n\nTenggat penutupan lowongan ${position} di ${companyName} adalah ${formattedDate}.\nSegera kirim lamaran Anda!\n\nJobTrack: ${clientUrl}/#kanban`,
      html: htmlContent,
    });
    console.log(`[Email] Sukses mengirim pengingat tenggat ke ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email] Gagal mengirim pengingat tenggat ke ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mengirim email uji coba dari panel admin untuk verifikasi konfigurasi SMTP
 */
export async function sendTestAdminEmail(
  to: string,
  adminName?: string | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const name = adminName || 'Administrator';
  const transporter = createMailTransporter();

  if (!transporter) {
    console.log(`[Email Test Mode]: SMTP belum dikonfigurasi di .env. Simulasi pengiriman email ke ${to} berhasil.`);
    return { success: true, messageId: `mock-test-${Date.now()}` };
  }

  const from = process.env.SMTP_FROM || `"JobTrackId System" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Uji Coba Pengiriman Email</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; }
        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: #6366f1; padding: 24px; text-align: center; color: #ffffff; }
        .content { padding: 24px; line-height: 1.6; }
        .badge { background: #10b981; color: #ffffff; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; display: inline-block; margin: 8px 0; }
        .footer { background: #f1f5f9; padding: 16px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">JobTrackId • SMTP Test Dispatch</h2>
        </div>
        <div class="content">
          <p>Halo <strong>${name}</strong>,</p>
          <p>Ini adalah email uji coba dari <strong>Mission Control Panel Admin JobTrackId</strong>.</p>
          <div><span class="badge">STATUS: TERKONEKSI NORMAL</span></div>
          <p>Jika Anda menerima pesan ini, server pengiriman email (SMTP Transporter) telah terkonfigurasi dengan benar dan siap mengirimkan notifikasi wawancara serta pengingat tugas ke seluruh pengguna.</p>
          <p style="font-size: 12px; color: #64748b;">Waktu pengujian: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        <div class="footer">
          JobTrackId System Control • Otomasi Notifikasi
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: `[JobTrackId Admin] Uji Coba Pengiriman Email (${new Date().toLocaleTimeString('id-ID')})`,
      text: `Halo ${name},\n\nIni adalah email uji coba dari Panel Admin JobTrackId.\nStatus: Terkoneksi normal.\nWaktu: ${new Date().toLocaleString('id-ID')}`,
      html: htmlContent
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

