---
title: '(ENG) Introducing dev-vps CLI'
description: "CLI to create VPS server for developer"
pubDate: "Nov 3 2026 12:00 AM"
author: dreamoutbox
heroImage: "../../../assets/fallback.png"
tags:
  [
    "go",
    "golang",
    "tools",
    "deploy",
    "vps",
    "linux",
  ]
---

this is a CLI tool for create VPS server for developer. currently it support Digital Ocean as Provider. it can custom region, size, --init-script for the VPS server.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/dreamoutbox/dev-in-vps/main/install.sh | sh
```

## Prerequisites & Configuration

##### DigitalOcean API Token

dev-vps resolves the DigitalOcean Personal Access Token using the following order of precedence:

`DEV_VPS_DO_TOKEN` environment variable

`DIGITALOCEAN_TOKEN` environment variable

`digitalocean_token` field in  `~/.dev-vps/config.json`


Example:

```sh
export DIGITALOCEAN_TOKEN="dop_v1_your_token_here"
```

## Command Reference

### 1. Create a Dev Server

Interactive mode (prompts for region, size slug, and server name):

```bash
dev-vps create
```

Non-interactive / scriptable command:

```bash
dev-vps create --name my-devbox --region nyc1 --size s-2vcpu-4gb
```

### 2. List Servers

```bash
dev-vps list
```

### 3. SSH into a Server

Connect to a specific server by name or ID:

```bash
dev-vps ssh my-devbox
# Auto-selects if only one active server exists, 
# or opens an interactive picker if multiple exist:
dev-vps ssh
```

### 5. Destroy a Server

```bash
dev-vps destroy my-devbox
```

## Source code

[https://github.com/dreamoutbox/dev-in-vps](https://github.com/dreamoutbox/dev-in-vps)
