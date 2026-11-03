---
title: "Introducing PgVisor"
description: "A tools that simplify the PostgreSQL cluster setup and management."
pubDate: "Nov 3 2026 10:40 AM"
author: dreamoutbox
heroImage: "../../../assets/fallback.png"
tags:
  [
    "rust",
    "tools",
    "deploy",
    "postgresql",
    "database",
    "backup",
    "restore"
  ]
---

ผมสร้าง Tool ตัวนึงที่ช่วย simplify การ setup postgresql cluster และ management

ทุกวันนี้ถ้าอยากได้ simple minimal 3 nodes postgresql database cluster ต้องทำอะไรบ้างนะ?

- ต้อง setup postgresql ทั้ง 3 nodes

- พอเรามี 3 nodes แล้ว เราก็ต้องมา setup proxy ให้ route read-write กับ read-only query โดยใช้ pgbouncer pgpool-II หรือ haproxy

- คราวนี้ถ้าอยากทำ HA เวลา leader node down แล้วอยากทำ auto failover follower เป็น leader ก็ต้องใช้ pg_auto_failover หรือ repmgr. แล้ว repmgr จำเป็นต้องมี witness node เพิ่มมาอีก (เริ่มยุ่งยากแล้ว)

- แล้วอยากทำ backup/restore อีก ก็ต้องใช้ pgbackrest หรือ barman

- repmgr เวลา leader node down แล้วกลับมา back online อีกครั้ง repmgr จะ fence node นั้นไม่ให้เข้า cluster เพื่อไม่ให้เกิด split-brain ทำให้เหลือ 2 node ซึ่งไม่สะดวกมากๆ dev จะต้อง recover node นั้นเป็น follower อีกครั้งด้วยมือ

ทุกอย่างที่กล่าวมาข้างบนนี้สุดท้ายมันจะติดปัญหาบางอย่าง

แล้วสุดท้ายต้องใช้ patroni แล้ว setup etcd เพิ่มให้ยุ่งยากขึ้นไปอีก

ซึ่ง patroni เอียงไปทางใช้ใน kubernetes  ถ้า setup manually ด้วย 3 VPS จะยุ่งยากมากๆ

เราแค่อยากได้ simple postgresql cluster ทำไมมันยากขนาดนี้นะ ? 
 (or maybe my skill issues?)

## Introducing PgVisor

<br/>

