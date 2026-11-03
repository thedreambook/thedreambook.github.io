---
title: '(ENG) Introducing Crane'
description: "Deploy to VPS with a single command"
pubDate: "Nov 3 2026 10:20 AM"
author: dreamoutbox
heroImage: "../../../assets/fallback.png"
tags:
  [
    "rust",
    "tools",
    "deploy",
    "vps",
    "linux",
  ]
---

I built a CLI tool in Rust that allows you to deploy applications to a VPS with a single command.

<br>

Deploying to a VPS remains a daunting task for many developers.

This is especially true for newcomers who may not yet be comfortable with the Linux command line or server administration.

Although there are numerous tools that assist with deployments—such as Docker, Kubernetes, Ansible, or Terraform—they still require a steep learning curve and considerable configuration before you can use them effectively in production.

<br>

Crane CLI transforms these tedious, multi-step processes into a straightforward workflow, handling:

- Uploading application files to your VPS
- Provisioning and configuring databases
- Setting up a reverse proxy (with automated SSL/TLS certificate issuance)
- Automating database backups
- Configuring firewall rules
- Managing DNS records for your domain

All of this can be achieved simply by defining your requirements in `crane.toml` and running `crane deploy`.

## Let's Get Started

### 1. Install Crane CLI with a Single Command

```sh
curl -fsSL https://raw.githubusercontent.com/dreamoutbox/crane/master/install.sh | sh
```

### 2. Create crane.toml in Your Project Directory

```toml
# crane.toml

[[nodes]]
name = "vps1"
ssh_user = "root"
ssh_ip = "127.0.0.1"
ssh_port = 2221
public_ip = "10.0.0.11"
internal_ip = "10.0.0.11"
roles = ["app", "haproxy", "postgres", "redis"]
private_key = "path/to/id_ed25519"
sudo_pass = "${SUDO_PASS_VPS1}"
firewall_expose_port_range = ["2221", "80", "443", "3000-3100", "4000-4100"]

[[nodes]]
name = "vps2"
ssh_user = "root"
ssh_ip = "127.0.0.1"
ssh_port = 2222
public_ip = "10.0.0.12"
internal_ip = "10.0.0.12"
roles = ["app", "haproxy", "postgres", "redis"]
private_key = "path/to/id_ed25519"
sudo_pass = "${SUDO_PASS_VPS2}"
firewall_expose_port_range = ["2222", "80", "443", "3000-3100", "4000-4100"]

[[nodes]]
name = "vps3"
ssh_user = "root"
ssh_ip = "127.0.0.1"
ssh_port = 2223
public_ip = "10.0.0.13"
internal_ip = "10.0.0.13"
roles = ["app", "haproxy", "postgres", "redis"]
private_key = "path/to/id_ed25519"
sudo_pass = "${SUDO_PASS_VPS3}"
firewall_expose_port_range = ["2223", "80", "443", "3000-3100", "4000-4100"]

[[users]]
name = "deployman"
groups = ["www"]
ssh_authorized_keys = ["path/to/id_ed25519.pub"]
private_key = "path/to/id_ed25519"


[app.myapp]
name = "myapp"
# Setup Info
dependencies = ["libssl3", "ca-certificates"]
# Deploy Info
deploy_dir = "./examples"
entrypoint = "./myapp"
pre_deploy_script = "./startup.sh"
deploy_user = "deployman"
port_start = 3000
port_end = 3100
# Health Check
health_check_path = "/health"
health_check_timeout = 10
health_check_interval = 5
# Domain
domain = "myapp.localhost"
# Replicas
instances = 1
# ENV for myapp
[app.myapp.env]
APP_ENV = "production"
LOG_LEVEL = "debug"
APP_NAME = "myapp"
# Databases for myapp
[[app.myapp.database]]
databases = "mydb"
user = "u1"


[db.postgres]
enabled = true
minimal = false
version = "18"
replica_pass = "replica"

[db.postgres.backup]
full_backup_every = "1h"
incremental_backup_every = "30m"

[db.postgres.mydb]
name = "mydb"

[[db.postgres.users]]
state = "present"
user = "u1"
password = "u1"
databases = ["mydb"]

[[db.postgres.users]]
state = "present"
user = "u2"
password = "u2"
databases = ["mydb"]


[backup.s3]
enabled = true
bucket = "crane1"
region = "us-east-1"
endpoint = "http://s3:9000"
access_key_id = "${S3_ACCESS_KEY_ID}"
secret_access_key = "${S3_SECRET_ACCESS_KEY}"


[domain]
enabled = true
provider = "cloudflare"
domain_name = "localhost"
token = "${CLOUDFLARE_TOKEN}"
```

