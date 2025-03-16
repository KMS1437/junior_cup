import tkinter as tk
from tkinter import messagebox, simpledialog
import json
import os
import webbrowser
from http.server import SimpleHTTPRequestHandler
import threading
import socketserver
from urllib.parse import parse_qs, urlparse

IDEAS_FILE = "ideas.json"
MAP_FILE = "map.html"

def load_json(file):
    if not os.path.exists(file):
        with open(file, "w") as f:
            json.dump([], f)
    try:
        with open(file, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def save_json(file, data):
    with open(file, "w") as f:
        json.dump(data, f, indent=4)

class CustomHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/add_idea':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            idea_data = json.loads(post_data.decode('utf-8'))

            ideas = load_json(IDEAS_FILE)
            ideas.append(idea_data)
            save_json(IDEAS_FILE, ideas)

            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            return

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        return SimpleHTTPRequestHandler.do_GET(self)

class CityApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Городские идеи")
        self.ideas = load_json(IDEAS_FILE)

        tk.Button(self.root, text="Открыть карту", command=self.open_map).pack(pady=5)
        tk.Button(self.root, text="Выход", command=self.root.quit).pack(pady=5)

        self.start_server()

    def open_map(self):
        webbrowser.open('http://localhost:8000/map.html')

    def start_server(self):
        self.httpd = socketserver.TCPServer(("", 8000), CustomHandler)
        self.httpd.app = self
        server_thread = threading.Thread(target=self.httpd.serve_forever)
        server_thread.daemon = True
        server_thread.start()

    def add_idea(self, lat, lng):
        self.root.lift()
        title = simpledialog.askstring("Название", "Введите название идеи:")
        if not title:
            return

        desc = simpledialog.askstring("Описание", "Введите описание идеи:")
        if not desc:
            return

        new_idea = {
            "latitude": lat,
            "longitude": lng,
            "title": title,
            "description": desc
        }
        self.ideas.append(new_idea)
        save_json(IDEAS_FILE, self.ideas)
        messagebox.showinfo("Успех", "Идея добавлена!")

if __name__ == "__main__":
    root = tk.Tk()
    app = CityApp(root)
    root.mainloop()