โดยผมเขียน Rust ครอบ on-top postgresql โดยเพิ่ม Raft ด้วย [openraft](https://crates.io/crates/openraft)

Raft ทำให้ทุก nodes ใน cluster โหวตได้เวลา leader node down โดยไม่ต้องมี witness node เพิ่มคล้ายๆ repmgr

แล้วผมสร้าง custom proxy ด้วย Rust ให้ split read-write ไปที่ leader node   และ read-only ไปที่ follower nodes

แล้วมี web dashboard ให้ manage cluster ผ่าน browser โดยสามารถดู status ของ cluster และทุก nodes ได้ พร้อมจัดการ backup/restore (PITR supported)

backup ด้วยคำสั่ง pgbasebackup แล้วอัพ backup ไฟล์ขึ้น S3 Bucket

แล้ว restore ด้วย pg_combinebackup เพื่อรวมไฟล์เวลา backup มีหลายไฟล์

## ลองใช้กันดีกว่า

เราจะ clone repository pgvisor
แล้วจะรัน example cluster ด้วย docker

```sh
git clone https://github.com/dreamoutbox/pgvisor.git

cd examples/
```

แล้ว setup example cluster ด้วย

```sh
./pgvisorctl.sh up
```


หลังจาก setup เสร็จสามารถเข้า web dashboard ด้วย (รหัส default คือ postgres)

[http://localhost:8080](http://localhost:8080)

หรือ connect to database with psql

```sh
psql -h localhost -p 5432 -U postgres -d postgres
```

หรือใช้ใน application ด้วย URI

```log
postgresql://postgres:postgres@localhost:5432/postgres
```

<br/>

พอเปิด web dashboard มาจะได้หน้านี้

![web dashboard index](image.png)

หน้า cluster nodes สามารถ start/stop/restart/promote node ได้

![cluster nodes page](image-1.png)

## ทดสอบ Backup & Restore

ลอง mock data สำหรับทดสอบ backup & restore

```sh
./dev-mock-data.sh
```

หน้า Database Explorer จะได้ mock data แบบนี้

![database explorer page](image-2.png)

แล้วหน้า Backups จะมี full backup x1 และ incremental backup x1

![backups page](image-3.png)

ลอง restore database ด้วย PITR โดยใส่เวลาก่อน record foxtrot จะถูก INSERT ลง database

<br/>

##### ⚠️ Gotcha !
 เลือก full backup แล้วใส่เวลา PITR time. แล้ว pgvisor จะดึง backup incremental ที่มีเวลานั้นอยู่อัตโนมัติ. 
 ทริคคือ `PITR time must be after the full backup create time`
<br/>

![backup page restore modal](image-4.png)


สังเกตุว่า foxtrot record ได้หายไปแล้วเพราะเราใช้ PITR time ก่อน INSERT foxtrot

![database explorer after restore](image-5.png)

## ทดสอบ HA (auto failover)


ลอง stop leader node เพื่อจำลอง node offline

```sh
docker stop pgvisor-node1
```

สังเกตุว่า node1 ในหน้า cluster nodes node 1 ได้ offline แล้ว node 2 เป็น leader แทน

![cluster page after node 1 stop](image-6.png)

ลอง start node 1 กลับมา

```sh
docker start pgvisor-node1
```

![cluster page after node 1 restart](image-7.png)

สังเกตุว่า node 1 online แล้วเป็น follower แทน


## ทดสอบ Manual Promote Leader

เราสามารถกด promote ในหน้า cluster nodes ได้เลย

![promote leader press](image-8.png)

![cluster page after node 1 promote](image-9.png)

ตอนนี้ node 1 ได้เป็น leader เหมือนเดิมแล้ว

## ทดสอบสร้าง User

เราสามารถสร้าง User ได้ในหน้า `Users & Roles`

![user page create user](image-10.png)

อัพเดท  Table Privileges ให้กับ user

![user page update Table Privileges](image-11.png)

ลองเชื่อมต่อ database ด้วย user ที่สร้าง

```sh
psql -h localhost -p 5432 -U app1 -d postgres
```

<br/>

```sql
postgres=> SELECT * FROM pgvisor_demo;
 id | name  |  status  | counter |          created_at           |          updated_at
----+-------+----------+---------+-------------------------------+-------------------------------
  1 | alpha | active   |      10 | 2026-11-03 04:00:47.907981+00 | 2026-11-03 04:00:47.907981+00
  2 | beta  | active   |      20 | 2026-11-03 04:00:47.907981+00 | 2026-11-03 04:00:47.907981+00
  3 | gamma | pending  |      30 | 2026-11-03 04:00:47.907981+00 | 2026-11-03 04:00:47.907981+00
  4 | delta | archived |      40 | 2026-11-03 04:00:47.907981+00 | 2026-11-03 04:00:47.907981+00
  5 | echo  | active   |      50 | 2026-11-03 04:00:56.492623+00 | 2026-11-03 04:00:56.492623+00
(5 rows)
```

## Inspecting Audit logs

เราสามารถดูว่ามีอะไรเกิดขึ้นใน database บ้าง

![audit logs page](image-12.png)

โดยสามารถดู Dangerous SQL เช่น DELETE โดยไม่มี WHERE ได้ 

![audit logs Dangerous SQL](image-13.png)


# Conclusion

tool นี้ simplify การ setup และการ management postgresql cluster
โดยเน้นเรื่อง HA auto failover กับ backup & restore (PITR) เป็นหลัก

ถ้าเกิดเจอบัคหรือมี feature สามารถเปิด Issues หรือ Pull Request ได้ 

ทุกการช่วยเหลือ are welcome!

[https://github.com/dreamoutbox/pgvisor](https://github.com/dreamoutbox/pgvisor)

