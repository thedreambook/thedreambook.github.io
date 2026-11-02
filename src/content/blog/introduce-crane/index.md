---
title: 'Introducing Crane - Single command to deploy to VPS'
description: "crane CLI introduction"
pubDate: "Nov 3 2026 10:20 AM"
# heroImage: "../../../assets/rust-fallback.webp"
tags:
  [
    "rust",
    "tools",
    "deploy",
    "vps",
    "linux",
  ]
---

ผมได้พัฒนา CLI ตัวหนึ่งขึ้นมาด้วยภาษา Rust ที่ช่วยให้เราสามารถ deploy แอปพลิเคชันไปยัง VPS ได้ด้วยคำสั่งเดียว

<br>

ทุกวันนี้การ deploy ไปยัง VPS ยังคงเป็นเรื่องที่ยุ่งยากสำหรับนักพัฒนาหลายๆ คน

โดยเฉพาะมือใหม่ที่อาจยังไม่คุ้นเคยกับ Linux command line หรือการดูแลจัดการเซิร์ฟเวอร์

ถึงแม้ว่าจะมีเครื่องมือมากมายที่ช่วยให้การ deploy สะดวกขึ้น เช่น 
Docker, Kubernetes, Ansible หรือ Terraform แต่เครื่องมือเหล่านี้ก็ยังคงต้องใช้เวลาในการเรียนรู้และทำความเข้าใจก่อนที่จะนำไปใช้งานจริงได้

<br>

Crane CLI เข้ามาช่วยเปลี่ยนขั้นตอนที่ซับซ้อนหลายๆ อย่างให้กลายเป็นเรื่องง่าย ตั้งแต่:

- อัปโหลดไฟล์โปรแกรมไปยัง VPS
- ติดตั้งและตั้งค่า Database
- ทำ Reverse Proxy (พร้อมจัดการ SSL ให้อัตโนมัติ)
- ทำ Automated Backup
- ตั้งค่า Firewall
- ตั้งค่า DNS สำหรับ Domain

ทั้งหมดนี้สามารถทำได้ง่ายๆ เพียงแค่แก้ไขไฟล์ `crane.toml`
จากนั้นก็สั่งรันคำสั่ง `crane deploy` ได้ทันที

## มาลองใช้งานกันเลย

### 1. ติดตั้ง Crane CLI ด้วยคำสั่งเดียว

```sh
curl -fsSL https://raw.githubusercontent.com/dreamoutbox/crane/master/install.sh | sh
```

### 2. สร้างไฟล์ crane.toml ในโฟลเดอร์โปรเจกต์ 

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

#### อธิบายการตั้งค่า (Configuration Explained)

แม้คอนฟิกส่วนใหญ่จะสื่อความหมายชัดเจนในตัวเอง (self-explanatory) แต่ขออธิบายจุดสำคัญเพิ่มเติมดังนี้:

- สามารถใส่ placeholder ด้วย `${...}` เพื่อให้ Crane ดึงค่ามาจาก environment variables ในไฟล์ `.env` ได้
- `roles` กำหนดว่าแต่ละ VPS node จะทำหน้าที่อะไรบ้าง (เช่น `app`, `haproxy`, `postgres`, `redis`) หากโหนดไหนมี CPU และ RAM จำกัด ก็สามารถเลือก deploy เฉพาะ `app` บนโหนดนั้นได้
- `[[users]]` ใช้สำหรับสร้าง user บนเซิร์ฟเวอร์ตามที่ระบุ
- `deploy_dir` ไดเรกทอรีต้นทางในเครื่อง local ที่ต้องการ deploy
- `entrypoint` ไฟล์ binary หรือ executable ที่ต้องการสั่งรัน
- `pre_deploy_script` สคริปต์ที่ต้องการให้รันบน VPS ก่อนเริ่มขั้นตอน deploy
- `deploy_user` user บน VPS ที่ใช้สำหรับรันแอปพลิเคชัน
- `port_start` / `port_end` ช่วงของพอร์ต (port range) ที่อนุญาตให้แอปใช้งาน
- `instances` จำนวน instance ของแอปพลิเคชันที่ต้องการรัน
- `minimal` ในหมวด `[db.postgres]`: หากเป็น `true` จะรัน PostgreSQL แค่ 1 instance แบบ standalone (เหมาะสำหรับเครื่องที่มี resource จำกัด หรือมี VPS เพียงโหนดเดียว) หากเป็น `false` จะรันในรูปแบบ High Availability Cluster (ใช้ Patroni + etcd ข้ามทุก VPS node)
- `enabled` ในหมวด `[domain]`: หากเป็น `false` จะไม่อัปเดต DNS record และจะไม่สนใจค่า `domain` ที่ระบุไว้ใน `[app.*]`

### 3. สั่ง Deploy

เมื่อตั้งค่าคอนฟิกเรียบร้อยแล้ว เพียงแค่รันคำสั่ง:

```sh
crane deploy
```

ตัวอย่าง Log output ที่ได้:

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

*หมายเหตุ: ในครั้งแรกอาจใช้เวลาราว ~50-60 วินาที เนื่องจากต้องดาวน์โหลด แพ็กเกจ และตั้งค่าระบบคลัสเตอร์ ซึ่งในอนาคตยังสามารถ optimize ความเร็วเพิ่มได้อีกมาก*

## ตรวจสอบสถานะของระบบ (Inspecting Status)

สามารถตรวจสอบสถานะได้ด้วยคำสั่ง:

```sh
crane status
```

### ตัวอย่าง Output

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

เพียงเท่านี้เราก็สามารถตรวจสอบสถานะ สเปกเครื่อง (CPU, RAM, Disk, Network) และ Health Check ของทุก VPS node ได้ในที่เดียว

## ตรวจสอบ Application Logs (Inspecting App Logs)

ดู log ของแต่ละแอปพลิเคชันได้ด้วยคำสั่ง:

```sh
crane logs <app>
```

### ตัวอย่าง Output

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

## การจัดการ PostgreSQL

### ตรวจสอบสถานะ PostgreSQL Cluster

```sh
crane pg status
```

<br/>

#### ตัวอย่าง Output

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

### สำรองข้อมูลฐานข้อมูล (Backup Database)

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

### ดูรายการ Backup ทั้งหมด (List Backups)

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

### กู้คืนฐานข้อมูล (Restore Database)

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

หากใครมีไอเดีย ฟีเจอร์ใหม่ๆ หรือต้องการช่วยกัน optimize เพิ่มเติม สามารถเปิด Issue หรือส่ง Pull Request เข้ามาที่ repository ได้เลยครับ

[GitHub Repository: dreamoutbox/crane](https://github.com/dreamoutbox/crane)
