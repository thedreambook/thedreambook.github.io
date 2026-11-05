---
title: '(ENG) Introducing my Rust LLDB MCP server'
description: "I create a simple Rust LLDB MCP server"
pubDate: "Nov 3 2026 12:10 AM"
author: dreamoutbox
heroImage: "../../../assets/rust-fallback.webp"
tags:
  [
    "rust",
    "debug",
    "tools",
    "mcp",
    "mcp-server",
    "lldb",
    "rust-lldb"
  ]
---

I create a simple Rust LLDB MCP server. 

it use and invoke rust-lldb directly. it support basic debugger functions such as set breakpoints, step over, step into, print variables and stack trace.

## Install

```sh
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/dreamoutbox/rust_lldb_mcp/main/install.sh | bash
```

## Add to MCP Config

Add rust_lldb_mcp to your MCP client configuration

```json
{
  "mcpServers": {
    "rust_lldb_mcp": {
      "command": "/path/to/rust_lldb_mcp",
      "args": [
        "--log-values",
        "--log-dir",
        "/path/to/logs"
      ]
    }
  }
}
```

## Source code

[https://github.com/dreamoutbox/rust_lldb_mcp](https://github.com/dreamoutbox/rust_lldb_mcp)
