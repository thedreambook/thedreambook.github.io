---
title: "Rust เขียน Axum พร้อม OpenAPI docs ด้วย Utoipa (EP2)"
description: "เขียน Axum API server พร้อม OpenAPI docs Swagger ด้วย Utoipa"
pubDate: "Nov 10 2025 7:00 AM"
heroImage: "../../assets/blog/flask-socketio-test/thumbnail.png"
tags: ["rust", "axum", "openapi", "utoipa", "swagger", "redoc", "scalar"]
---

#### ต่อจาก

## Advance!

เราลองมาสร้าง Entity & DTO สำหรับ hold data ของเรา

```rust title="src/entity/mod.rs"
use serde::{Deserialize, Serialize};

use serde::{Deserialize, Serialize};

/// User entity
#[derive(Serialize, Deserialize, utoipa::ToSchema)]
pub struct User {
    pub id: u64,
    pub username: String,
}

/// Payload for creating a user
#[derive(Serialize, Deserialize, utoipa::ToSchema)]
pub struct CreateUserDTO {
    #[schema(example = "new.username")]
    pub username: String,
}

/// Payload for updating an existing user
#[derive(Serialize, Deserialize, utoipa::ToSchema)]
pub struct UpdateUserDTO {
    #[schema(example = "update.username")]
    pub username: String,
}

```

สังเกตุว่าเราต้อง derive `utoipa::ToSchema`
และเราสามารถ set example value บน struct field ด้วย `#[schema(example = "YOUR_EXAMPLE_HERE")]`

### สร้าง mock repository สำหรับ CRUD User

เขียน user repository แบบง่ายๆ
โดยใช้ RwLock กับ AtomicU64 เพื่อให้ thread safe

```rust
use crate::entity::User;
use std::collections::HashMap;
use std::sync::RwLock;
use std::sync::atomic::{AtomicU64, Ordering};

pub struct UserDbMock {
    // RwLock allows for many readers OR one writer
    users: RwLock<HashMap<u64, String>>,
    // Atomics provide lock-free, thread-safe counters
    next_id: AtomicU64,
}

impl UserDbMock {
    pub fn new() -> Self {
        Self {
            users: RwLock::new(HashMap::new()),
            next_id: AtomicU64::new(1),
        }
    }

    // This method now only needs &self, not &mut self
    pub fn create_user(&self, username: String) -> User {
        // 1. Get a new, unique ID atomically.
        // fetch_add increments the value and returns the *previous* value.
        // SeqCst is the strictest memory ordering, which is safest.
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);

        let user = User {
            id,
            username: username.clone(),
        };

        // 2. Get a *write* lock on the users map.
        // This blocks until no other readers or writers are active.
        let mut users_guard = self.users.write().unwrap();

        // 3. Mutate the data
        users_guard.insert(id, username);

        user
        // 4. The write lock is automatically released here
    }

    // This method only needs &self
    pub fn get_user(&self, user_id: u64) -> Option<User> {
        // 1. Get a *read* lock on the users map.
        // This blocks only if a *writer* is active.
        // Multiple readers can be active at the same time.
        let users_guard = self.users.read().unwrap();

        // 2. Access the data
        users_guard.get(&user_id).map(|username| User {
            id: user_id,
            username: username.clone(),
        })
        // 3. The read lock is automatically released here
    }

    // This method now only needs &self
    pub fn update_user(&self, user_id: u64, new_username: String) -> Option<User> {
        // 1. Get a *write* lock
        let mut users_guard = self.users.write().unwrap();

        // 2. Find and mutate the data
        if let Some(username) = users_guard.get_mut(&user_id) {
            *username = new_username.clone();
            Some(User {
                id: user_id,
                username: new_username,
            })
        } else {
            None
        }
        // 3. The write lock is released here
    }

    // This method now only needs &self
    pub fn delete_user(&self, user_id: u64) -> bool {
        // 1. Get a *write* lock
        let mut users_guard = self.users.write().unwrap();

        // 2. Mutate
        users_guard.remove(&user_id).is_some()
        // 3. The write lock is released here
    }

    // This method only needs &self
    pub fn list_users(&self) -> Vec<User> {
        // 1. Get a *read* lock
        let users_guard = self.users.read().unwrap();

        // 2. Read and clone the data
        users_guard
            .iter()
            .map(|(&id, username)| User {
                id,
                username: username.clone(),
            })
            .collect()
        // 3. The read lock is released here
    }
}
```