<br/>

#### Configuration Explained

While most of the configuration options are self-explanatory, here are key points to note:

- Placeholders with `${...}` allow Crane to inject values dynamically from environment variables in your `.env` file.
- `roles`: Specifies the workloads assigned to each VPS node (e.g., `app`, `haproxy`, `postgres`, `redis`). If a node has limited CPU and RAM, you can configure it to only run the `app` role.
- `[[users]]`: Provisions designated system users on the target servers.
- `deploy_dir`: Local directory containing application files to upload.
- `entrypoint`: The application binary or executable to run.
- `pre_deploy_script`: A shell script executed on the VPS prior to launching deployment steps.
- `deploy_user`: The system user on the VPS running the application process.
- `port_start` / `port_end`: Port range allocated for application instances.
- `instances`: The number of application replica instances to launch.
- `minimal` under `[db.postgres]`: When set to `true`, provisions a single standalone PostgreSQL instance (suited for resource-constrained or single-node VPS environments). When `false`, provisions a High Availability cluster (using Patroni + etcd across all VPS nodes).
- `enabled` under `[domain]`: When set to `false`, skips updating DNS records and ignores any `domain` configurations in `[app.*]`.

### 3. Deploy

Once your configuration is ready, simply run:

```sh
crane deploy
```

Example output logs:

```log
Loading configuration from "./examples/crane.toml"

Installing dependencies on root@vps1 (port: 2221) ["unzip", "libssl3", "ca-certificates"]
Installing dependencies on root@vps3 (port: 2223) ["unzip", "libssl3", "ca-certificates"]
Installing dependencies on root@vps2 (port: 2222) ["unzip", "libssl3", "ca-certificates"]
        Generating self-signed certificate for SSL/TLS termination...
        Generating self-signed certificate for SSL/TLS termination...
        Update HAProxy config (at: /etc/haproxy/haproxy.cfg)
        Update HAProxy config (at: /etc/haproxy/haproxy.cfg)
        Generating self-signed certificate for SSL/TLS termination...
        Update HAProxy config (at: /etc/haproxy/haproxy.cfg)

Configuring firewalls on all nodes...
        Setting up firewall on vps1...
        Setting up firewall on vps2...
        Setting up firewall on vps3...

========================================================
  MIGRATION DETECTED: Minimal Standalone -> HA Cluster
========================================================

Step 1/6: Verifying source PostgreSQL health on vps1...
Step 2/6: Exporting full data dump to /tmp/crane_migration_minimal_to_cluster.sql...
Step 3/6: Stopping standalone PostgreSQL service...
Step 4/6: Archiving standalone data directory...
Step 5/6: Deploying Patroni + etcd cluster across all nodes...
        S3 backup is disabled in [backup.s3]. Skipping automated backup cron setup.
Configuring node vps1...
Configuring node vps2...
Configuring node vps3...
        Ensuring GnuPG and Curl are installed...
        Ensuring GnuPG and Curl are installed...
        Ensuring GnuPG and Curl are installed...
        Adding official PostgreSQL repository for version 18
        Adding official PostgreSQL repository for version 18
        Updating package lists...
        Updating package lists...
        Adding official PostgreSQL repository for version 18
        Updating package lists...
        Installing postgresql-18, postgresql-client-18, python3-boto3
        Installing postgresql-18, postgresql-client-18, python3-boto3
        Installing postgresql-18, postgresql-client-18, python3-boto3
        Enabling PostgreSQL service for boot...
        Starting PostgreSQL cluster...
        Creating PostgreSQL 18 main cluster...
        Setup etcd cluster on node vps1...
        etcd is already installed.
        Stopping and disabling standard PostgreSQL service on node vps1...
        Backing up old postgres data directory /var/lib/postgresql/18/main to /backup/1793599616/var/lib/postgresql/18/main
        Patroni is already installed.
        Create patroni config at /etc/patroni/config.yml
        Enabling PostgreSQL service for boot...
        Enabling PostgreSQL service for boot...
        Starting PostgreSQL cluster...
        Creating PostgreSQL 18 main cluster...
        Starting PostgreSQL cluster...
        Creating PostgreSQL 18 main cluster...
        Setup etcd cluster on node vps3...
        etcd is already installed.
        Stopping and disabling standard PostgreSQL service on node vps3...
        Setup etcd cluster on node vps2...
        etcd is already installed.
        Stopping and disabling standard PostgreSQL service on node vps2...
        Backing up old postgres data directory /var/lib/postgresql/18/main to /backup/1793599619/var/lib/postgresql/18/main
        Backing up old postgres data directory /var/lib/postgresql/18/main to /backup/1793599619/var/lib/postgresql/18/main
        Patroni is already installed.
        Patroni is already installed.
        Create patroni config at /etc/patroni/config.yml
        Create patroni config at /etc/patroni/config.yml
        Starting etcd service on node vps3 ...
        Starting etcd service on node vps2 ...
        Starting etcd service on node vps1 ...
        Waiting for etcd ready on all nodes...
        Etcd cluster ready.
        Starting Patroni on node vps1...
        Patroni started successfully on node vps1
        Waiting for leader Patroni REST API to become healthy...
        Setting up automated cron backups on node vps1...
        Starting Patroni on node vps2...
        Starting Patroni on node vps3...
        Patroni started successfully on node vps2
        Setting up automated cron backups on node vps2...
        Patroni started successfully on node vps3
        Setting up automated cron backups on node vps3...
        Waiting for Patroni leader election...
        Discovered Patroni leader at node: vps1
        Replicas: ["vps2", "vps3"]

        Provisioning PostgreSQL databases and users on Patroni leader...

        Setting up database 'mydb'...
        user u1 state is present
        Setting up user 'u1'...
        Granting access for user 'u1' to database 'mydb'...

        Polling PostgreSQL cluster health...
        PostgreSQL cluster health check completed (took 2s)
Step 6/6: Importing database dump into Patroni leader...

Migration Minimal -> Cluster completed successfully!

        User deployman created successfully
        User deployman created successfully
        [myapp] Register Service:
                Path=/etc/systemd/system/myapp@.service
                User=deployman
                WorkingDirectory=/app/myapp
                ExecStart=/app/myapp/myapp
                EnvFile=/app_config/myapp/%i/.env
        User deployman created successfully
        [myapp] Register Service:
                Path=/etc/systemd/system/myapp@.service
                User=deployman
                WorkingDirectory=/app/myapp
                ExecStart=/app/myapp/myapp
                EnvFile=/app_config/myapp/%i/.env
        User deployman created successfully
        [myapp] Register Service:
                Path=/etc/systemd/system/myapp@.service
                User=deployman
                WorkingDirectory=/app/myapp
                ExecStart=/app/myapp/myapp
                EnvFile=/app_config/myapp/%i/.env

Starting deployment for app 'myapp' (ID: myapp)...

[myapp] Deploying to node vps1: root@127.0.0.1 (port: 2221)
        [myapp] Running pre-deploy script 'startup.sh'...
        [myapp] Deploying instance on port 3000 ...
        [myapp] polling health check on port 3000...
        [myapp] instance on port 3000 is healthy!
        Updating /etc/hosts on node vps1...

[myapp] Deploying to node vps2: root@127.0.0.1 (port: 2222)
        [myapp] Running pre-deploy script 'startup.sh'...
        [myapp] Deploying instance on port 3000 ...
        [myapp] polling health check on port 3000...
        [myapp] instance on port 3000 is healthy!
        Updating /etc/hosts on node vps2...

[myapp] Deploying to node vps3: root@127.0.0.1 (port: 2223)
        [myapp] Running pre-deploy script 'startup.sh'...
        [myapp] Deploying instance on port 3000 ...
        [myapp] polling health check on port 3000...
        [myapp] instance on port 3000 is healthy!


DEPLOY COMPLETE (60 secs)

Domain management is disabled. Skipping DNS update.
```

