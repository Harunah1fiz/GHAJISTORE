# Ghaji-Stores on PythonAnywhere

This guide deploys the existing Django project on a PythonAnywhere paid
Developer account, using PythonAnywhere's persistent MySQL service. It does not
copy any SQLite data. Local development continues to use `db.sqlite3` unless
you explicitly set `DATABASE_URL`.

## Compatibility and hosting

PythonAnywhere's current `innit` system image supports Python 3.13, which is
compatible with this project's Django 6.0 dependencies. Choose Python 3.13 when
creating the web app and virtualenv. PythonAnywhere's MySQL service is available
on paid accounts; MySQL connection details and database creation are in the
account's **Databases** tab. Use the same account region/system image throughout
setup.

The app project root is the `ghajiSale` subdirectory of this Git repository:
it contains `manage.py`, the `ghajiSale` Django package, templates, and static
sources. The repository root contains `requirements.txt` and the deploy script.

## One-time account setup

1. Create or sign in to your PythonAnywhere account and select the Developer
   plan. Account creation, identity checks, and payment are actions you must
   complete yourself.
2. In **Databases**, set a MySQL password and create a new empty database named
   `ghajistore` (PythonAnywhere prepends your username, resulting in a full name
   like `yourusername$ghajistore`). Do not import or restore the local SQLite
   database.
3. Record the exact database hostname, database name, and username shown on the
   Databases tab. The database username is normally your PythonAnywhere
   username; follow the values shown in your account if they differ.
4. In a PythonAnywhere Bash console, clone the existing repository and branch:

   ```bash
   cd ~
   git clone --branch production-ready https://github.com/Harunah1fiz/GHAJISTORE.git GHAJISTORE
   ```

   If the repository is private, configure a GitHub deploy key on PythonAnywhere
   and use its SSH clone URL instead. Keep that key private and grant it
   read-only repository access.
5. Create an isolated Python 3.13 virtualenv and install dependencies:

   ```bash
   mkvirtualenv --python=python3.13 ghajistore-venv
   cd ~/GHAJISTORE
   pip install -r requirements.txt
   ```

6. Create the untracked production environment file at `~/GHAJISTORE/.env`.
   Start from `.env.example`, then replace every placeholder with values from
   your account. Generate a fresh Django key locally with:

   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

   Never commit `.env`, paste the key into source code, or reuse a development
   key. On PythonAnywhere, protect it with:

   ```bash
   chmod 600 ~/GHAJISTORE/.env
   ```

   Set `ALLOWED_HOSTS` to the exact web-app hostname, without a URL scheme, and
   `CSRF_TRUSTED_ORIGINS` to its HTTPS origin. Set `DJANGO_ENV=production` and
   `DEBUG=False`. Production settings refuse SQLite and require MySQL.
7. In the PythonAnywhere **Web** tab, create a **Manual configuration** app
   using Python 3.13. Set its virtualenv to
   `/home/yourusername/.virtualenvs/ghajistore-venv` and its source/working
   directory to `/home/yourusername/GHAJISTORE/ghajiSale`.
