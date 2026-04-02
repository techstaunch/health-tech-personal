# Health Tech Project - Technical Handover Document

## 1. Executive Summary

The **Health Tech** application is a modern, responsive clinical documentation web application. It features a robust text editor, voice dictation integration, and an AI-assisted workflow designed for healthcare professionals. Built with React 19, TypeScript, and Vite, the application is optimized for performance, scalability, and seamless integration as an embedded module (via iframe) into parent applications (such as .NET or Blazor backends).

## 2. Technology Stack

- **Core Rendering**: React 19.2.0, React DOM
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 3.4.17, Radix UI (accessible component primitives), Lucide React (icons)
- **Rich Text Editor**: TipTap (Prosemirror based) with extensions for specialized text formatting.
- **Voice & AI**: `@elevenlabs/elevenlabs-js`, Web Speech API (for voice command control and dictation)
- **Authentication**: JWT validation using `jose` with remote JWKS rotation.
- **Routing**: `react-router-dom`
- **Other Integrations**: `react-signature-canvas` (for patient/doctor signoffs), `react-diff-viewer-continued` (for clinical prompt difference viewing).

## 3. Core Architecture & Workflows

### 3.1 State Management (`DraftProvider`)
The core clinical documentation state is managed via `DraftProvider.tsx` using the Context API. It handles:
- Document transaction states.
- Synchronization of default identifiers (Patient ID, Account Number) from the authenticated token payload.
- Extracting the `sub` (Subject) claim from the validated JWT token to ensure document operations (saving, signing off) accurately attribute the authenticated user.

### 3.2 Dynamic Prompting
System prompts orchestrating the AI agent have been centralized into a dedicated `src/prompts` directory. This pattern separates logic from prompt configurations, making it easier for clinical experts to review AI behavior without digging into component code.

### 3.3 Voice & Dictation 
The app incorporates a global voice command layer. It supports checking the hardware status (microphone access) and conditionally disabling UI elements (like the AI edit button) when dictation is disabled, content is loading, or a document is already signed.

## 4. Development Setup

1. **Prerequisites**: Node.js (v18+ recommended), npm (v9+ recommended).
2. **Installation**:
   ```bash
   npm install
   ```
3. **Local Development**:
   ```bash
   npm run dev
   ```
   The application will run on `http://localhost:3000`.
4. **Environment Variables**: Create a `.env` file based on `.env.example`. Test tokens (`VITE_TEST_TOKEN`) can be used to bypass the iframe authentication flow locally.

## 5. Embedded Iframe Integration

The application is heavily designed to be embedded within a parent portal (e.g., a .NET web app).

### 5.1 Security Headers
Ensure the hosting server provides the correct Content-Security-Policy to allow framing from your parent domain:
```http
Content-Security-Policy: frame-ancestors 'self' https://your-parent-domain.com;
```

### 5.2 Iframe HTML Snippet
To embed the application, use the following snippet in your parent app:

```html
<div class="health-tech-container" style="max-width: 1600px; margin: 0 auto;">
    <iframe 
        src="https://your-deployed-health-tech-url.com" 
        title="Health Tech App"
        style="width: 100%; height: 95vh; border: 2px solid #ddd; border-radius: 8px;"
        allow="microphone; clipboard-write" 
        loading="lazy">
    </iframe>
</div>
```
> **Note:** The `allow="microphone; clipboard-write"` property is **critical**. Without it, voice dictation and copy-to-clipboard functionality will fail.

### 5.3 Authentication via postMessage (Post-Load)
Because third-party cookies or session states might drop inside an iframe, the app relies on a secure handshake with the parent window:

1. **Initialization**: The React app detects it's in an iframe (`window.self !== window.top`) and dispatches a `READY` message to the parent window.
2. **Token Passing**: The parent app listens for `READY` and posts back a secure JWT token.

**Parent Window Implementation (e.g., .NET):**
```javascript
window.addEventListener('message', (event) => {
    // 1. Listen for the app declaring it's ready
    if (event.data && event.data.type === 'READY') {
        const iframe = document.querySelector('iframe');
        // 2. Pass the validated session access token securely
        iframe.contentWindow.postMessage({ 
            accessToken: 'YOUR_SECURE_JWT_TOKEN' 
        }, 'https://your-deployed-health-tech-url.com');
    }
});
```

**Inside Health Tech App (`App.tsx` context):**
The app consumes `event.data.accessToken`, validates it cryptographically against an exposed JWKS endpoint (using the `jose` library securely in the browser), extracts claims like `sub` to map standard patient context, and permits entry into the `DraftSummary`.

## 6. Recent Project Enhancements (Audit Log)
For continuity, here are the most recent major changes integrated into the codebase:
- **Responsive Header Layout**: The `DraftSummaryHeader` scales down elegantly for tablet views and dynamically renders `accountNumber` and `patientId`.
- **Identity Sync**: Deprecated the manual patient drop-down in favor of real-time synchronization from the token payload claims. Hardcoded "anonymous" authors were converted to respect the JWT's `sub`.
- **LLM Pipeline Expansion**: Adjusted AI agents to ingest broader "enhance content" commands and process single-area surgical clinical completions cleanly (resolving a dual-output generation issue).
- **Codebase Clean-Up**: Purged unused database schemas (`v2/db`) and tools (`v2/tools`) to improve the bundle size and main loop trace length.

## 7. Next Steps & Maintenance
- **Token Rotation**: Keep an eye on JWT expiration rules in `useValidateToken` if corporate auth boundaries change.
- **TipTap Extensions**: When extending the document layout (e.g., adding tables or images), ensure appropriate TipTap extensions are installed and bundled inside `package.json`.
