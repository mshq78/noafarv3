# Deploying Noafar to a VPS

Everything runs in Docker: Caddy (HTTPS, automatic certificates), the Node app and Postgres.

1. Get the code onto the server (Ubuntu): `git clone <repo> noafarv3` (a private repo needs a
   read-only access token in the URL), or copy a zip of the repo and unpack it.
2. `cd noafarv3/deploy && sudo bash setup.sh`. It installs Docker, writes `deploy/.env` with random
   secrets, builds the app, and loads the content. Answer `:80` for the domain to test over the IP.
3. Open `http://<server-ip>` and check the site. Sign in with an admin email from step 2.
   While no SMS provider is set, login codes are printed in `docker compose logs app`.
4. Move the domain: set the DNS A records of `noafar.ir` and `www.noafar.ir` to the server IP, then in
   `deploy/.env` set `DOMAIN=noafar.ir, www.noafar.ir` and `PUBLIC_URL=https://noafar.ir` and run
   `docker compose up -d`. Caddy gets the certificate by itself once DNS points here.
5. Later: `bash update.sh` pulls and rebuilds; `bash backup.sh` dumps the database (put it in cron).

Uploaded files live in the `uploads` volume and the database in `dbdata`; both survive rebuilds.