*Note: The initial deployment takes around ~50–60 seconds as it downloads packages and initializes the cluster; subsequent runs are significantly faster.*

## Inspecting System Status

Check system and service health with:

```sh
crane status
```

### Example Output

```log
NODE:

vps1
  Public IP: 10.0.0.11
  Internal IP: 10.0.0.11
  SSH Port: 2221
  CPU Usage:  3.9%
  Memory:     6483 MB / 11958 MB (54.2%)
  Disk (/):   11G / 1007G (2%)
  Network:
    - eth0: Rx: 159.66 MB (7.2 KB/s), Tx: 140.10 MB (20.7 KB/s)

vps2
  Public IP: 10.0.0.12
  Internal IP: 10.0.0.12
  SSH Port: 2222
  CPU Usage:  5.1%
  Memory:     6482 MB / 11958 MB (54.2%)
  Disk (/):   11G / 1007G (2%)
  Network:
    - eth0: Rx: 182.06 MB (6.2 KB/s), Tx: 6.09 MB (19.6 KB/s)

vps3
  Public IP: 10.0.0.13
  Internal IP: 10.0.0.13
  SSH Port: 2223
  CPU Usage:  1.7%
  Memory:     6483 MB / 11958 MB (54.2%)
  Disk (/):   11G / 1007G (2%)
  Network:
    - eth0: Rx: 186.80 MB (3.2 KB/s), Tx: 6.28 MB (16.6 KB/s)

APP:

myapp:
  External URL:    http://10.0.0.11
  Port Range:      3000-3100
  Overall Status:  HEALTHY

  myapp@1 (vps1) (Port 3000) Active 200 OK
  myapp@2 (vps2) (Port 3000) Active 200 OK
  myapp@3 (vps3) (Port 3000) Active 200 OK

```

In a single dashboard view, you can inspect node hardware utilization (CPU, RAM, Disk, Network) along with application health check statuses across every VPS.

## Inspecting Application Logs

View logs from individual applications with:

```sh
crane logs <app>
```

### Example Output

```log
[myapp@1] Started myapp@3000.service - crane managed: myapp instance on port 3000.
[myapp@1]     _______ __
[myapp@1]    / ____(_) /_  ___  _____
[myapp@1]   / /_  / / __ \/ _ \/ ___/
[myapp@1]  / __/ / / /_/ /  __/ /
[myapp@1] /_/   /_/_.___/\___/_/          v3.3.0
[myapp@1] --------------------------------------------------
[myapp@1] INFO Server started on:       http://127.0.0.1:3000 (bound on host 0.0.0.0 and port 3000)
[myapp@1] INFO Total handlers:          14
[myapp@1] INFO Prefork:                         Disabled
[myapp@1] INFO PID:                     4448
[myapp@1] INFO Total process count:     1
[myapp@2] Started myapp@3000.service - crane managed: myapp instance on port 3000.
[myapp@2]     _______ __
[myapp@2]    / ____(_) /_  ___  _____
[myapp@2]   / /_  / / __ \/ _ \/ ___/
[myapp@2]  / __/ / / /_/ /  __/ /
[myapp@2] /_/   /_/_.___/\___/_/          v3.3.0
[myapp@2] --------------------------------------------------
[myapp@2] INFO Server started on:       http://127.0.0.1:3000 (bound on host 0.0.0.0 and port 3000)
[myapp@2] INFO Total handlers:          14
[myapp@2] INFO Prefork:                         Disabled
[myapp@2] INFO PID:                     3730
[myapp@2] INFO Total process count:     1
[myapp@3] Started myapp@3000.service - crane managed: myapp instance on port 3000.
[myapp@3]     _______ __
[myapp@3]    / ____(_) /_  ___  _____
[myapp@3]   / /_  / / __ \/ _ \/ ___/
[myapp@3]  / __/ / / /_/ /  __/ /
[myapp@3] /_/   /_/_.___/\___/_/          v3.3.0
[myapp@3] --------------------------------------------------
[myapp@3] INFO Server started on:       http://127.0.0.1:3000 (bound on host 0.0.0.0 and port 3000)
[myapp@3] INFO Total handlers:          14
[myapp@3] INFO Prefork:                         Disabled
[myapp@3] INFO PID:                     3672
[myapp@3] INFO Total process count:     1
```

