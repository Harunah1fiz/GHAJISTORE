#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
project_dir="$repo_dir/ghajiSale"
branch="${DEPLOY_BRANCH:-production-ready}"
venv_path="${VIRTUALENV_PATH:-$HOME/.virtualenvs/ghajistore-venv}"

if [[ -z "${PA_WSGI_FILE:-}" || ! -f "$PA_WSGI_FILE" ]]; then
  echo "Set PA_WSGI_FILE to the WSGI file shown in the PythonAnywhere Web tab." >&2
  exit 1
fi

if [[ ! -f "$venv_path/bin/activate" ]]; then
  echo "Virtualenv not found at $venv_path; set VIRTUALENV_PATH or create it first." >&2
  exit 1
fi

if [[ -n "$(git -C "$repo_dir" status --porcelain)" ]]; then
  echo "Deployment checkout has local changes; commit or safely resolve them first." >&2
  exit 1
fi

git -C "$repo_dir" pull --ff-only origin "$branch"
source "$venv_path/bin/activate"
python -m pip install -r "$repo_dir/requirements.txt"
cd "$project_dir"
python manage.py check --deploy
python manage.py migrate --noinput
python manage.py collectstatic --noinput --ignore='*input.css'
touch "$PA_WSGI_FILE"
echo "Deployment finished; PythonAnywhere WSGI reload requested."
