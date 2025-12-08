---
title: 'Rust + Reqwest Fix "unable to get local issuer certificate" error'
description: "fix unable to get local issuer certificate error"
pubDate: "Dec 8 2025 10:20 AM"
heroImage: "../../assets/rust-fallback.webp"
tags:
  [
    "rust",
    "reqwest",
    "cloudflare",
    "turnstile",
    "error",
    "certificate",
    "ca-certificates",
  ]
---

Today, I encountered an error where my Cloudflare Turnstile validation function stopped working.

I use Reqwest to send validation requests to Cloudflare.

When I used `&dbg!()` to log the request, I found the following error like this:

```text
unable to get local issuer certificate
```

<br>

```diff lang="rust"
pub async fn validate_turnstile_wrapper(response_token: &str) -> Result<bool, TurnstileError> {
    let turnstile_secret_key = std::env::var("CLOUDFLARE_TURNSTILE_SITE_KEY");

    if let Ok(turnstile_secret_key) = turnstile_secret_key {
        if !response_token.is_empty() {
            let result = validate_turnstile(&turnstile_secret_key, response_token, None)
                .await
+                .map_err(|e| {
+                   dbg!(&e);
+
                    TurnstileError {
                        message: format!("Failed to validate Turnstile token: {}", e),
                    }
                })?;

            Ok(result.success)
        } else {
            Err(TurnstileError {
                message: "Turnstile response token is missing.".to_string(),
            })
        }
    } else {
        Ok(true)
    }
}
```

source: https://github.com/wuttinanhi/rust-forum/blob/6f068849762151b04a814f6a571fc2a16cfc358b/src/utils/turnstile.rs#L84C1-L108C2

The problem was that the system did not have the necessary SSL/TLS certificates installed.

### The Fix

To fix this, you need to install the CA certificates package:

```bash
apt update && apt install -y ca-certificates
```

### On Docker

Base images often strip out many packages to keep the image size small.

Surprisingly, they sometimes remove `ca-certificates`, which is essential for making external HTTP requests.

To fix this in your Dockerfile, add the following line:

<br>

```diff lang="dockerfile" title="Dockerfile"
FROM debian:12-slim

+ RUN apt update && apt install -y ca-certificates

# rest of Dockerfile ...
```

<br>
<br>

Problem solved! 🦀