## Managing PostgreSQL

### Checking PostgreSQL Cluster Status

```sh
crane pg status
```

<br/>

#### Example Output

<br/>

```log
Mode: Cluster (Patroni + etcd HA)

HAProxy
Primary: vps1:5000
Replicas: vps2:5000,vps3:5000
Status: Healthy

vps1
Address: 127.0.0.1:2221
Role: Leader
DB version: 18
Status: Healthy

vps2
Address: 127.0.0.1:2222
Role: Follower
DB version: 18
Status: Healthy

vps3
Address: 127.0.0.1:2223
Role: Follower
DB version: 18
Status: Healthy
```

### Backing Up the Database

```sh
crane pg backup full
```

<br/>

```log
Starting PostgreSQL backup FULL ...

Running pg_basebackup command: sudo -u postgres PGPASSWORD='replica' /usr/lib/postgresql/18/bin/pg_basebackup -h localhost -U replicator -D /var/lib/postgresql/backups/20261102061827455 -F t -X s -c fast --manifest-checksums=sha256

Running pg_verifybackup command: sudo -u postgres /usr/lib/postgresql/18/bin/pg_verifybackup /var/lib/postgresql/backups/20261102061827455_verify
Switched to new WAL. Switched segment filename: 000000010000000000000007
archive_mode = on
archive_command = cp %p /var/lib/postgresql/wal_archive/%f
WAL segment 000000010000000000000007 archived (immediate copy).

BACKUP ID: 20261102061827455 DATETIME: 2026-11-02 06:18:27.455 completed


Backup successful!

ID: 20261102061827455
Date: 2026-11-02
Time: 06:18:27.455
Type: FULL
LOCAL: /var/lib/postgresql/backups/20261102061827455
S3: crane1/backups/20261102061827455
```

### Listing Backups

```sh
crane pg list
```

<br/>

```log
ID: 20261101232904673
Date: 2026-11-01
Time: 23:29:04.673
Type: FULL
Label: full2
LOCAL: /var/lib/postgresql/backups/20261101232904673
S3: crane1/backups/20261101232904673

ID: 20261101232908146
Date: 2026-11-01
Time: 23:29:08.146
Type: INCR
Label: incr2
LOCAL: /var/lib/postgresql/backups/20261101232908146
S3: crane1/backups/20261101232908146

ID: 20261102061827455
Date: 2026-11-02
Time: 06:18:27.455
Type: FULL
Label: Unnamed
LOCAL: /var/lib/postgresql/backups/20261102061827455
S3: crane1/backups/20261102061827455
```

### Restoring the Database

```sh
crane pg restore 20261102061827455
```

<br/>

```log
Start restore: target_backup_id=20261102061827455 base_id=NONE pitr_time=NONE

Backup chain to restore:
 - ID: 20261102061827455 (FULL)
Restoring database to backup ID: 20261102061827455

Stopping Patroni/PostgreSQL on node vps2 for restore
Stopping Patroni/PostgreSQL on node vps1 for restore
Stopping Patroni/PostgreSQL on node vps3 for restore

Clearing Etcd DCS cluster state...
        Cleared postgres data on node vps2
        Cleared postgres data on node vps1
        Cleared postgres data on node vps3
Starting Patroni on primary node vps1...
Waiting a node to become Patroni leader...
Starting Patroni on replica node vps2...
Starting Patroni on replica node vps3...
Waiting for all nodes to join the cluster...
Restore complete!
```

<br/>

### Simple as That!!

<img src="https://media1.tenor.com/m/ampW8g8v-vMAAAAd/hack-khaby.gif" alt="Simple as that" width="200px" height="200px">


### Pull Requests are Welcome!

If you have ideas, feature suggestions, or optimizations to contribute, feel free to open an Issue or submit a Pull Request to the repository.

[GitHub Repository: dreamoutbox/crane](https://github.com/dreamoutbox/crane)
