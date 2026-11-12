# Video script (final, as recorded on 12 Nov 2026)

Length **2:57** (177.0 s), under the 3 minute limit. 1920x1080, 30 fps. Recorded from the live demo at https://termsheet-tgwl.onrender.com after a Reset.

It is a demonstration first: every live scene shows the product doing what the voice says. The problem and the PayPal economics frame it as short motion graphics at the start and the end.

## How it was made
- **Footage.** Playwright drove Microsoft Edge on the hosted demo at 1600x900 (equal to about 120% zoom). A drawn pointer glides to each control and shows a ripple and a button press on every click. Scrolling is eased over 1.5 to 2 seconds.
- **Waits.** The AI and PayPal waits are sped up and carry a small "Sped up" tag. Nothing else is sped up by more than about 1.7 times.
- **Motion graphics.** Written as an HTML page and rendered frame by frame (every frame a pure function of time), so the motion is exact. Only the demo's own numbers and colours.
- **Voice.** Microsoft Edge neural text-to-speech, voice `en-US-AndrewNeural`, rate -9%, about 147 words a minute. Key moments are timed to the spoken words.
- **Edit.** ffmpeg: 0.5 s crossfades, no music, no burned-in subtitles (YouTube adds captions).
- **Honesty.** The decline is labelled "Simulated decline" on screen and in the voice. Sandbox, fake money, seeded history and "rates are assumptions" are shown. No third-party logos, no competitor names, only the demo's fictional businesses.

## 1. The problem (motion graphic) (0:00)
**Screen.** Animated: the TermSheet title and "Live demo · PayPal sandbox · fake money", then Ridgeline and a café, $2,000 of beans crossing to the café, a 30-day bar while the roaster's cash drops to $0, "Pay up front, please." and "Account lost".

**Voice.** "This is a live demo of TermSheet, running in the PayPal sandbox. Marisol runs a small coffee roastery. Her cafés want thirty days to pay. She can't wait thirty days for her money, so she asks for cash up front, and she loses customers."

## 2. How to read the screen (live) (0:17)
**Screen.** Home page, "See it work", Open story 1, the Net 30 card under the PayPal button, Apply. The pointer visits zone A (customer), zone B (PayPal credit team) and the dashed zone C (demo controls).

**Voice.** "TermSheet puts Net 30 under the PayPal button on her own checkout. Every screen has three zones: what the customer sees, what PayPal's credit team sees, and dashed demo controls that are not part of the product."

## 3. Story 1, a café gets 30 days (live) (0:32)
**Screen.** Submit. The AI's tool calls stream in (sped up). Approved $5,000. Credit memo, a citation clicked and the evidence row shown. Save my PayPal account, the PayPal sandbox login (sped up). Roaster page: paid by PayPal Payout.

**Voice.** "Larkspur Café orders two thousand dollars of beans and applies. An AI credit analyst reads the café's PayPal history. Approved, and every sentence cites a real PayPal record. Click one, and there's the evidence. The café saves its PayPal account. Nothing is charged today. And on the roaster's page, Marisol already has a real nineteen hundred and forty dollar PayPal Payout."

## 4. Story 2, a missed payment gets fixed (live) (0:59)
**Screen.** Café phone. Jump to next due date: declined, labelled Simulated decline. Frozen, limit cut. The owner types the reply and sends it. The AI checks it (sped up) and offers $1,000 now and $1,000 on 26 Dec. "Why the AI offered this plan". Accept: a real charge with its capture ID.

**Voice.** "Now the hard part. Thirty days later, Second Shot Café's charge is declined. This decline is a labelled sandbox test. The line freezes, the limit drops, and the café gets a message. The owner replies: espresso machine died, can pay half Friday. The AI checks that story against the café's real PayPal sales, finds it believable, and offers a plan inside fixed rules: one thousand dollars now, one thousand in fifteen days, no fees. Accept, and a real one thousand dollar charge goes through, with its PayPal capture ID."

## 5. Story 3, the AI catches what the rules miss (live) (1:38)
**Screen.** Northgate checkout, ships to Pier 40 Logistics. Apply and submit (sped up). Scorecard 58/100 would allow $2,500; the AI refers to a human. The two contradictions and "What the AI checked that the rules cannot see".

**Voice.** "Northgate Resale looks fine on paper. The rules alone would approve it. But the AI reads the reference letter. It says the business opened in 2024; the form says 2019. The beans ship to a logistics depot, not a café. And the letter claims it was already pre-approved. The AI sends it to a person. In twenty-four live runs, it got all twenty-four right."

## 5b. The AI's role (motion graphic) (2:04)
**Screen.** Animated card "The AI's role · Narrow on purpose" with four points appearing as they are spoken: Reads PayPal data (trade history via the Agent Toolkit, plus the café's own sales); Cites every claim (code rejects any sentence without a real PayPal record); Can only tighten (keep, lower, decline or refer, never raise the scorecard); Never touches money (only ledger code calls the PayPal money APIs).

**Voice.** "The AI's job is narrow on purpose. It reads PayPal data, cites every claim, can only tighten the rules, and never touches money."

## 6. What's in it for PayPal (live, then motion graphic) (2:15)
**Screen.** Credit team console: Fee earned and the funder position with PayPal IDs. Then animated: the $60 fee shrinking by funding, collection, servicing and expected loss to about $21; "$30M in fees" on $1B; the flywheel; 10 cents per AI decision against the $60 fee and the 18,000 counter. "All rates are assumptions" stays on screen.

**Voice.** "So what's in it for PayPal? The credit team console shows it: a sixty dollar fee on every two thousand dollar order. After funding, collection and expected losses, about twenty-one dollars is left. At a billion dollars of wholesale volume, that's about thirty million in fees, on volume that today is often paid outside PayPal. It's a flywheel: cafés that sell through PayPal score higher and get bigger limits. And the AI costs about ten cents a decision. Stopping one bad order pays for eighteen thousand of them."

## 7. Closing card (2:51)
**Screen.** TermSheet. "Net 30, as a PayPal button." termsheet-tgwl.onrender.com. "PayPal sandbox demo · fake money · rates are assumptions · not an offer of credit".

**Voice.** "TermSheet. Net 30, as a PayPal button."

## YouTube description (paste this)
TermSheet: Net 30 for Business inside PayPal checkout. The roaster is paid today, the café pays in 30 days, PayPal earns the fee, and an AI credit analyst that can only tighten a plain scorecard cites a PayPal record for every sentence. Built for the PayPal AI Hackathon. Concept demo in the PayPal sandbox with fake money; not an offer of credit, and PayPal does not offer this product today. Rates are assumptions.

Live demo: https://termsheet-tgwl.onrender.com
Code: https://github.com/paragpandyareal/termsheet

Voice: Microsoft Edge neural text-to-speech. No music.
