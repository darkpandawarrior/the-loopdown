// Pure decisions for the assisted LinkedIn flow, kept apart so they can be tested.
//   node scripts/lib/linkedin.mjs        # self-test
import { LI_URL, readChannel } from "./record.mjs";

export const STALE_HOURS = 48;

export const linkedinUrl = (meta) => readChannel(meta, "linkedin").url;

/** Accept only https://www.linkedin.com/... with no whitespace. Returns "" when valid, else the reason. */
export function urlProblem(u) {
  if (typeof u !== "string" || !u) return "no URL given";
  if (!LI_URL.test(u)) return "not an https://www.linkedin.com/ URL";
  return "";
}

/**
 * Decide staleness for the current "Up next" post.
 * `state` is the previous data/linkedin-state.json ({lesson, firstPrepared}) or null.
 * A different lesson resets the clock; the same lesson keeps its original timestamp.
 */
export function stalenessDecision(state, lesson, now = Date.now(), thresholdHours = STALE_HOURS) {
  const same = state && state.lesson === lesson && Number.isFinite(Date.parse(state.firstPrepared));
  const first = same ? Date.parse(state.firstPrepared) : now;
  const hours = (now - first) / 3.6e6;
  return {
    state: { lesson, firstPrepared: new Date(first).toISOString() },
    hours,
    days: Math.floor(hours / 24),
    stale: hours > thresholdHours,
  };
}

export function selfTest() {
  let bad = 0;
  const eq = (a, b, m) => { if (a !== b) { console.error(`FAIL: ${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); bad++; } };
  eq(urlProblem("https://www.linkedin.com/posts/x-123"), "", "valid post url");
  eq(urlProblem("http://www.linkedin.com/posts/x") !== "", true, "http rejected");
  eq(urlProblem("https://linkedin.com/posts/x") !== "", true, "bare host rejected");
  eq(urlProblem("https://www.linkedin.com.evil.io/x") !== "", true, "look-alike host rejected");
  eq(urlProblem("https://www.linkedin.com/a b") !== "", true, "whitespace rejected");
  eq(urlProblem("") !== "", true, "empty rejected");
  const devto = '  devto: { status: published, url: "https://dev.to/darkpandawarrior/your-lazycolumn-recomposes-on-every-scroll-3amj" }';
  eq(linkedinUrl(`channels:\n  linkedin: { status: pending, url: "" }\n${devto}\n`), "", "empty flow LinkedIn URL does not borrow the following dev.to URL");
  eq(linkedinUrl(`channels:\n  linkedin:\n    status: pending\n    url: ""\n${devto}\n`), "", "empty block LinkedIn URL stays empty");
  const posted = "https://www.linkedin.com/posts/siddharth-pandalai_the-concussed-witness-ugcPost-7484693809122045952-8zta";
  eq(linkedinUrl(`channels:\n  linkedin: { status: published, url: "${posted}" }\n${devto}\n`), posted, "posted flow LinkedIn URL is retained");
  eq(linkedinUrl(`channels:\n  linkedin:\n    status: published\n    url: ${posted}\n${devto}\n`), posted, "posted block LinkedIn URL is retained");
  const t0 = Date.parse("2026-11-01T09:00:00Z"), h = 3.6e6;
  const fresh = stalenessDecision(null, "a", t0);
  eq(fresh.stale, false, "first sight is not stale");
  eq(stalenessDecision(fresh.state, "a", t0 + 47 * h).stale, false, "47h not stale");
  eq(stalenessDecision(fresh.state, "a", t0 + 48 * h).stale, false, "exactly 48h not stale");
  eq(stalenessDecision(fresh.state, "a", t0 + 49 * h).stale, true, "49h stale");
  eq(stalenessDecision(fresh.state, "a", t0 + 7 * 24 * h).days, 7, "7 days counted");
  const reset = stalenessDecision(fresh.state, "b", t0 + 100 * h);
  eq(reset.stale, false, "new lesson resets the clock");
  eq(reset.state.lesson, "b", "state follows lesson");
  eq(stalenessDecision({ lesson: "a", firstPrepared: "junk" }, "a", t0).stale, false, "corrupt state resets");
  if (bad) { console.error(`${bad} self-test failure(s)`); process.exitCode = 1; } else console.log("linkedin self-test: ok");
}

if (import.meta.url === `file://${process.argv[1]}`) selfTest();
