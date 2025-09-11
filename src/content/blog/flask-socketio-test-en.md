---
title: "Flask: How to Test WebSocket with Flask-SocketIO"
description: "How to Test Flask’s SocketIO with Pytest"
pubDate: "Sep 12 2025 6:50 AM"
heroImage: "../../assets/blog/flask-socketio-test/thumbnail.png"
tags:
  ["python", "flask", "Flask-SocketIO", "SocketIO", "pytest", "english-version"]
---

I had a project built with Flask (Python) and wanted to add some tests.

In the project, there’s a WebSocket using Flask-SocketIO — but how do we test that?

I did some digging and here’s what I found.

<br>

## Talk is cheap. Show me the code

<br>

Start by creating a simple Flask + SocketIO app `main.py`:

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

Then create a pytest test file `test_main.py`:

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

Next, create a SocketIO test client with `socketio.test_client(app)`

The `socketio.test_client(app)` must use the `app` created from the pytest fixture above:

```py
@pytest.fixture()
def socketio_client(app):
    socketio_client = socketio.test_client(app)
    return socketio_client
```

<br>

#### ⚠️ Gotcha!

The `socketio` in `socketio.test_client(app)` is the same `socketio = SocketIO()` from `main.py`.

<br>

Write a test case for SocketIO:

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

Then run the test with:

```sh
pytest
```

<br>

Done! We can finally test WebSocket! 🎉

<p align="center">
  <img src="https://media1.tenor.com/m/IVfBB8GdECAAAAAC/happy-tuesday.gif" width="300" height="300"/>
</p>

<br>

### Source code

[https://github.com/wuttinanhi/flask-socketio-test](https://github.com/wuttinanhi/flask-socketio-test)
