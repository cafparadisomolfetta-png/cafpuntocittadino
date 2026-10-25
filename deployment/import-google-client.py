#!/usr/bin/env python3
"""Import a Google web client into the root-only VPS env without echoing it."""
import json
import os
from pathlib import Path
import re
import signal
import stat
import sys
import tempfile
import termios

ORIGIN = "https://puntocittadinoitalia.it"
REDIRECT = ORIGIN + "/.netlify/functions/google-calendar-callback"


def client_values(payload):
    try:
        web = json.loads(payload)["web"]
        client_id, secret = web["client_id"], web["client_secret"]
        valid = (
            web.get("project_id") == "caf-punto-cittadino-ai"
            and re.fullmatch(r"167971566129-[a-z0-9]+\.apps\.googleusercontent\.com", client_id)
            and re.fullmatch(r"[A-Za-z0-9_-]{16,256}", secret)
            and REDIRECT in web.get("redirect_uris", [])
            and ORIGIN in web.get("javascript_origins", [])
        )
    except (ValueError, KeyError, TypeError):
        valid = False
    if not valid:
        raise ValueError("File non valido per il client web e il dominio previsti.")
    return {"GOOGLE_CLIENT_ID": client_id, "GOOGLE_CLIENT_SECRET": secret,
            "GOOGLE_REFRESH_TOKEN": ""}


def update_environment(destination, values):
    destination = Path(destination)
    fd = os.open(destination, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, "r", encoding="utf-8") as source:
        info = os.fstat(source.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or stat.S_IMODE(info.st_mode) != 0o600:
            raise ValueError("La configurazione deve essere un file root con permessi 0600.")
        lines = source.read().splitlines()
    for key, value in values.items():
        matches = [i for i, line in enumerate(lines) if line.startswith(key + "=")]
        if len(matches) > 1:
            raise ValueError("Variabili duplicate: configurazione non modificata.")
        if matches:
            lines[matches[0]] = key + "=" + value
        else:
            lines.append(key + "=" + value)
    temporary = None
    try:
        fd, temporary = tempfile.mkstemp(prefix=".google-import-", dir=destination.parent)
        with os.fdopen(fd, "w", encoding="utf-8") as target:
            os.fchmod(target.fileno(), 0o600)
            os.fchown(target.fileno(), info.st_uid, info.st_gid)
            target.write("\n".join(lines) + "\n")
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, destination)
        temporary = None
        directory_fd = os.open(destination.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if temporary is not None:
            os.unlink(temporary)


def read_private_json():
    if not sys.stdin.isatty():
        raise ValueError("Usare esclusivamente una console interattiva privata.")
    fd = sys.stdin.fileno()
    previous = termios.tcgetattr(fd)
    hidden = termios.tcgetattr(fd)
    hidden[3] &= ~(termios.ECHO | termios.ECHONL)
    chunks = []
    print("Incolla il contenuto del JSON Google (non sara' visibile).", flush=True)
    print("Poi premi Invio, scrivi FINE su una nuova riga e premi Invio.", flush=True)
    try:
        termios.tcsetattr(fd, termios.TCSAFLUSH, hidden)
        size = 0
        while True:
            line = sys.stdin.readline(32769)
            if not line:
                raise ValueError("Inserimento interrotto.")
            if line.strip() == "FINE":
                break
            size += len(line)
            if size > 32768:
                raise ValueError("File troppo grande.")
            chunks.append(line)
    finally:
        signal.alarm(0)
        termios.tcflush(fd, termios.TCIFLUSH)
        termios.tcsetattr(fd, termios.TCSANOW, previous)
    return "".join(chunks)


def main():
    if os.geteuid() != 0:
        print("Richiesto accesso root alla console privata.", file=sys.stderr)
        return 1
    def timeout(_signum, _frame):
        raise ValueError("Tempo di inserimento scaduto.")
    signal.signal(signal.SIGALRM, timeout)
    try:
        values = client_values(read_private_json())
        update_environment("/etc/cafpuntocittadino/runtime.env", values)
    except (ValueError, OSError, KeyboardInterrupt):
        print("\nImportazione non completata. Nessun valore segreto viene mostrato.")
        return 1
    print("\nClient Calendar importato nella configurazione privata.")
    print("Client di login conservato. Serve ancora una nuova autorizzazione Calendar.")
    print("Il servizio non e' stato avviato.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
