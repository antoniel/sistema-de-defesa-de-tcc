# Draft: PR to `arielconti10/verify-app`

Notes for opening the PR. Everything is in English because the upstream repo is in English.

- Fork: `gh repo fork arielconti10/verify-app --clone`
- Branch: `demo-cut`

---

## PR title

```
Add demo cut: turn a long recording into a short demo video
```

## PR body (copy from here to the end of the block)

<!-- ===== START OF PR BODY ===== -->

## What

New script: `scripts/demo_cut.py`.

It takes a recorded video and cuts out the parts where nothing happens. What is left is a short
video you can actually watch. Plus tests and a short doc section.

## Why

The recording has to be continuous. It proves that an action caused a result.

But the agent thinks between actions. While it thinks, the screen does not change. So most of the
video is a still image.

Real numbers from this work:

| Metric | Value |
| --- | --- |
| Video length | 43.4 s |
| Part where something happens | ~4.5 s |
| Longest still part | 14.7 s |
| Length after the cut | 4.5 s |

Nobody watches 43 seconds of a frozen screen.

### About these numbers

They come from one test, on an app in Portuguese. The script removes agent thinking time, not
text on the screen. So an app in English should behave the same. But this is one measurement.
Run it on your own video before quoting a number.

## How to use

```sh
python3 scripts/demo_cut.py recording.mp4 -o demo.mp4 --report
```

It keeps the first 0.6 s of every still part, so you can still read what is on the screen. Short
pauses stay in.

## It does not touch the evidence

- The original video is never changed.
- The demo is saved outside the capture folder. The script refuses to write inside it.
- The demo is not evidence. Do not present it as one.

## Checks

- Fake video with known timings: 15 s in, 7.8 s out. Exact.
- Real recording: 43.4 s in, 4.5 s out.
- 12 tests for the cut logic. They need no ffmpeg and run in 0.1 s.

## Open questions

1. Should this be a script, or a mode inside `format_evidence.py`?
2. Name: `demo_cut.py`, `make_demo.py`, or `condense.py`?

<!-- ===== END OF PR BODY ===== -->

---

## Patch

```bash
gh repo fork arielconti10/verify-app --clone
cd verify-app
git checkout -b demo-cut

cp /Users/antoniel/d/ufba/sistema-de-defesa-de-tcc/scripts/demo_cut.py scripts/
cp /Users/antoniel/d/ufba/sistema-de-defesa-de-tcc/scripts/test_demo_cut.py scripts/

python3 -m unittest discover -s scripts -p 'test_*.py'   # 46 tests

git add scripts/demo_cut.py scripts/test_demo_cut.py
git commit -m "Add demo cut for short demo videos"
```

## Doc edits

### `references/natural-recording.md` — add at the end

````md
## Demo cut

The recording is continuous on purpose. It proves the action→result sequence. But the agent
thinks between tool calls, and that time is recorded too — one measured run had 43 s of video and
about 4.5 s of content.

For a demo, make a shorter copy:

```sh
python3 scripts/demo_cut.py "$VERIFY_DIR/interaction.mp4" -o "$DEMO_DIR/demo.mp4" --report
```

- Never change the original, and write the demo outside the capture folder. The script refuses to
  write inside it.
- The demo is not evidence. `check` only validates the original.
- Every still part is cut to `--keep` seconds (default 0.6), keeping its start, so the result on
  screen is still readable.
- Still parts shorter than `--min-freeze` (default 1.0 s) stay. They are normal reading pauses.

Check the cut against a fake video with known timings (15 s in, 7.8 s out):

```sh
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "color=c=navy:s=640x360:d=2:r=60" \
  -f lavfi -i "testsrc=s=640x360:d=3:r=60" \
  -f lavfi -i "color=c=navy:s=640x360:d=4:r=60" \
  -f lavfi -i "testsrc=s=640x360:d=3:r=60" \
  -f lavfi -i "color=c=navy:s=640x360:d=3:r=60" \
  -filter_complex "[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0[v]" -map "[v]" \
  -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p /tmp/synth.mp4
python3 scripts/demo_cut.py /tmp/synth.mp4 -o /tmp/synth-demo.mp4 --report
```
````

### `SKILL.md` — one line in "Capture evidence"

```md
For a demo video, make a shorter copy with `scripts/demo_cut.py` and keep it outside the managed
capture directory. The demo is not evidence: never present it as a checked asset.
```

### `SPEC.md` — under "Proposed next work" › "Capture coverage"

```md
A recording contains the agent's idle time between actions, so its length does not match how much
content it has. `scripts/demo_cut.py` makes a demo copy with the still parts cut, outside the
managed directory. It is presentation material, not evidence.
```

---

## Before opening

- [ ] Tests green in the fork
- [ ] Watch one output video before and after the cut
- [ ] No managed evidence file changed in the PR
