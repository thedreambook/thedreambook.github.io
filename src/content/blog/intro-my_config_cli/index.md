---
title: '(ENG) Introducing myconfig CLI'
description: "CLI to backup/restore configs to the remote repo"
pubDate: "Nov 3 2026 11:30 AM"
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

this is a CLI tool I created to manage my config files across multiple devices,  it uses git to store the config files.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/dreamoutbox/my_config_cli/main/install.sh | sh
```

## Usage

### Import existing config

this will import `~/.bashrc` `~/.gitconfig` and related coding agent tools config files 

[see mapping.json](https://github.com/dreamoutbox/my_config_cli/blob/main/assets/mapping.json)

```sh
myconfig import
```

### Push to GitHub

```sh
# first time
myconfig push --repo git@github.com:username/my-config.git
# later just
myconfig push
# Aliases:
myconfig save
myconfig backup
```

### Pull from GitHub

```sh
myconfig pull --repo git@github.com:username/my-config.git
# Or using the saved repository URL:
myconfig pull
# Pull configurations from a specific commit hash, tag, or ref:
myconfig pull --from-commit a1b2c3d
# Aliases:
myconfig load
myconfig restore
```

### Link (Manual)

Apply all symlinks and JSON merges without pulling from git

```sh
myconfig link
```

###  Status

Check git status of the configuration store and inspect the health of all symlink targets:

```sh
myconfig status
```

### 5. Custom Mappings

View mapping paths and register custom file or directory mappings:

```sh
# Print mapping file paths:
myconfig mapping
# or
myconfig mapping path

# List all custom mappings:
myconfig mapping get
# (aliases: list, ls)

# Add custom mappings (automatically copied to config store and tracked in git):
myconfig mapping add ~/.vimrc
myconfig mapping add ~/.config/fish
myconfig mapping add ~/.tmux.conf --kind file

# Delete a custom mapping:
myconfig mapping delete ~/.vimrc
# (aliases: remove, rm)
```

## Source

[https://github.com/dreamoutbox/my_config_cli](https://github.com/dreamoutbox/my_config_cli)
