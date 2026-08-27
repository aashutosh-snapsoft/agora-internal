# Post-Mortem: Next.js Server Action RCE Attack

**Date:** January 16, 2026
**Author:** Platform Team
**Severity:** Critical
**Status:** Resolved

---

## Executive Summary

For approximately three weeks, the Agora production application experienced intermittent 403 errors on POST requests. The issue was initially attributed to Azure Container Apps' Envoy ingress proxy, suspected to be related to half-open HTTP/2 connections. However, Container Apps provided no request-level logging, making diagnosis impossible.

After migrating from Azure Container Apps to Azure App Service to gain control over ingress and access to request logs, we discovered the true root cause: automated scanners were exploiting a Next.js Server Actions vulnerability to attempt Remote Code Execution (RCE). The attacks had been occurring for weeks, and a separate `ReferenceError` in the logs (which predated the 403 issues) was an early indicator of the malicious traffic.

After deploying middleware-based protections on January 16, 2026 at 04:17 UTC, all subsequent attacks have been successfully blocked. As of 15:50 UTC, **53 attack attempts** have been blocked with no successful exploitation.

**No data was compromised. No code was executed. The attack was fully mitigated.**

---

## Incident Timeline

### Background (Late December 2025 - Early January 2026)

| Timeframe | Event |
|-----------|-------|
| ~3 weeks prior | `ReferenceError: Cannot access 'i' before initialization` begins appearing in logs |
| ~3 weeks prior | Intermittent 403 errors on POST requests begin |
| Ongoing | Issue attributed to Envoy proxy in Azure Container Apps |
| Ongoing | Suspected cause: half-open HTTP/2 connections |
| Ongoing | Unable to diagnose - Container Apps provides no request-level logging |
| Jan 15-16 | Migration from Container Apps to App Service completed |

### January 16, 2026 (Discovery and Resolution)

| Time (UTC) | Event |
|------------|-------|
| 00:39:32 | First ReferenceError captured in new App Service logs |
| 02:00:06 | POST to static JS file with `Next-Action` header observed |
| 02:03:06 | 403 errors resume for legitimate POST requests |
| 03:21:00 | Investigation begins with new logging visibility |
| 03:39:47 | Attack pattern identified - scanner POSTing to `/projects` |
| 04:09:47 | First mitigation deployed (static path blocking) |
| 04:12:47 | Scanner adapts, continues targeting `/projects` |
| 04:17:00 | Final mitigation deployed (Next-Action header blocking) |
| 04:46:13 | First attack blocked with full payload captured |
| 05:19 - 15:50 | Scanner continues attempts every ~30 minutes, all blocked |
| 15:50:33 | Most recent blocked attack (53 total) |

---

## Impact Assessment

### User Impact
- **Duration:** ~3 weeks of intermittent POST failures
- **Affected functionality:** File uploads, form submissions, API POST requests
- **Users affected:** Any users attempting POST operations during attack windows
- **Data loss:** None

### System Impact
- **Service degradation:** POST requests intermittently returned 403 from ingress layer
- **Container stability:** Container remained running; ReferenceError logged but did not cause crashes
- **Diagnostic impact:** Weeks of investigation time spent on wrong hypothesis (Envoy/HTTP2)

### Security Impact
- **Exploitation:** None - attacks did not achieve code execution
- **Data breach:** None
- **Lateral movement:** None

---

## Root Cause Analysis

### The Vulnerability

Next.js Server Actions (introduced in Next.js 13.4) allow server-side functions to be called directly from client components. The framework identifies these requests by the presence of a `Next-Action` HTTP header.

**The flaw:** Next.js processes ANY request with a `Next-Action` header as a server action, regardless of whether the application uses server actions or whether the target path is valid.

### The Attack Vector

1. **Spoofed Server Action Request**
   - Attacker sends POST request with `Next-Action: x` header
   - Target: Static JS files or page routes (not API routes)

2. **Prototype Pollution Payload**
   ```json
   {
     "then": "$1:__proto__:then",
     "status": "resolved_model",
     "value": "{\"then\":\"$B1337\"}",
     "_response": {
       "_prefix": "(async()=>{const c=await import('node:child_process')..."
     }
   }
   ```

