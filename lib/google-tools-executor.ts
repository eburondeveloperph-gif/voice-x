import { googleJson, googleFetch, getCurrentUserEmail, searchDriveFirst, createGoogleDoc, exportDriveFile, uploadTextFileToDrive, sendGmail } from './google-api';
import { makeDownloadFile, makeHtmlArtifactFile, makeBlobDownloadData, utf8ToBase64, arrayBufferToBase64, buildContractText, readableDateRange } from './app-helpers';

export async function executeGoogleTool(toolName: string, args: any, accessToken?: string) {
  const executedAt = new Date().toISOString();

  switch (toolName) {
    case 'browse_url': {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(args.url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Failed to fetch URL. Status: ${res.status}`);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const plainText = doc.body.textContent || text;
      const cleanText = plainText.replace(/\\s+/g, ' ').trim().slice(0, 15000);
      return { toolName, executedAt, status: 'completed', url: args.url, content: cleanText };
    }

    case 'render_web_artifact':
    case 'render_html_document': {
      const title = args?.title || 'Generated Artifact';
      const artifactType = args?.artifactType || (toolName === 'render_html_document' ? 'document' : 'web_artifact');
      const suggestedFilename = args?.suggestedFilename || `${title}.html`;
      const summary =
        args?.summary ||
        `I created the ${artifactType.replace(/_/g, ' ')} as a standalone HTML file. Open it in the browser to preview it.`;
      const html = args?.html || '';

      if (!html.trim()) {
        throw new Error('No HTML content was provided.');
      }

      const htmlFile = makeHtmlArtifactFile(html, suggestedFilename);

      let driveFile: any = null;
      let emailResult: any = null;
      const emailTo = args.emailTo === 'current_user' ? getCurrentUserEmail() : args.emailTo;

      if (args.saveToDrive) {
        driveFile = await uploadTextFileToDrive(
          htmlFile.htmlPreviewFilename,
          htmlFile.html,
          'text/html'
        );
      }

      if (emailTo) {
        emailResult = await sendGmail({
          to: emailTo,
          subject: title,
          body: `${summary}\n\nAttached is the standalone HTML artifact. Open it in a browser to view it.`,
          attachment: {
            filename: htmlFile.htmlPreviewFilename,
            mimeType: 'text/html',
            base64Content: utf8ToBase64(htmlFile.html),
          },
        });
      }

      return {
        toolName,
        executedAt,
        status: 'completed',
        title,
        artifactType,
        summary,
        note: summary,
        driveFile,
        emailSentTo: emailTo || null,
        emailResult,
        ...htmlFile,
      };
    }

    case 'gmail_read': {
      const queryText = args?.query || '';
      const limit = Math.min(Number(args?.limit || 10), 20);
      const list = await googleJson(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}${queryText ? `&q=${encodeURIComponent(queryText)}` : ''}`,
        {},
        accessToken
      );

      const messages = await Promise.all(
        (list.messages ||[]).map(async (m: any) => {
          const msg = await googleJson(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            {},
            accessToken
          );

          const headers = msg.payload?.headers ||[];
          const findHeader = (name: string) => headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: msg.id,
            threadId: msg.threadId,
            from: findHeader('From'),
            subject: findHeader('Subject'),
            date: findHeader('Date'),
            snippet: msg.snippet,
          };
        })
      );

      return { toolName, executedAt, status: 'completed', messages };
    }

    case 'gmail_send': {
      const to = args.to === 'current_user' ? getCurrentUserEmail() : args.to;
      if (!to) throw new Error('Recipient email address is required.');

      const result = await sendGmail({
        to,
        subject: args.subject || 'No Subject',
        body: args.body || '',
        cc: args.cc,
        bcc: args.bcc,
      }, accessToken);

      return { toolName, executedAt, status: 'completed', messageId: result.id, threadId: result.threadId };
    }

    case 'gmail_draft': {
      const to = args.to === 'current_user' ? getCurrentUserEmail() : args.to;
      if (!to) throw new Error('Recipient email address is required.');

      const { buildEmailRaw } = await import('./app-helpers');
      const raw = buildEmailRaw({
        to,
        subject: args.subject || 'No Subject',
        body: args.body || '',
        cc: args.cc,
        bcc: args.bcc,
      });

      const result = await googleJson('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        body: JSON.stringify({ message: { raw } }),
      }, accessToken);

      return { toolName, executedAt, status: 'completed', draftId: result.id, message: result.message };
    }

    case 'calendar_check_schedule': {
      const range = readableDateRange(args?.date, args?.timeMin, args?.timeMax);
      const events = await googleJson(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=20&timeMin=${encodeURIComponent(range.timeMin)}&timeMax=${encodeURIComponent(range.timeMax)}`,
        {},
        accessToken
      );

      return { toolName, executedAt, status: 'completed', range, events: events.items ||[] };
    }

    case 'calendar_create_event': {
      const attendees = String(args.attendees || '')
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean)
        .map((email: string) => ({ email }));

      const body: any = {
        summary: args.title,
        location: args.location || '',
        description: args.description || '',
        start: { dateTime: args.startTime },
        end: { dateTime: args.endTime },
        attendees,
      };

      if (args.addMeet) {
        body.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        };
      }

      const result = await googleJson(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events${args.addMeet ? '?conferenceDataVersion=1' : ''}`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        accessToken
      );

      return { toolName, executedAt, status: 'completed', event: result };
    }

    case 'calendar_update_event': {
      let eventId = args.eventId;

      if (!eventId && args.searchQuery) {
        const now = new Date().toISOString();
        const found = await googleJson(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=10&timeMin=${encodeURIComponent(now)}&q=${encodeURIComponent(args.searchQuery)}`,
          {},
          accessToken
        );

        eventId = found.items?.[0]?.id;
      }

      if (!eventId) throw new Error('No calendar event found to update.');

      const current = await googleJson(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {}, accessToken);

      const patched = {
        ...current,
        summary: args.title || current.summary,
        location: args.location ?? current.location,
        description: args.description ?? current.description,
        start: args.newStartTime ? { ...current.start, dateTime: args.newStartTime } : current.start,
        end: args.newEndTime ? { ...current.end, dateTime: args.newEndTime } : current.end,
      };

      const result = await googleJson(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(patched),
      }, accessToken);

      return { toolName, executedAt, status: 'completed', event: result };
    }

    case 'drive_search': {
      const q = args.query || '';
      const limit = Math.min(Number(args.limit || 10), 50);
      const escaped = q.replace(/'/g, "\\'");
      let mimeClause = '';

      if (args.fileType) {
        const type = String(args.fileType).toLowerCase();
        if (type.includes('doc')) mimeClause = " and mimeType = 'application/vnd.google-apps.document'";
        if (type.includes('sheet')) mimeClause = " and mimeType = 'application/vnd.google-apps.spreadsheet'";
        if (type.includes('slide') || type.includes('presentation')) mimeClause = " and mimeType = 'application/vnd.google-apps.presentation'";
        if (type.includes('pdf')) mimeClause = " and mimeType = 'application/pdf'";
        if (type.includes('html')) mimeClause = " and mimeType = 'text/html'";
      }

      const result = await googleJson(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name contains '${escaped}' and trashed = false${mimeClause}`)}&fields=files(id,name,mimeType,webViewLink,webContentLink,modifiedTime,size)&pageSize=${limit}`,
        {},
        accessToken
      );

      return { toolName, executedAt, status: 'completed', files: result.files ||[] };
    }

    case 'drive_read_file': {
      let fileId = args.fileId;

      if (!fileId && args.fileName) {
        const found = await searchDriveFirst(args.fileName, accessToken);
        fileId = found?.id;
      }

      if (!fileId) throw new Error('No file id or matching file name found.');

      const meta = await googleJson(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,webContentLink,size`,
        {},
        accessToken
      );

      const exportMimeType = args.exportMimeType || (
        meta.mimeType === 'application/vnd.google-apps.document'
          ? 'text/plain'
          : meta.mimeType === 'application/vnd.google-apps.spreadsheet'
            ? 'text/csv'
            : meta.mimeType === 'application/vnd.google-apps.presentation'
              ? 'text/plain'
              : ''
      );

      if (meta.mimeType?.startsWith('application/vnd.google-apps') && exportMimeType) {
        const blob = await exportDriveFile(fileId, exportMimeType, accessToken);
        const text = exportMimeType.startsWith('text/') ? await blob.text() : '';
        const downloadData = await makeBlobDownloadData(blob);

        return {
          toolName,
          executedAt,
          status: 'completed',
          file: meta,
          exportedMimeType: exportMimeType,
          textPreview: text.slice(0, 12000),
          downloadData,
          downloadFilename: `${meta.name}.${exportMimeType.includes('pdf') ? 'pdf' : 'txt'}`,
        };
      }

      const res = await googleFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {}, accessToken);
      const blob = await res.blob();
      const downloadData = await makeBlobDownloadData(blob);

      return {
        toolName,
        executedAt,
        status: 'completed',
        file: meta,
        downloadData,
        downloadFilename: meta.name,
      };
    }

    case 'drive_upload_file': {
      const result = await uploadTextFileToDrive(
        args.fileName,
        args.content || '',
        args.mimeType || 'text/plain',
        args.folderId,
        accessToken
      );

      return { toolName, executedAt, status: 'completed', file: result };
    }

    case 'docs_create': {
      const doc = await createGoogleDoc(args.title, args.content || '');

      let pdfDownload: any = {};
      let emailResult: any = null;

      if (args.exportPdf) {
        const pdfBlob = await exportDriveFile(doc.documentId, 'application/pdf');
        const downloadData = await makeBlobDownloadData(pdfBlob);

        pdfDownload = {
          downloadData,
          downloadFilename: `${args.title || 'document'}.pdf`,
        };

        if (args.emailTo) {
          const buffer = await pdfBlob.arrayBuffer();

          emailResult = await sendGmail({
            to: args.emailTo,
            subject: args.title || 'Document',
            body: 'Attached is the requested document PDF.',
            attachment: {
              filename: pdfDownload.downloadFilename,
              mimeType: 'application/pdf',
              base64Content: arrayBufferToBase64(buffer),
            },
          });
        }
      }

      return {
        toolName,
        executedAt,
        status: 'completed',
        documentId: doc.documentId,
        webViewLink: doc.driveFile?.webViewLink,
        emailResult,
        ...pdfDownload,
      };
    }

    case 'docs_update': {
      let documentId = args.documentId;

      if (!documentId && args.title) {
        const found = await searchDriveFirst(args.title, accessToken);
        documentId = found?.id;
      }

      if (!documentId) throw new Error('No document id or matching title found.');

      if (args.mode === 'replace') {
        const doc = await googleJson(`https://docs.googleapis.com/v1/documents/${documentId}`, {}, accessToken);
        const endIndex = doc.body?.content?.slice(-1)?.[0]?.endIndex || 1;

        await googleJson(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          body: JSON.stringify({
            requests:[
              {
                deleteContentRange: {
                  range: { startIndex: 1, endIndex: Math.max(1, endIndex - 1) },
                },
              },
              {
                insertText: {
                  location: { index: 1 },
                  text: args.content,
                },
              },
            ],
          }),
        }, accessToken);
      } else {
        await googleJson(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          body: JSON.stringify({
            requests:[
              {
                insertText: {
                  endOfSegmentLocation: {},
                  text: `\n${args.content}`,
                },
              },
            ],
          }),
        }, accessToken);
      }

      const meta = await googleJson(
        `https://www.googleapis.com/drive/v3/files/${documentId}?fields=id,name,mimeType,webViewLink`,
        {},
        accessToken
      );

      return { toolName, executedAt, status: 'completed', documentId, file: meta };
    }

    case 'sheets_read': {
      let spreadsheetId = args.spreadsheetId;

      if (!spreadsheetId && args.query) {
        const found = await searchDriveFirst(args.query, accessToken);
        spreadsheetId = found?.id;
      }

      if (!spreadsheetId) throw new Error('No spreadsheet id or matching spreadsheet found.');

      const range = args.range || 'A1:Z100';
      const result = await googleJson(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {},
        accessToken
      );

      return { toolName, executedAt, status: 'completed', spreadsheetId, range, values: result.values ||[] };
    }

    case 'sheets_update': {
      const result = await googleJson(
        `https://sheets.googleapis.com/v4/spreadsheets/${args.spreadsheetId}/values/${encodeURIComponent(args.range)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          body: JSON.stringify({
            values: Array.isArray(args.values) ? args.values : args.values?.values ||[],
          }),
        },
        accessToken
      );

      return { toolName, executedAt, status: 'completed', result };
    }

    case 'slides_create': {
      const presentation = await googleJson('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        body: JSON.stringify({ title: args.title }),
      }, accessToken);

      return { toolName, executedAt, status: 'completed', presentation };
    }

    case 'tasks_list': {
      const listId = args.listId || '@default';
      const result = await googleJson(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, {}, accessToken);
      return { toolName, executedAt, status: 'completed', tasks: result.items ||[] };
    }

    case 'tasks_create': {
      const result = await googleJson('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: args.title,
          notes: args.notes || '',
          due: args.due || undefined,
        }),
      }, accessToken);

      return { toolName, executedAt, status: 'completed', task: result };
    }

    case 'contacts_search': {
      const result = await googleJson(
        `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(args.query)}&readMask=names,emailAddresses,phoneNumbers,organizations`,
        {},
        accessToken
      );

      return { toolName, executedAt, status: 'completed', contacts: result.results ||[] };
    }

    case 'meet_schedule': {
      const endTime = args.endTime || new Date(new Date(args.startTime).getTime() + 30 * 60000).toISOString();

      const attendees = String(args.attendees || '')
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean)
        .map((email: string) => ({ email }));

      const result = await googleJson(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          body: JSON.stringify({
            summary: args.title,
            start: { dateTime: args.startTime },
            end: { dateTime: endTime },
            attendees,
            conferenceData: {
              createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          }),
        },
        accessToken
      );

      return { toolName, executedAt, status: 'completed', event: result, meetingLink: result.hangoutLink };
    }

    case 'youtube_search': {
      const limit = Math.min(Number(args.limit || 5), 20);
      const result = await googleJson(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${limit}&q=${encodeURIComponent(args.query)}`,
        {},
        accessToken
      );

      return { toolName, executedAt, status: 'completed', videos: result.items ||[] };
    }

    case 'forms_create': {
      const result = await googleJson('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        body: JSON.stringify({
          info: {
            title: args.title,
          },
        }),
      }, accessToken);

      return { toolName, executedAt, status: 'completed', form: result };
    }

    case 'analytics_report': {
      const metrics = String(args.metrics || 'activeUsers,sessions')
        .split(',')
        .map((name: string) => ({ name: name.trim() }))
        .filter((m: any) => m.name);

      const dimensions = String(args.dimensions || 'date')
        .split(',')
        .map((name: string) => ({ name: name.trim() }))
        .filter((d: any) => d.name);

      const result = await googleJson(
        `https://analyticsdata.googleapis.com/v1beta/properties/${args.propertyId}:runReport`,
        {
          method: 'POST',
          body: JSON.stringify({
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            metrics,
            dimensions,
          }),
        },
        accessToken
      );

      return { toolName, executedAt, status: 'completed', report: result };
    }

    case 'workspace_search': {
      const sources = String(args.sources || 'mail,drive,calendar')
        .split(',')
        .map((s: string) => s.trim().toLowerCase());

      const output: any = { mail: null, drive: null, calendar: null };

      if (sources.includes('mail') || sources.includes('gmail')) {
        try {
          output.mail = await executeGoogleTool('gmail_read', { query: args.query, limit: 5 }, accessToken);
        } catch (e: any) {
          output.mail = { error: e.message };
        }
      }

      if (sources.includes('drive') || sources.includes('files')) {
        try {
          output.drive = await executeGoogleTool('drive_search', { query: args.query, limit: 5 }, accessToken);
        } catch (e: any) {
          output.drive = { error: e.message };
        }
      }

      if (sources.includes('calendar')) {
        try {
          output.calendar = await executeGoogleTool('calendar_check_schedule', { date: new Date().toISOString() }, accessToken);
        } catch (e: any) {
          output.calendar = { error: e.message };
        }
      }

      return { toolName, executedAt, status: 'completed', results: output };
    }

    case 'create_contract_document': {
      const contractText = buildContractText(args);
      const title = args.title || `${args.contractType || 'Contract'} - ${args.partyA || 'Party A'} and ${args.partyB || 'Party B'}`;
      const doc = await createGoogleDoc(title, contractText, accessToken);
      const pdfBlob = await exportDriveFile(doc.documentId, 'application/pdf', accessToken);
      const pdfDownloadData = await makeBlobDownloadData(pdfBlob);
      const pdfBuffer = await pdfBlob.arrayBuffer();

      let emailResult = null;
      const emailTo = args.emailTo === 'current_user' ? getCurrentUserEmail() : args.emailTo;

      if (emailTo) {
        emailResult = await sendGmail({
          to: emailTo,
          subject: title,
          body: 'Attached is the contract PDF.',
          attachment: {
            filename: `${title}.pdf`,
            mimeType: 'application/pdf',
            base64Content: arrayBufferToBase64(pdfBuffer),
          },
        });
      }

      return {
        toolName,
        executedAt,
        status: 'completed',
        title,
        documentId: doc.documentId,
        driveLink: doc.driveFile?.webViewLink,
        emailSentTo: emailTo || null,
        emailResult,
        textPreview: contractText.slice(0, 12000),
        downloadData: pdfDownloadData,
        downloadFilename: `${title}.pdf`,
      };
    }

    default:
      throw new Error(`Tool "${toolName}" is not implemented yet.`);
  }
}
