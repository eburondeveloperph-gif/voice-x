import { Type } from '@google/genai';
import { AgentSettings } from './app-interfaces';
import { BIBLE_PERSONALITY } from './personality';

export const LIVE_MODEL = 'gemini-3.1-flash-live-preview';
export const EBURON_LOGO_URL = 'https://eburon.ai/icon-eburon.svg';
export const PRODUCT_BRAND = 'VEP';
export const PRODUCT_FULL_NAME = 'Virtual Employee Persona';

export const GEMINI_LIVE_VOICE_OPTIONS =[
  { alias: 'Superman', id: 'Charon', vibe: 'deep, steady, grounded' },
  { alias: 'Wonder Woman', id: 'Kore', vibe: 'clear, composed, warm' },
  { alias: 'Batman', id: 'Fenrir', vibe: 'dark, firm, serious' },
  { alias: 'Iron Man', id: 'Puck', vibe: 'quick, bright, witty' },
  { alias: 'Athena', id: 'Aoede', vibe: 'elegant, smooth, intelligent' },
  { alias: 'Captain Marvel', id: 'Zephyr', vibe: 'bright, airy, confident' },
  { alias: 'Black Panther', id: 'Orus', royal: 'calm, precise' },
  { alias: 'Scarlet Witch', id: 'Leda', vibe: 'soft, mysterious, expressive' },
  { alias: 'Storm', id: 'Callirrhoe', vibe: 'flowing, strong, graceful' },
  { alias: 'Jean Grey', id: 'Autonoe', vibe: 'controlled, thoughtful, warm' },
  { alias: 'Thor', id: 'Enceladus', vibe: 'heavy, bold, powerful' },
  { alias: 'Hulk', id: 'Iapetus', vibe: 'large, grounded, blunt' },
  { alias: 'Nightwing', id: 'Umbriel', vibe: 'smooth, calm, agile' },
  { alias: 'Aquaman', id: 'Algieba', vibe: 'warm, confident, resonant' },
  { alias: 'Invisible Woman', id: 'Despina', vibe: 'soft, measured, discreet' },
  { alias: 'Black Widow', id: 'Erinome', vibe: 'low, calm, controlled' },
  { alias: 'Green Lantern', id: 'Algenib', vibe: 'clean, heroic, direct' },
  { alias: 'Doctor Strange', id: 'Rasalgethi', vibe: 'wise, textured, deliberate' },
  { alias: 'Supergirl', id: 'Laomedeia', vibe: 'clear, bright, friendly' },
  { alias: 'Raven', id: 'Achernar', vibe: 'cool, quiet, focused' },
  { alias: 'Cyclops', id: 'Alnilam', vibe: 'clean, direct, precise' },
  { alias: 'Catwoman', id: 'Schedar', vibe: 'smooth, calm, sly' },
  { alias: 'Wolverine', id: 'Gacrux', vibe: 'rough, grounded, blunt' },
  { alias: 'Flash', id: 'Pulcherrima', vibe: 'bright, quick, energetic' },
  { alias: 'Robin', id: 'Achird', vibe: 'young, clear, responsive' },
  { alias: 'Daredevil', id: 'Zubenelgenubi', vibe: 'balanced, sharp, steady' },
  { alias: 'Green Arrow', id: 'Vindemiatrix', vibe: 'dry, focused, confident' },
  { alias: 'Cyborg', id: 'Sadachbia', vibe: 'clean, technical, controlled' },
  { alias: 'Martian Manhunter', id: 'Sadaltager', vibe: 'deep, calm, observant' },
  { alias: 'Silver Surfer', id: 'Sulafat', vibe: 'smooth, distant, reflective' },
];

export const DEFAULT_AGENT_PERSONALITY = BIBLE_PERSONALITY;

export const DEFAULT_SETTINGS: AgentSettings = {
  userName: 'Jo Lernout',
  agentName: 'Beatrice',
  personality: DEFAULT_AGENT_PERSONALITY,
  avatarUrl: '',
  selectedVoice: 'Kore',
};

