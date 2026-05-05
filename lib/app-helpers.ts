export function safeJsonStringify(value: any) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function makeDownloadFile(result: any, filenameBase: string, mime = 'application/json') {
  const body = mime === 'application/json' ? safeJsonStringify(result) : String(result);
  const data = `data:${mime};charset=utf-8,${encodeURIComponent(body)}`;
  const safe = filenameBase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tool-result';

  return {
    downloadData: data,
    downloadFilename: `${safe}-${Date.now()}${mime === 'application/json' ? '.json' : '.txt'}`,
  };
}

export function normalizeHtml(html: string) {
  const trimmed = String(html || '').trim();

  if (!trimmed) {
    return `<!DOCTYPE html>
<html lang="en">  
<head>  
<meta charset="UTF-8">  
<meta name="viewport" content="width=device-width, initial-scale=1.0">  
<title>Generated Artifact</title>  
<style>  
body{font-family:Arial,sans-serif;background:#111;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}  
.card{max-width:720px;padding:32px;border:1px solid rgba(255,255,255,.15);border-radius:24px;background:rgba(255,255,255,.06)}  
</style>  
</head>  
<body>  
<div class="card">  
<h1>Empty Artifact</h1>  
<p>No HTML was provided.</p>  
</div>  
</body>  
</html>`;
  }

  if (trimmed.toLowerCase().startsWith('<!doctype html')) return trimmed;

  if (trimmed.toLowerCase().startsWith('<html')) {
    return `<!DOCTYPE html>\n${trimmed}`;
  }

  return `<!DOCTYPE html>
<html lang="en">  
<head>  
<meta charset="UTF-8">  
<meta name="viewport" content="width=device-width, initial-scale=1.0">  
<title>Generated Artifact</title>  
</head>  
<body>  
${trimmed}  
</body>  
</html>`;
}

export function makeHtmlArtifactFile(html: string, filenameBase: string) {
  const safe =
    String(filenameBase || 'artifact')
      .toLowerCase()
      .replace(/\.html$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'artifact';

  const finalHtml = normalizeHtml(html);
  const data = `data:text/html;charset=utf-8,${encodeURIComponent(finalHtml)}`;

  return {
    html: finalHtml,
    htmlPreviewData: data,
    htmlPreviewFilename: `${safe}.html`,
    downloadData: data,
    downloadFilename: `${safe}.html`,
  };
}

export function makeBlobDownloadData(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function utf8ToBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64UrlEncode(value: string) {
  return utf8ToBase64(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function sanitizeEmailHeader(value: string) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

export function encodeEmailSubject(value: string) {
  const clean = sanitizeEmailHeader(value);
  if (/^[\x00-\x7F]*$/.test(clean)) return clean;
  return `=?UTF-8?B?${utf8ToBase64(clean)}?=`;
}

export function chunkBase64(value: string) {
  return String(value || '').replace(/.{1,76}/g, '$&\r\n').trim();
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function buildEmailRaw({
  to,
  subject,
  body,
  cc,
  bcc,
  attachment,
}: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  attachment?: {
    filename: string;
    mimeType: string;
    base64Content: string;
  };
}) {
  const headers =[
    `To: ${sanitizeEmailHeader(to)}`,
    cc ? `Cc: ${sanitizeEmailHeader(cc)}` : '',
    bcc ? `Bcc: ${sanitizeEmailHeader(bcc)}` : '',
    `Subject: ${encodeEmailSubject(subject)}`,
    'MIME-Version: 1.0',
  ].filter(Boolean);

  if (!attachment) {
    const raw =[
      ...headers,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      body,
    ].join('\r\n');
    return base64UrlEncode(raw);
  }

  const boundary = `boundary_${Date.now()}`;
  const raw =[
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
    '',
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${sanitizeEmailHeader(attachment.filename)}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${sanitizeEmailHeader(attachment.filename)}"`,
    '',
    chunkBase64(attachment.base64Content),
    '',
    `--${boundary}--`,
  ].join('\r\n');

  return base64UrlEncode(raw);
}

export function readableDateRange(date?: string, timeMin?: string, timeMax?: string) {
  const now = new Date();
  if (timeMin && timeMax) {
    return { timeMin, timeMax };
  }
  const target = date ? new Date(date) : now;
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);
  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

export function buildContractText({
  title,
  contractType,
  partyA,
  partyB,
  effectiveDate,
  jurisdiction,
  terms,
}: any) {
  const today = new Date().toLocaleDateString();

  return `${title || 'Contract Agreement'}

Type of Agreement:
${contractType || 'Agreement'}

Effective Date:
${effectiveDate || today}

Parties:
1. ${partyA || 'Party A'}
2. ${partyB || 'Party B'}

3. Purpose
This Agreement sets out the terms and conditions under which the parties agree to work together.

4. Scope
The scope of this Agreement includes the following:
${terms || 'The parties will define the scope in writing.'}

5. Responsibilities
Each party agrees to act in good faith, perform its obligations with reasonable care, and communicate promptly regarding any material issue that may affect performance.

6. Payment and Consideration
Any payment, fees, or consideration shall be handled according to the terms agreed by the parties in writing.

7. Confidentiality
Each party agrees to keep confidential information private and not disclose it to third parties except where required by law or agreed in writing.

8. Term and Termination
This Agreement begins on the Effective Date and continues until completed, terminated by mutual agreement, or terminated according to written terms agreed by the parties.

9. Intellectual Property
Unless otherwise agreed in writing, each party retains ownership of its pre-existing intellectual property.

10. Limitation of Liability
Neither party shall be liable for indirect, incidental, special, or consequential damages unless prohibited by applicable law.

11. Governing Law
This Agreement shall be governed by the laws of ${jurisdiction || 'the applicable jurisdiction agreed by the parties'}.

12. Entire Agreement
This Agreement represents the understanding between the parties regarding its subject matter and may be amended only in writing.

13. Signatures

Party A:
Name: ${partyA || 'Party A'}
Signature: ______________________________
Date: ___________________

Party B:
Name: ${partyB || 'Party B'}
Signature: ______________________________
Date: ___________________

Note:
This draft is generated for convenience and should be reviewed by a qualified legal professional before signing.`;
}
