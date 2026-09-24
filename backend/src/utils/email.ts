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
