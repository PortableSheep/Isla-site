const wrap = (title: string, bodyHtml: string) => `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0b0b13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b13;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#14141f 0%,#0f0f1a 100%);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;">
          <tr>
            <td>
              <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;background:linear-gradient(90deg,#f472b6,#a78bfa,#fb923c);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:700;margin-bottom:24px;">
                Isla Zone
              </div>
              ${bodyHtml}
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0 16px;" />
              <p style="font-size:12px;color:#6b7280;margin:0;">
                You're receiving this because someone used your email address on Isla Zone. If this wasn't you, you can ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const button = (url: string, label: string) => `
  <a href="${url}" style="display:inline-block;background:linear-gradient(90deg,#f472b6,#a78bfa);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:16px;">
    ${label}
  </a>`;

export function inviteEmailTemplate(opts: {
  inviteUrl: string;
  inviterName?: string | null;
  familyName?: string | null;
  expiresAt?: string | null;
}) {
  const who = opts.inviterName ? `${opts.inviterName}` : 'Someone';
  const where = opts.familyName ? ` to join <strong>${opts.familyName}</strong>` : '';
  const expires = opts.expiresAt
    ? `<p style="color:#9ca3af;font-size:13px;">This link expires on ${new Date(opts.expiresAt).toLocaleDateString()}.</p>`
    : '';
  const subject = `${who} invited you to Isla Zone`;
  const html = wrap(
    subject,
    `
    <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px;color:#f8fafc;">You're invited!</h1>
    <p style="font-size:16px;line-height:1.6;color:#d1d5db;margin:0 0 24px;">
      ${who} has invited you${where} on Isla Zone — a private, warm space for your family to share messages and memories.
    </p>
    <div style="margin:32px 0;">${button(opts.inviteUrl, 'Accept Invitation')}</div>
    <p style="font-size:13px;color:#9ca3af;word-break:break-all;margin:0 0 8px;">
      Or paste this link into your browser:<br />
      <a href="${opts.inviteUrl}" style="color:#a78bfa;">${opts.inviteUrl}</a>
    </p>
    ${expires}
    `
  );
  const text = `${who} invited you${opts.familyName ? ` to join ${opts.familyName}` : ''} on Isla Zone.\n\nAccept: ${opts.inviteUrl}\n`;
  return { subject, html, text };
}

export function approvalEmailTemplate(opts: {
  appUrl: string;
  familyName?: string | null;
  approverName?: string | null;
}) {
  const subject = `Your Isla Zone account has been approved 🎉`;
  const html = wrap(
    subject,
    `
    <h1 style="font-size:26px;line-height:1.2;margin:0 0 16px;color:#f8fafc;">You're in!</h1>
    <p style="font-size:16px;line-height:1.6;color:#d1d5db;margin:0 0 24px;">
      ${opts.approverName ? `${opts.approverName} just approved` : 'Your parent just approved'} your Isla Zone account${
      opts.familyName ? ` for <strong>${opts.familyName}</strong>` : ''
    }. You can sign in and start sharing messages with your family.
    </p>
    <div style="margin:32px 0;">${button(`${opts.appUrl}/dashboard`, 'Open Isla Zone')}</div>
    `
  );
  const text = `Your Isla Zone account has been approved. Open the app: ${opts.appUrl}/dashboard\n`;
  return { subject, html, text };
}

export function rejectionEmailTemplate(opts: {
  appUrl: string;
  reason?: string | null;
}) {
  const subject = `Update on your Isla Zone account`;
  const html = wrap(
    subject,
    `
    <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px;color:#f8fafc;">Account update</h1>
    <p style="font-size:16px;line-height:1.6;color:#d1d5db;margin:0 0 16px;">
      Your request to join a family on Isla Zone wasn't approved at this time.
    </p>
    ${opts.reason ? `<p style="font-size:15px;color:#d1d5db;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:16px;border-radius:10px;margin:0 0 24px;">${opts.reason}</p>` : ''}
    <p style="font-size:15px;color:#9ca3af;margin:0;">Please talk to the parent who invited you if you have questions.</p>
    `
  );
  const text = `Your Isla Zone account request was not approved.${opts.reason ? `\n\nReason: ${opts.reason}` : ''}\n`;
  return { subject, html, text };
}
