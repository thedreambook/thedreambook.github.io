---
title: "Rust SQLx: วิธี Join Table"
description: "วิธี Join Table ของ Rust SQLx"
pubDate: "Aug 25 2025"
heroImage: "../../assets/rust.gif"
tags: ["rust", "sqlx", "join", "database"]
---

มีโอกาสได้ทำ Project เกี่ยวกับ Rust แล้วเจอปัญหา Join table ที่ใช้เวลางมหานานมากๆ
เลยเอามาเขียนแชร์ไว้เผื่อคนอื่นเจอด้วย

<br/>

เมื่อค้นหาวิธี join table ใน google จะเจอ stackoverflow สิ่งนี้

<br/>

[https://stackoverflow.com/questions/76257309/properly-dealing-with-hierarchies-in-rust-sqlx](https://stackoverflow.com/questions/76257309/properly-dealing-with-hierarchies-in-rust-sqlx)

<br/>

## Solution

```rust
SELECT
    id,
    email,
    COALESCE(NULLIF(ARRAY_AGG((C.id, C.name)), '{NULL}'), '{}') AS "customers"
FROM users
JOIN customers C ON user_id = U.id
GROUP BY id, email
```

เปลี่ยน fields ใน struct ที่ join table เป็น `Vec<T>`

`COALESCE` = Return the first non-null value ใน List ถ้าฝั่งซ้าย `NULLIF(ARRAY_AGG(C.*)` เป็น NULL

`NULLIF` = Return NULL ถ้า `ARRAY_AGG(C.*)` แล้วเป็น `{null}`

<br/>

#### ⚠️ ใน stackoverflow บอกว่า cast ด้วย `AS "customers: Vec<CustomerData>" `ซึ่งลองทำแล้วข้อมูลไม่มา ซึ่งแก้โดย cast แค่ `AS "customers"`

<br/>

### Example Code

ลองทำบ้างดีกว่า Example ของเราจะใช้ Relationship กับ Post และ Comments

Setup project

cargo.toml

```toml
[package]
name = "rust-sqlx-join-table"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "1.47.1", features = ["full"] }
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres", "chrono"] }
chrono = { version = "0.4.41", features = ["serde"] }
dotenvy = "0.15.7"
serde = { version = "1.0.219", features = ["derive"] }

```

docker-compose.yaml

```yaml
volumes:
  dev-db-data:

services:
  db:
    image: postgres:17
    restart: always
    shm_size: 128mb
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - dev-db-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  adminer:
    image: adminer
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - db
```

สร้าง sqlx migration

```sh
sqlx migrate add post-and-comment
```

post-and-comment.up.sql

```sql
-- Create the posts table
CREATE TABLE posts
(
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create the comments table
CREATE TABLE comments
(
    id         SERIAL PRIMARY KEY,
    post_id    INT  NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

```

post-and-comment.down.sql

```
-- Drop the comments table first to avoid foreign key constraint issues
DROP TABLE IF EXISTS comments;

-- Drop the posts table
DROP TABLE IF EXISTS posts;

```

.env

```sh
DATABASE_URL=postgres://postgres:example@localhost:5432/postgres
```

Run migration

```sh
sqlx migrate run
```

The Rust Code!

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::FromRow;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(default)]
    pub comments: Vec<Comment>,
}

#[derive(Debug, FromRow, sqlx::Type, Serialize, Deserialize)]
pub struct Comment {
    pub id: i32,
    pub post_id: i32,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Rust SQLx Join Table Test");

    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL is not set in .env file");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // create post
    let post =
        sqlx::query_as::<_, Post>("INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *")
            .bind("First Post")
            .bind("This is the content of the first post.")
            .fetch_one(&pool)
            .await?;

    // create comments
    for i in 1..=3 {
        let comment_content = format!("This is comment number {} of post {}", i, post.id);
        let _comment = sqlx::query_as::<_, Comment>(
            "INSERT INTO comments (post_id, content) VALUES ($1, $2) RETURNING *",
        )
        .bind(post.id)
        .bind(comment_content)
        .fetch_one(&pool)
        .await?;
    }

    // join posts and comments
    let joined_post = sqlx::query_as::<_, Post>(
        r#"
        SELECT
            P.id, P.title, P.content, P.created_at, P.updated_at,
            COALESCE(NULLIF(ARRAY_AGG((C.*)), '{NULL}'), '{}') AS "comments"
        FROM posts P
        LEFT JOIN comments C ON P.id = C.post_id
        WHERE P.id = $1
        GROUP BY P.id
        "#,
    )
    .bind(post.id)
    .fetch_one(&pool)
    .await?;

    dbg!(&joined_post);

    Ok(())
}

```

ลอง `cargo run`

```txt
Rust SQLx Join Table Test
[src/main.rs:76:5] &joined_post = Post {
    id: 23,
    title: "First Post",
    content: "This is the content of the first post.",
    created_at: 2025-08-24T09:44:46.339051Z,
    updated_at: 2025-08-24T09:44:46.339051Z,
    comments: [
        Comment {
            id: 64,
            post_id: 23,
            content: "This is comment number 1 of post 23",
            created_at: 2025-08-24T09:44:46.359060Z,
            updated_at: 2025-08-24T09:44:46.359060Z,
        },
        Comment {
            id: 65,
            post_id: 23,
            content: "This is comment number 2 of post 23",
            created_at: 2025-08-24T09:44:46.359968Z,
            updated_at: 2025-08-24T09:44:46.359968Z,
        },
        Comment {
            id: 66,
            post_id: 23,
            content: "This is comment number 3 of post 23",
            created_at: 2025-08-24T09:44:46.360551Z,
            updated_at: 2025-08-24T09:44:46.360551Z,
        },
    ],
}
```

เท่านี้เราก็สามารถ join table ใน struct field ได้แล้ว เย่ๆ
