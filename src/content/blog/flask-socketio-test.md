---
title: "Flask วิธี Test WebSocket ของ Flask-SocketIO"
description: "วิธีการ Test SocketIO ของ Flask ด้วย Pytest"
pubDate: "Sep 12 2025"
heroImage: "../../assets/blog/flask-socketio-test/thumbnail.png"
tags: ["python", "flask", "Flask-SocketIO", "SocketIO", "pytest"]
---

พอดีได้เอา Project ที่เขียนด้วย Flask Python แล้วอยากทำ Test เพิ่มด้วย

ใน Project มี Websocket ที่ใช้ Flask-SocketIO แล้วมันเทสยังไงกันนะ

ผมไปงมหามาให้แล้ว

<br>

## Talk is cheap. Show me the code

<br>

เริ่มต้นด้วยการสร้าง Flask + SocketIO แบบง่ายๆ `main.py`

```py
from flask import Flask, render_template
from flask_socketio import SocketIO, send

socketio = SocketIO()

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret!"

@socketio.on("message")
def handle_message(data):
    print("server socketio received message: " + data)
    send(f"server got: {data}")

@socketio.on_error()
def error_handler(e):
    print("socketio error:", e)

@app.route("/")
def hello_world():
    return "Hello, World!"

def create_app():
    socketio.init_app(app)
    return app

if __name__ == "__main__":
    app = create_app()
    socketio.run(app)
```

แล้วสร้าง pytest test file `test_main.py`

```py
import pytest
from main import create_app, socketio
from flask.testing import FlaskClient
from flask_socketio.test_client import SocketIOTestClient

@pytest.fixture()
def app():
    app = create_app()
    app.config.update({"TESTING": True})
    yield app

@pytest.fixture()
def flask_client(app):
    return app.test_client()

@pytest.fixture()
def runner(app):
    return app.test_cli_runner()

```

ต่อมาสร้าง SocketIO test client ด้วย `socketio.test_client(app)`

ตัว `socketio.test_client(app)` ต้องใช้ `app` ที่สร้างจาก pytest fixture ข้างบน

```py
@pytest.fixture()
def socketio_client(app):
    socketio_client = socketio.test_client(app)
    return socketio_client
```

<br>

#### ⚠️ Gotcha !

`socketio` ของ `socketio.test_client(app)` คือ `socketio = SocketIO()` จาก `main.py`

<br>

เขียน testcase ทดสอบ SocketIO

```py
def test_socketio_message(socketio_client: SocketIOTestClient):
    socketio_client.send("hello from pytest")
    recv = socketio_client.get_received()
    print("test_socketio_message recv", recv)

    assert len(recv) == 1
    assert recv[0]["name"] == "message"
    assert recv[0]["args"] == "server got: hello from pytest"
    assert recv[0]["namespace"] == "/"
```

<br>

แล้วรัน Test ด้วย

```sh
pytest
```

<br>

Done! We were finally able to test WebSocket! 🎉

<br>

### Source code

[https://github.com/wuttinanhi/flask-socketio-test](https://github.com/wuttinanhi/flask-socketio-test)
