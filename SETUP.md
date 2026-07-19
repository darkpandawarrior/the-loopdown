# Setup — accounts, tokens, and the pipeline

Do the account/token steps yourself (I can't create accounts or hold credentials). Each
takes 2–5 min. As you add each token, `node scripts/check-setup.mjs` lights it up.

```bash
cd scripts && npm install          # once
cp ../.env.example ../.env          # then fill ../.env with what you have
node check-setup.mjs                # readiness dashboard (safe, read-only)
```

You never commit `.env` — it's gitignored. Nothing here leaves your machine except the
authenticated API calls *you* trigger.

---

## 1. GitHub (push the repo) — do this first
Needed so cover images have a public URL and the repo becomes your portfolio wall.

```bash
gh auth login                       # if not already
cd /Users/darkpandawarrior/Repos/the-loopdown
gh repo create the-loopdown --public --source=. --push
```
Then set in `.env`:
```
GITHUB_ASSET_BASE_URL=https://raw.githubusercontent.com/darkpandawarrior/the-loopdown/main
```

## 2. dev.to — easiest, full automation ✅
1. dev.to → **Settings → Extensions** → *DEV Community API Keys* → name it "loopdown" → **Generate API Key**.
2. Paste into `.env` → `DEVTO_API_KEY=...`
3. `node check-setup.mjs` should show dev.to ●.

Publishing creates a **draft by default** (`--draft`) so you review on-platform; `--publish` goes live.

## 3. Hashnode — full automation, but needs Pro ⚠️
> As of **2026-05-13**, Hashnode's API requires a **Hashnode Pro** subscription to read/publish. If you're not on Pro, skip Hashnode and cross-post there manually for now.

1. Create a publication on Hashnode if you don't have one.
2. **hashnode.com/settings/developer** → *Generate New Token* → paste → `.env` → `HASHNODE_TOKEN=...`
3. Run `node check-setup.mjs` — it prints your **publication ids**. Copy one into `.env` → `HASHNODE_PUBLICATION_ID=...`

## 4. Buffer (LinkedIn scheduling) — optional 🟡
LinkedIn works **without** this: export always writes a paste-ready `out/linkedin.txt`. Buffer only adds auto-queueing, and its API needs a developer app.
1. **buffer.com/developers/apps** → *Create an App* → get an **Access Token**.
2. `.env` → `BUFFER_ACCESS_TOKEN=...`
3. Find your LinkedIn profile id via Buffer's API (`/1/profiles.json`) → `.env` → `BUFFER_LINKEDIN_PROFILE_ID=...`

Recommendation: **start with paste-to-LinkedIn** (highest control, best early engagement), add Buffer only if scheduling becomes a chore.

## 5. Medium — no token 🔵
Medium's write API is deprecated. Export writes `out/medium.md`; paste it, or use **medium.com/p/import** to pull from the published dev.to/Hashnode URL (keeps canonical clean).

---

## The publish flow, once tokens are in

```bash
# safe: plan + generate paste files, zero network publish
node scripts/export.mjs lessons/2026-07-19-mileway-dead-reckoning

# create reviewable drafts on dev.to (Hashnode publishes on --publish only)
node scripts/export.mjs lessons/2026-07-19-mileway-dead-reckoning --draft

# go live (explicit; you're the one running it)
node scripts/export.mjs lessons/2026-07-19-mileway-dead-reckoning --publish

# limit channels
node scripts/export.mjs lessons/<dir> --draft --only devto,linkedin
```

Results are logged back into the lesson's `meta.yaml`; run `node scripts/build-registry.mjs`
to refresh the README wall.

## Safety notes
- Default is **dry-run**. Nothing publishes unless you pass `--draft`/`--publish`.
- No tool ever touches your LinkedIn account directly — worst case it queues to Buffer, which you approve.
- Tokens live only in `.env` (gitignored). Rotate any token by regenerating on the platform and re-pasting.