export const LIVE_RUNTIME = {
  generation: 0,
  ownerId: '',
  startPromise: null as Promise<boolean> | null,
  session: null as any,
  audioRecorder: null as any,
  audioStreamer: null as any,
  isClosing: false,
  visStream: null as MediaStream | null,
  visCtx: null as AudioContext | null,
  visAnalyser: null as AnalyserNode | null,
};

export function isClosedSocketError(error: any) {
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('closing') || message.includes('closed') || message.includes('websocket');
}

export const GOOGLE_SERVICE_TOOLS =[
  {
    name: 'render_web_artifact',
    description:
      'Create and render any complete one-file HTML/CSS/JS artifact: animated slides, Three.js showcases, forms, dashboards, landing pages, calculators, documents, contracts, invoices, reports, visual prototypes, demos, or printable pages. The frontend saves it to chat as downloadable and openable HTML.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Artifact title.' },
        artifactType: {
          type: Type.STRING,
          description:
            'Type of artifact: slides, form, dashboard, landing_page, contract, document, threejs_showcase, calculator, demo, prototype, report, invoice, other.',
        },
        suggestedFilename: {
          type: Type.STRING,
          description: 'Suggested filename ending in .html, for example animated-threejs-slides.html.',
        },
        summary: {
          type: Type.STRING,
          description: 'Short normal human summary of what was created.',
        },
        html: {
          type: Type.STRING,
          description:
            'Complete standalone HTML file. Must include DOCTYPE, html, head, style, body, and script if needed. Must be directly openable in browser.',
        },
        saveToDrive: { type: Type.BOOLEAN, description: 'If true, upload the HTML artifact to the user drive.' },
        emailTo: { type: Type.STRING, description: 'Optional email address to send the HTML artifact to. Use current_user if requested.' },
      },
      required: ['title', 'html'],
    },
  },
  {
    name: 'render_html_document',
    description:
      'Create a complete standalone printable HTML document, contract, agreement, proposal, report, invoice, certificate, letter, or PDF-style page. The frontend saves it to chat as a downloadable HTML file that can be opened and printed/saved as PDF.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The title of the document.' },
        suggestedFilename: { type: Type.STRING, description: 'Suggested filename, for example saas-development-agreement.html.' },
        summary: { type: Type.STRING, description: 'Short normal human summary of what was generated.' },
        html: {
          type: Type.STRING,
          description:
            'Complete standalone HTML document. Must include DOCTYPE, html, head, style, body, and print CSS. It should be printable as PDF through the browser.',
        },
        saveToDrive: { type: Type.BOOLEAN, description: 'If true, upload the HTML document to the user drive.' },
        emailTo: { type: Type.STRING, description: 'Optional email address to send the HTML document to. Use current_user if requested.' },
      },
      required: ['title', 'html'],
    },
  },
  {
    name: 'browse_url',
    description: 'Fetch, read, and extract text content from any website URL or web page.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'The URL to visit and read.' },
      },
      required:['url'],
    },
  },
  {
    name: 'gmail_read',
    description:
      'Read or search the user mail inbox. Use when the user asks about mail, inbox, unread messages, senders, email content, or recent mail.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Mail search query, sender, subject, or keyword.' },
        limit: { type: Type.NUMBER, description: 'Maximum number of messages to fetch.' },
      },
      required:[],
    },
  },
  {
    name: 'gmail_send',
    description: 'Send an email from the user account.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING, description: 'Recipient email address or comma-separated recipients.' },
        subject: { type: Type.STRING, description: 'Email subject.' },
        body: { type: Type.STRING, description: 'Email body.' },
        cc: { type: Type.STRING, description: 'Optional CC recipients.' },
        bcc: { type: Type.STRING, description: 'Optional BCC recipients.' },
      },
      required:['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_draft',
    description: 'Create a draft email for review.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING, description: 'Recipient email address.' },
        subject: { type: Type.STRING, description: 'Draft subject.' },
        body: { type: Type.STRING, description: 'Draft body.' },
        cc: { type: Type.STRING, description: 'Optional CC recipients.' },
        bcc: { type: Type.STRING, description: 'Optional BCC recipients.' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'calendar_check_schedule',
    description: 'Check schedule, availability, conflicts, or upcoming events in the user calendar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'Date to check, ISO format if possible.' },
        timeMin: { type: Type.STRING, description: 'Optional start datetime.' },
        timeMax: { type: Type.STRING, description: 'Optional end datetime.' },
      },
      required:[],
    },
  },
  {
    name: 'calendar_create_event',
    description: 'Create a calendar event.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Event title.' },
        startTime: { type: Type.STRING, description: 'Start datetime in ISO 8601 format.' },
        endTime: { type: Type.STRING, description: 'End datetime in ISO 8601 format.' },
        attendees: { type: Type.STRING, description: 'Comma-separated attendee emails.' },
        location: { type: Type.STRING, description: 'Optional location.' },
        description: { type: Type.STRING, description: 'Optional description.' },
        addMeet: { type: Type.BOOLEAN, description: 'Whether to add a video meeting link.' },
      },
      required:['title', 'startTime', 'endTime'],
    },
  },
  {
    name: 'calendar_update_event',
    description: 'Update or reschedule an existing calendar event.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        eventId: { type: Type.STRING, description: 'Calendar event id if known.' },
        searchQuery: { type: Type.STRING, description: 'Event title or search phrase if id is unknown.' },
        newStartTime: { type: Type.STRING, description: 'New start datetime.' },
        newEndTime: { type: Type.STRING, description: 'New end datetime.' },
        title: { type: Type.STRING, description: 'New event title.' },
        location: { type: Type.STRING, description: 'New event location.' },
        description: { type: Type.STRING, description: 'New event description.' },
      },
      required:[],
    },
  },
  {
    name: 'drive_search',
    description: 'Search files, folders, documents, spreadsheets, presentations, PDFs, or uploaded content in the user drive.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Search query or filename.' },
        fileType: { type: Type.STRING, description: 'Optional file type filter.' },
        limit: { type: Type.NUMBER, description: 'Maximum number of results.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'drive_read_file',
    description: 'Read or export a file from the user drive when file id or name is known.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fileId: { type: Type.STRING, description: 'File id if available.' },
        fileName: { type: Type.STRING, description: 'File name or search term if id is unknown.' },
        exportMimeType: { type: Type.STRING, description: 'Optional export MIME type, e.g. application/pdf or text/plain.' },
      },
      required:[],
    },
  },
  {
    name: 'drive_upload_file',
    description: 'Upload or save a file into the user drive.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fileName: { type: Type.STRING, description: 'File name.' },
        content: { type: Type.STRING, description: 'Text content to upload.' },
        mimeType: { type: Type.STRING, description: 'File MIME type.' },
        folderId: { type: Type.STRING, description: 'Optional folder id.' },
      },
      required: ['fileName', 'content'],
    },
  },
  {
    name: 'docs_create',
    description: 'Create a document and optionally export it as PDF.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Document title.' },
        content: { type: Type.STRING, description: 'Initial document content.' },
        exportPdf: { type: Type.BOOLEAN, description: 'Whether to export PDF for download.' },
        emailTo: { type: Type.STRING, description: 'Optional email address to send the PDF or document text to.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'docs_update',
    description: 'Update a document.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        documentId: { type: Type.STRING, description: 'Document id.' },
        title: { type: Type.STRING, description: 'Document title if id is unknown.' },
        content: { type: Type.STRING, description: 'New or appended content.' },
        mode: { type: Type.STRING, description: 'replace, append, or edit.' },
      },
      required: ['content'],
    },
  },
  {
    name: 'sheets_read',
    description: 'Read spreadsheet data.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        spreadsheetId: { type: Type.STRING, description: 'Spreadsheet id.' },
        range: { type: Type.STRING, description: 'Sheet range, for example Sheet1!A1:D10.' },
        query: { type: Type.STRING, description: 'File name or search query if id unknown.' },
      },
      required:[],
    },
  },
  {
    name: 'sheets_update',
    description: 'Write or update spreadsheet data.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        spreadsheetId: { type: Type.STRING, description: 'Spreadsheet id.' },
        range: { type: Type.STRING, description: 'Target range.' },
        values: { type: Type.OBJECT, description: 'Rows/cells to write as a 2D array.' },
      },
      required:['spreadsheetId', 'range', 'values'],
    },
  },
  {
    name: 'slides_create',
    description: 'Create a presentation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Presentation title.' },
        outline: { type: Type.STRING, description: 'Slide outline or content.' },
      },
      required:['title'],
    },
  },
  {
    name: 'tasks_list',
    description: 'List user tasks or to-dos.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        listId: { type: Type.STRING, description: 'Optional task list id, defaults to @default.' },
      },
      required:[],
    },
  },
  {
    name: 'tasks_create',
    description: 'Create a task or to-do.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Task title.' },
        notes: { type: Type.STRING, description: 'Optional notes.' },
        due: { type: Type.STRING, description: 'Optional due date in ISO format.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'contacts_search',
    description: 'Search user contacts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Name, email, phone, or company.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'meet_schedule',
    description: 'Schedule a video meeting link by creating a calendar event with conference data.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Meeting title.' },
        attendees: { type: Type.STRING, description: 'Comma-separated attendees.' },
        startTime: { type: Type.STRING, description: 'Start time.' },
        endTime: { type: Type.STRING, description: 'End time.' },
      },
      required: ['title', 'startTime'],
    },
  },
  {
    name: 'youtube_search',
    description: 'Search videos.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Video search query.' },
        limit: { type: Type.NUMBER, description: 'Maximum results.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'forms_create',
    description: 'Create a form or survey.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Form title.' },
        questions: { type: Type.OBJECT, description: 'Questions and options.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'analytics_report',
    description: 'Fetch analytics, traffic, metrics, or performance reports from GA4.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        propertyId: { type: Type.STRING, description: 'GA4 numeric property id.' },
        dateRange: { type: Type.STRING, description: 'Date range, e.g. last30days.' },
        metrics: { type: Type.STRING, description: 'Comma-separated metrics, e.g. activeUsers,sessions.' },
        dimensions: { type: Type.STRING, description: 'Comma-separated dimensions, e.g. date,country.' },
      },
      required: ['propertyId'],
    },
  },
  {
    name: 'workspace_search',
    description: 'Search across connected workspace data, including mail, files, documents, tasks, calendar, and contacts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Search query.' },
        sources: { type: Type.STRING, description: 'Comma-separated sources to search.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_contract_document',
    description:
      'Create a full contract document, save it as a document in the user drive, export it as PDF, optionally email it, and return a downloadable PDF in chat.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Contract title.' },
        contractType: { type: Type.STRING, description: 'Type of contract, e.g. service agreement, NDA, employment agreement.' },
        partyA: { type: Type.STRING, description: 'First party name.' },
        partyB: { type: Type.STRING, description: 'Second party name.' },
        effectiveDate: { type: Type.STRING, description: 'Effective date.' },
        jurisdiction: { type: Type.STRING, description: 'Governing law or jurisdiction.' },
        terms: { type: Type.STRING, description: 'Important terms, scope, payment, obligations, duration, termination, confidentiality, etc.' },
        emailTo: { type: Type.STRING, description: 'Optional email address to send PDF to. Use current_user if requested.' },
      },
      required:['title', 'contractType', 'partyA', 'partyB', 'terms'],
    },
  },
];
