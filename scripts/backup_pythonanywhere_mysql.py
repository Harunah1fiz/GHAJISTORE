#!/usr/bin/env python3
import gzip
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
PROJECT_DIR = REPO_ROOT / "ghajiSale"
BACKUP_DIR = Path.home() / "backups" / "ghajistore"
RETENTION_DAYS = 14

sys.path.insert(0, str(PROJECT_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ghajiSale.settings")

from django.conf import settings


def _option_value(value):
    escaped = (
        str(value)
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )
    return f'"{escaped}"'


def _write_client_config(database):
    descriptor, filename = tempfile.mkstemp(
        prefix=".ghajistore-mysql-",
        suffix=".cnf",
        dir=BACKUP_DIR,
        text=True,
    )
    os.fchmod(descriptor, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as config:
        config.write("[client]\n")
        for option in ("USER", "PASSWORD", "HOST", "PORT"):
            value = database.get(option)
            if value:
                config.write(f"{option.lower()}={_option_value(value)}\n")
    return Path(filename)


def _prune_old_backups(now):
    cutoff = now - timedelta(days=RETENTION_DAYS)
    removed = 0
    for path in BACKUP_DIR.glob("ghajistore-*.sql.gz"):
        if datetime.fromtimestamp(path.stat().st_mtime, timezone.utc) < cutoff:
            path.unlink()
            removed += 1
    return removed


def main():
    database = settings.DATABASES["default"]
    if not database["ENGINE"].endswith("mysql"):
        raise RuntimeError("Refusing to back up a non-MySQL database.")
    if not all(database.get(key) for key in ("NAME", "USER", "PASSWORD", "HOST")):
        raise RuntimeError("MySQL database settings are incomplete.")

    BACKUP_DIR.mkdir(parents=True, exist_ok=True, mode=0o700)
    os.chmod(BACKUP_DIR, 0o700)

    now = datetime.now(timezone.utc)
    timestamp = now.strftime("%Y-%m-%dT%H%M%SZ")
    backup_path = BACKUP_DIR / f"ghajistore-{timestamp}.sql.gz"
    temporary_path = None
    client_config = None
    try:
        client_config = _write_client_config(database)
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=".ghajistore-",
            suffix=".sql.gz.tmp",
            dir=BACKUP_DIR,
        )
        os.close(descriptor)
        temporary_path = Path(temporary_name)
        command = [
            "mysqldump",
            f"--defaults-extra-file={client_config}",
            "--single-transaction",
            "--quick",
            "--set-gtid-purged=OFF",
            "--no-tablespaces",
            "--routines",
            "--triggers",
            "--default-character-set=utf8mb4",
            database["NAME"],
        ]
        with temporary_path.open("wb") as output:
            with gzip.GzipFile(fileobj=output, mode="wb", mtime=0) as compressed:
                result = subprocess.run(
                    command,
                    stdout=compressed,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=False,
                )
        if result.returncode:
            raise RuntimeError(
                f"mysqldump failed with exit code {result.returncode}: "
                f"{result.stderr.strip()}"
            )
        if temporary_path.stat().st_size == 0:
            raise RuntimeError("mysqldump produced an empty backup.")

        os.chmod(temporary_path, 0o600)
        os.replace(temporary_path, backup_path)
        removed = _prune_old_backups(now)
        size = backup_path.stat().st_size
        print(
            f"Database backup created at {backup_path} "
            f"({size} bytes); pruned {removed} expired backup(s)."
        )
    finally:
        if client_config is not None:
            client_config.unlink(missing_ok=True)
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