8. Edit the WSGI file linked from the Web tab. Replace its contents with the
   following, substituting your account name:

   ```python
   import os
   import sys

   project_root = "/home/yourusername/GHAJISTORE/ghajiSale"
   if project_root not in sys.path:
       sys.path.insert(0, project_root)
   os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ghajiSale.settings")

   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

   The settings module reads `~/GHAJISTORE/.env`; keep secrets out of the WSGI
   file and Git.
9. Apply schema to the new, empty MySQL database and gather static assets:

   ```bash
   cd ~/GHAJISTORE/ghajiSale
   workon ghajistore-venv
   python manage.py check --deploy
   python manage.py migrate
   python manage.py collectstatic --noinput --ignore='*input.css'
   ```

10. Create the upload directory and, in the **Web** tab, map `/static/` to
    `/home/yourusername/GHAJISTORE/ghajiSale/staticfiles` and `/media/` to
    `/home/yourusername/GHAJISTORE/ghajiSale/media`:

    ```bash
    mkdir -p ~/GHAJISTORE/ghajiSale/media
    ```

    The media directory holds product/category uploads and remains outside
    Git. Enable HTTPS/force HTTPS in the Web tab after the app is live. Then
    click **Reload**.
11. Create the initial production administrator interactively from the Bash
    console. This creates only the one admin account you specify; it does not
    create sample cashier users or store data:

    ```bash
    cd ~/GHAJISTORE/ghajiSale
    workon ghajistore-venv
    python manage.py createsuperuser
    ```

    Choose the username and enter a strong unique password at the prompts.
    Do not put a superuser password in GitHub Actions, `.env.example`, or this
    repository.

## Normal development and release workflow

1. Develop and test locally, using SQLite by default:

   ```powershell
   .\venv\Scripts\Activate.ps1
   cd ghajiSale
   python manage.py test
   ```

2. Commit changes to the deployment branch and push it:

   ```bash
   git add .
   git commit -m "Describe the change"
   git push origin production-ready
   ```

3. On PythonAnywhere, deploy without manually uploading files:

   ```bash
   cd ~/GHAJISTORE
   export PA_WSGI_FILE=/var/www/yourusername_pythonanywhere_com_wsgi.py
   bash scripts/deploy-pythonanywhere.sh
   ```

   The script checks for a clean checkout, fast-forwards from
   `origin/production-ready`, installs the declared requirements, checks the
   production configuration, applies migrations, collects static files, and
   touches the configured WSGI file to reload the app. If the account's WSGI
   filename differs, use the exact path linked in the Web tab.

4. For schema changes, include the Django migration in the Git commit; the
   deployment script applies it before reloading. Review migrations before
   production. Do not run `makemigrations` on the live server.
5. For static changes, the deploy script runs `collectstatic`; verify the
   affected URLs after reload. The checked-in `tailwind.css` is the generated
   stylesheet; `input.css` is only its Tailwind build input and is excluded
   from collection. Uploaded media is not collected as static and must not be
   removed when updating code.

### Optional GitHub-triggered deployment

The repository includes a GitHub Actions workflow for push-triggered deploys
from `production-ready`. Enabling it requires your own account setup and
secrets:

1. Add a dedicated SSH public key to your PythonAnywhere account's authorized
   keys. Add the matching private key as the repository Actions secret
   `PA_SSH_PRIVATE_KEY`.
2. Add `PA_USERNAME`, `PA_REPO_DIR` (for example `/home/yourusername/GHAJISTORE`),
   `PA_WSGI_FILE` (the full WSGI path from the Web tab), and `PA_SSH_KNOWN_HOSTS`
   as Actions secrets. Use a verified PythonAnywhere SSH host key in
   `PA_SSH_KNOWN_HOSTS`; do not turn off host-key checking.
3. Ensure the cloned repository on PythonAnywhere has read access to GitHub
   (for a private repository, use a separate read-only GitHub deploy key).
4. Add the repository Actions variable `PYTHONANYWHERE_DEPLOY_ENABLED=true`
   only after you have verified the account and all deployment secrets.
5. Push to `production-ready`. GitHub Actions then connects over SSH and runs
   the same deployment script. If SSH access or outbound Actions connectivity
   is unavailable for the account, run the manual Bash-console workflow above.

Review each workflow run and the PythonAnywhere error log after an automated
deployment. A push triggers production migrations, so keep schema migrations
backward-compatible with the currently deployed app.

## Initial verification

After reload, test using the production admin/cashier account you created:

- Open the HTTPS site, log in and log out.
- In the app, create a product, set unit and pack pricing, then edit it.
- Set inventory and verify it appears in the product/POS views.
- Sell a unit and a pack; confirm sale items and stock movement/quantity.
- Test an offline sale, reconnect, and verify it synchronizes exactly once.
- Check sales reports, expenses, and dashboard analytics.
- Upload a product image and verify it persists after reload.
- Create a product, log out, reload the site, log in again, and confirm the
  product and its values still exist.
- Check static CSS/JavaScript and admin static assets load without 404s.
- Verify the web app is using MySQL by inspecting `DATABASES` in Django shell:

  ```bash
  cd ~/GHAJISTORE/ghajiSale
  workon ghajistore-venv
  python manage.py shell -c "from django.db import connection; print(connection.vendor)"
  ```

  Expected output: `mysql`.

Do not enter real sales or business records until HTTPS, database persistence,
and a restorable backup have been verified.

`check --deploy` can report W008 because HTTPS redirects are configured at
PythonAnywhere's Web layer; enable **Force HTTPS** there before accepting
production logins. W005 and W021 are intentionally not enabled by default:
the PythonAnywhere subdomain may be shared with other names, and HSTS preload
is unnecessary for the initial deployment. Do not enable HSTS subdomains or
preload unless you control and serve every affected subdomain permanently over
HTTPS.

## Backups, logs, and maintenance

The repository includes `scripts/backup_pythonanywhere_mysql.py`. It reads the
production MySQL connection from Django settings, writes a compressed,
permission-restricted dump under `~/backups/ghajistore/`, and retains the most
recent 14 days. Its temporary MySQL credentials file is mode `0600` and removed
after each run. It refuses to dump SQLite or an incomplete configuration.

Create a daily PythonAnywhere scheduled task for 02:30 UTC with this command:

```bash
/home/yourusername/.virtualenvs/ghajistore-venv/bin/python \
  /home/yourusername/GHAJISTORE/scripts/backup_pythonanywhere_mysql.py
```

Run the command once manually after deployment, then verify a non-empty
`.sql.gz` appears in `~/backups/ghajistore/`. These backups are on the same
PythonAnywhere account as the application, so download/copy them to a separate
device or storage account regularly (at least weekly). Do not rely on an
account-local backup as the only recovery copy.

Restore only after confirming the target database; this overwrites its data.
From a PythonAnywhere Bash console, replace the placeholders and enter the MySQL
password at the prompt rather than putting it in the command:

```bash
gunzip -c ~/backups/ghajistore/ghajistore-YYYY-MM-DDTHHMMSSZ.sql.gz | \
  mysql -h yourusername.mysql.pythonanywhere-services.com \
  -u yourusername -p 'yourusername$ghajistore'
```

Use the PythonAnywhere **Web** tab to inspect the error and server logs. Useful
commands from `~/GHAJISTORE/ghajiSale` are:

```bash
workon ghajistore-venv
python manage.py check --deploy
python manage.py migrate
python manage.py collectstatic --noinput --ignore='*input.css'
python manage.py createsuperuser
python manage.py test
```

## Boundaries

- No SQLite data is imported or deleted. The production MySQL database starts
  empty apart from Django's migration/auth tables and the one administrator
  you create.
- The checkout URL keeps its existing CSRF exemption as requested, and now
  rejects unauthenticated sessions with JSON 401. Keep the POS behind the
  authenticated login flow; do not expose an anonymous checkout client.
- PythonAnywhere account creation, Developer-plan purchase, MySQL password
  setup, creation of the database, and admin credential selection require your
  manual account access.
- Do not use `runserver` for the deployed site; PythonAnywhere serves Django
  through its configured WSGI web app.
