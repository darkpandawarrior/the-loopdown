# Audio narration plan (ElevenLabs), thin version

Status: plan only, 2026-11-06. No account exists, no key exists, no audio has been generated.

## Prior art in this repo
None. A search of README, scripts, docs and the registry for audio, TTS, narration and ElevenLabs finds only unrelated words (figures.mjs "narrative", design-kit.mjs "audiovisual canon"). Nothing to reuse; nothing to migrate.

## What ElevenLabs says (read from their own pages on 2026-11-06)
- Free plan: no commercial license. Anything published from free output must carry attribution, "elevenlabs.io" or "11.ai" in the title. Source: https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform
- Content made outside a paid subscription, before or after, cannot be used commercially, even if he upgrades later. Paid plans carry a commercial license, subject to the Service-Specific Terms.
- API: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}, header xi-api-key, body text plus optional model_id (default eleven_multilingual_v2). Output format is mp3_44100_128 by default; 192 kbps MP3 needs the Creator tier. There is an India residency endpoint (api.in.residency.elevenlabs.io); enterprise-only features such as zero retention do not apply to him. Source: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- Not verified from official pages: the free plan's monthly credit figure (third-party guides say 10,000 credits, about 10 minutes) and whether the free plan allows API use. Check the pricing page when he signs in. VPN or proxy use can trip abuse detection and disable the free tier.

## Is the Loopdown commercial?
It is a job-search outreach and reach project, with no revenue. Free output published with attribution is the likely fit, but he decides; if he wants no attribution line or any monetised use, he needs a paid plan first.

## Where audio plugs in
One new step after a lesson is published, before distribution:
1. Source: lessons/<dir>/narration.md body only (frontmatter stripped). The script is written from the already-public article.md. Never from private/, fiction/ or any vault note.
2. A new scripts/narrate.mjs (not built yet) reads the body, calls the API with the key from the environment, writes lessons/<dir>/assets/narration.mp3 and a one-line narration entry in meta.yaml (voice id, model, date, plan tier, attribution text).
3. lint-voice runs on narration.md first (already does: it passed for the first script).
4. Distribution stays manual: attach the MP3 on LinkedIn, or host it. The attribution text goes in the post title on free output.
Nothing else in the pipeline changes. data/registry.json can list the audio file later.

## Rules
- Public text only. The script's source must be a published lesson.
- Voice: a stock ElevenLabs voice to begin with. Cloning is allowed for the owner's own voice only, and only if he chooses it; never anyone else. Cloning also needs his own recording and, I believe, a paid plan (not verified).
- Key: stored with `harness secrets set ELEVENLABS_API_KEY` when he has one, read from the environment by the script. It is never typed in chat, never in .env in this repo, never committed.
- No sign-up, no payment and no key creation by an agent.

## Owner steps (one screen)
1. Read lessons/2026-07-20-coroutine-cancellation-messenger/narration.md aloud once; change any line that isn't yours.
2. Decide: free plan with attribution, or paid plan. Sign up yourself at elevenlabs.io (no VPN).
3. On the pricing page, confirm the free credit amount and that the free plan allows API use.
4. Create an API key in the ElevenLabs dashboard, then run in your terminal: `! harness secrets set ELEVENLABS_API_KEY` and paste when prompted. Do not paste it in chat.
5. Tell the agent. It builds scripts/narrate.mjs, makes one MP3 with a stock voice, and you listen before anything is posted.
6. Voice clone of yourself: only if you want it, with your own recording, after step 5.