3. **Intended Result**
   - Pollute Object prototype chain
   - Import `node:child_process` module
   - Hijack `Server.prototype.emit` to intercept all HTTP requests
   - Execute arbitrary commands

### The ReferenceError Connection

The `ReferenceError: Cannot access 'i' before initialization` that had been appearing in logs for weeks was caused by these malicious requests. When Next.js attempted to process the spoofed server action:

1. Next.js tried to find a server action handler for the fake hash
2. Module initialization code was triggered in an invalid context
3. The error was logged, but the container continued running
4. The ingress layer (Envoy in Container Apps, App Service frontend later) detected the failed requests and began returning 403 as a protective measure

### Why We Initially Blamed Envoy

1. **No request logs** - Container Apps provided no visibility into incoming requests
2. **Intermittent nature** - Attacks came in waves every ~30 minutes, matching patterns of connection issues
3. **POST-specific** - HTTP/2 connection pooling issues often manifest on specific HTTP methods
4. **403 from ingress** - Response came from Envoy, not the application

### Platform Evaluation Gap

Azure Container Apps documentation explicitly notes that ingress access logs are not available and must be captured in application code or via front-door services. This limitation was documented but not identified during the initial platform selection, leaving us without ingress-level request visibility during the incident ([Azure Container Apps logging differences](https://learn.microsoft.com/en-us/azure/spring-apps/migration/migrate-to-azure-container-apps-monitoring), [Microsoft Q&A confirmation](https://learn.microsoft.com/en-us/answers/questions/2278363/container-apps-ingress-logs)). Future platform decisions must validate observability requirements (request logging, metrics, tracing) against vendor documentation before adoption.

### What Changed with App Service Migration

1. **Request logging** - Full visibility into incoming requests, headers, and bodies
2. **Ingress control** - Direct access to configure and monitor the frontend
3. **Diagnostic capability** - Could correlate 403 errors with specific malicious requests
4. **Rapid iteration** - Could deploy and test middleware fixes quickly

### Related CVEs

- **CVE-2024-34351** - SSRF via Host header manipulation in Server Actions
- **CVE-2024-39693** - Prototype pollution in Server Actions response handling

---

## Detection and Response

### Why It Took Three Weeks

1. **Limited observability** - Azure Container Apps did not expose request-level logs
2. **Misleading symptoms** - 403 from Envoy looked like an infrastructure issue
3. **Plausible alternative** - HTTP/2 half-open connections are a known Envoy issue
4. **Intermittent pattern** - Attacks every 30 minutes masked as connection instability

### How We Finally Detected

1. Migrated to App Service to gain logging visibility
2. Observed POST requests returning 403 in 1-3ms (not reaching container)
3. Correlated ReferenceError timestamps with 403 errors
4. Identified external IPs sending requests with `Next-Action` header
5. Captured full payloads revealing RCE exploit attempt

### Indicators of Compromise (IOCs)

**Network:**
- IP Range: `69.15.19.0/24` (Microsoft Azure, Frankfurt)
- IPv6: `2a01:4f8:c012:ca4::1`
- 48+ unique IPs observed

**HTTP Signatures:**
- Header: `Next-Action: x`
- POST to `/_next/static/chunks/*.js`
- POST to page routes with multipart/form-data
- Body containing: `__proto__`, `child_process`, `node:http`
- User-Agent: `Chrome/142.0.0.0`

**Attack Cadence:**
- Two requests per wave (probe + exploit)
- ~30 minute intervals
- Persistent over weeks

---

## Mitigation and Resolution

### Immediate Actions

1. **Migrated to App Service** to gain observability
2. **Identified attack pattern** through log analysis
3. **Deployed middleware** to intercept malicious requests before reaching Next.js
4. **Implemented logging** to capture full attack payloads for analysis

### Technical Solution

Added request validation in `src/middleware.ts`:

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

### Why This Works

- Middleware runs at the Edge, before Next.js processes the request
- Blocks any request with `Next-Action` header to non-API routes
- Returns 400 immediately, preventing Next.js from attempting to process
- Logs full headers and body for forensic analysis
- Does not affect legitimate API POST requests

---

## Lessons Learned

### What Went Well

1. **Platform migration** - Decision to move to App Service enabled diagnosis
2. **Quick resolution** - Once we had visibility, fix was deployed within hours
3. **Effective mitigation** - Middleware solution blocked 100% of subsequent attacks
4. **Good logging** - Captured full attack payloads for analysis and documentation
5. **No data compromise** - Attack never achieved code execution despite weeks of attempts

### What Could Be Improved

1. **Observability first** - Should have prioritized request logging earlier
2. **Question assumptions** - Spent too long on Envoy hypothesis without evidence
3. **Proactive security** - Could have blocked unused Next.js features (Server Actions) proactively
4. **Monitoring gaps** - No alerting on unusual POST patterns or error spikes
5. **Platform evaluation** - Did not validate ingress logging requirements against vendor documentation

### Surprising Findings

1. **Azure as attack source** - Scanner infrastructure hosted on Microsoft Azure
2. **Sophisticated payload** - Multi-stage attack with prototype pollution + RCE chain
3. **Persistence** - Scanner continued for weeks (and still continues) despite no success
4. **Misdiagnosis duration** - Three weeks investigating wrong cause due to lack of logs

---

## Action Items

### Immediate (Completed)

- [x] Migrate from Container Apps to App Service for observability
- [x] Deploy middleware to block server action attacks
- [x] Add logging for suspicious POST requests
- [x] Document attack payloads and IOCs
- [x] Patch applied to `main`, `dev`, and `dev-orchestration-env` branches

### Short-term

- [ ] Add monitoring/alerting for blocked attack patterns
- [ ] Review Next.js security advisories and ensure up-to-date
- [x] Consider WAF rules like OWASP
- [x] Report abuse to Microsoft (`abuse@microsoft.com`)

### Long-term

- [ ] Audit application for other unused Next.js features that could be attack vectors
- [ ] Disable Server Actions in Next.js config if not used
- [ ] Establish observability requirements for future platform decisions (request logging, metrics, tracing) and validate against vendor documentation
- [ ] Subscribe to Next.js security advisories for proactive awareness

---

## Appendix

### Attack Payload Samples

**Payload 1: Command Injection Probe**
```
POST /_next/static/chunks/jquery-3.6.0.42879de7b8087bc9.js
Next-Action: x
Content-Length: 6

cmd=ls
```

**Payload 2: RCE Exploit (truncated)**
```
POST /projects
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryA7k3fQ92mLpXyTgB
Next-Action: x

------WebKitFormBoundaryA7k3fQ92mLpXyTgB
Content-Disposition: form-data; name="0"

{
  "then": "$1:__proto__:then",
  "status": "resolved_model",
  "reason": -1,
  "value": "{\"then\":\"$B1337\"}",
  "_response": {
    "_prefix": "(async()=>{const a=await import('node:http'),b=await import('node:url'),c=await import('node:child_process'),d=a.Server.prototype.emit..."
  }
}
------WebKitFormBoundaryA7k3fQ92mLpXyTgB--
```

### References

- [CVE-2024-34351](https://nvd.nist.gov/vuln/detail/CVE-2024-34351)
- [CVE-2024-39693](https://nvd.nist.gov/vuln/detail/CVE-2024-39693)
- [Next.js Security Advisories](https://github.com/vercel/next.js/security/advisories)
- [OWASP Prototype Pollution](https://owasp.org/www-community/vulnerabilities/Prototype_Pollution)
- [Log and Metrics in Azure Container Apps](https://learn.microsoft.com/en-us/azure/spring-apps/migration/migrate-to-azure-container-apps-monitoring)
- [Container apps ingress logs (Microsoft Q&A)](https://learn.microsoft.com/en-us/answers/questions/2278363/container-apps-ingress-logs)

---

*Post-mortem completed: January 16, 2026*
