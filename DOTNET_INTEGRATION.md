# .NET Integration Guide: Health Tech Iframe

To embed the Health Tech application into your .NET application, follow these steps depending on your technology stack (Blazor, ASP.NET Core MVC/Razor Pages).

## 1. Security Headers (Provider Side)

The Health Tech app must allow framing from your .NET application's domain. In production, ensure the following headers are set on the server hosting the React app:

```http
Content-Security-Policy: frame-ancestors 'self' https://your-dotnet-app-domain.com;
```
*Alternatively (Older browsers):*
```http
X-Frame-Options: ALLOW-FROM https://your-dotnet-app-domain.com
```

---

## 2. ASP.NET Core (Razor Pages / MVC)

Add the following to your View (`.cshtml`):

```html
<div class="health-tech-container">
    <iframe src="https://health-tech-app.com" 
            style="width: 100%; height: 800px; border: none;"
            title="Health Tech Integration"
            allow="microphone; camera; clipboard-write" 
            loading="lazy">
    </iframe>
</div>
```

---

## 3. Blazor (Server or WebAssembly)

You can create a simple wrapper component:

```razor
@* HealthTechIframe.razor *@

<div class="iframe-wrapper">
    <iframe src="@SourceUrl" 
            style="width: 100%; height: 800px; border: none;" 
            allow="microphone; camera; clipboard-write">
    </iframe>
</div>

@code {
    [Parameter]
    public string SourceUrl { get; set; } = "https://health-tech-app.com";
}
```

---

## 4. Communication (Optional)

If you need to pass data between the .NET app and the React app, use the `postMessage` API.

**In React (App.tsx):**
The React app will notify the parent when it's mounted, validate the received `accessToken` using JWKS, and then store it.
```typescript
import { validateToken } from "./utils/validate-token";

// Inside App component
const handleMessage = async (event: MessageEvent) => {
  if (event.data && event.data.accessToken) {
    try {
      const payload = await validateToken(event.data.accessToken);
      console.log('Validated payload:', payload);
      // Store and use the accessToken...
    } catch (err) {
      console.error('Invalid token');
    }
  }
};
```

**Utility (src/utils/validate-token.ts):**
```typescript
import * as jose from "jose";

export async function validateToken(token: string) {
  const JWKS = jose.createRemoteJWKSet(
    new URL("https://192.168.168.199/DUSAIAPI/api/SainceJWTKSRotation?AppClientID=4")
  );

  const { payload } = await jose.jwtVerify(token, JWKS, {
    issuer: "SAINCE",
    audience: "TECHSTAUNCH",
    algorithms: ["RS256"],
  });

  return payload;
}
```

**In .NET (JavaScript Interop):**
Listen for the `READY` message from the React iframe, and then send back the `accessToken`.
```javascript
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'READY') {
        const iframe = document.querySelector('iframe');
        iframe.contentWindow.postMessage({ accessToken: 'your-jwt-token-here' }, '*');
    }
});
```

> [!TIP]
> Always use a specific origin instead of `*` in production for security.
