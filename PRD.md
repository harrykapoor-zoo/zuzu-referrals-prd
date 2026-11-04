# zuzu referrals PRD

Interactive previews: [Referrer](https://harrykapoor-zoo.github.io/zuzu-referrals-prd/referrer.html) · [Invitee](https://harrykapoor-zoo.github.io/zuzu-referrals-prd/invitee.html)

Build a reusable referral system that controls how many people each current zuzu member can invite. Limits are configurable by member cohort, with per-member exceptions. Referrers manage invitations in iMessage; invitees verify their identity and join through the same flow. The first 100 members and collectible cards are one optional launch campaign.

# Referral limits and cohort controls

| Member cohort | Initial referral allowance |
| --- | --- |
| Employees | 5 |
| Everyone else | 2 |

- Store limits in server-side configuration, not prompts or frontend constants. Admins can create cohorts, assign members, change a cohort’s allowance, pause referrals, and set or remove an individual member override without deploying code.

- Resolve allowance in this order: member override → assigned referral cohort → default cohort. Assign one referral-policy cohort per member to avoid stacking allowances. Employees receive 5 total, not 5 plus the default 2. Disabling referrals takes precedence over a positive allowance.

- Proposed v1 accounting: allowance is a cumulative total with no automatic calendar reset. `remaining = max(0, effective allowance − successful referrals)`. A referral is successful when the usual onboarding flow creates a verified new membership. Link generation, shares, visits, failed verification and abandoned sessions do not consume allowance.

- Policy changes apply to future redemptions, including old links. Preserve historical usage across cohort changes, overrides and campaigns. Example: a member with 1 referral used moves from allowance 2 to 5 and has 4 left. Reducing their allowance below usage leaves 0 remaining and does not revoke existing memberships. Do not automatically refund quota when a referred member leaves.

- New members receive the default allowance of 2 as soon as membership creation commits, unless assigned another cohort or override. Their allowance does not inherit their inviter’s employee entitlement.

- Admin view must show member, cohort, effective allowance, successful referrals, remaining, enabled status and override; audit changes with actor, old/new values, time and reason.

# Founding members campaign

Configure the first launch as a campaign with 100 slots, one numbered edition per member, its own offer and open or closed admission status. The core referral service has no hardcoded 100-member ceiling. Campaign eligibility and inventory are additional checks, independent of a referrer’s cohort allowance. A referral in any campaign consumes the same member allowance; campaigns do not grant fresh quota by default.

- Public card states are **Open** and **Claimed**. A claimed card cannot be claimed again. Opening a link or entering a code does not reserve an edition.

- Preselection is a suggestion, not ownership: link previews and page opens never reserve inventory. Keep the suggested card stable within a join session and carry an optional edition hint in the link. Validate availability on open and again at commit. Link crawlers never create sessions or claims. The production link thumbnail is a representative card when an exact still-open edition cannot be guaranteed.

- The shared invitation card displays **Founding Member** in the name position and **invited by X** below. It never includes a recipient name. On the web landing page, the recipient enters their preferred name; only their private preview updates. After successful onboarding, the claimed card uses that name. Disclose public card display beside the name field. Names never appear in the reusable referral link or its shared thumbnail. Remove the duplicate top-right founding-member label; keep only the zuzu wordmark at the top. Typing a name replaces Founding Member, and clearing the field restores it.

- Homepage wording: **$500 annual membership. Complimentary for first 100 founding members.** Complimentary duration is a launch decision; do not infer lifetime access or create a renewal charge.

- Current website is a preview: #001 is marked **Claimed by Neha**, invited by Taranjeet; the other 99 are open. Invite entry does not redeem anything. Production must bind #001 to a verified member or retain it explicitly as a demo outside production inventory.

# Referrer experience in iMessage

1. Member: **“Give me my referral link.”** zuzu reads the current policy and usage and returns the same persistent personal link: **“You have 2 invitations to zuzu. Share this with someone you’d love to bring in: [link].”** An employee sees 5 initially. Counts always come from the referral service.

2. Offer a forwardable message: **“I have an invitation to zuzu for you. Thought you’d love this. [link]”** The founding campaign’s thumbnail uses the actual pearl card design with **Founding Member** in place of a recipient name and **invited by X**. The same link can be shared with different people, so its thumbnail stays unnamed even after someone joins. The member forwards it themselves; zuzu does not message contacts automatically.

3. **“Who has joined through me?”** returns successful referrals and current remaining allowance: **“Neha joined through you. You have 1 invitation left.”** An employee with the same usage sees 4. Do not show an invitee’s browsing activity or task content.

4. On successful joining, send one transactional update: **“Neha is in. Invited by you. You have 1 invitation left.”** For the founding campaign, append their claimed edition number. Recognise the introduction without a public ranking.

5. At zero remaining: **“All your current invitations have been used. I’ll show your updated allowance here if it changes.”** Keep the existing link and block new redemptions until quota is available. Distinguish exhausted allowance, referrals paused, invalid invite and closed campaign; do not promise automatic replenishment.

All active current members can refer under their effective policy. An employee cohort is an allowance rule; a founding campaign is an admission offer. Neither implies the other.

## Invitation model

**Selected for v1: one shareable personal link per member**, controlled by their configured referral allowance. No recipient name or contact is required from the referrer. Any eligible new recipient can redeem it while allowance remains. Attribute successful referrals and rewards using verified membership creation, not link clicks. The recipient supplies their name on the web landing page; that belongs to their join session, not the reusable link.

Recipient-bound invitation issuance, contact uploads and reminders to people who have not engaged are out of scope for v1.

Individual single-use invitations may be considered later. They are not part of the selected v1 flow.

# Invitee experience across web and iMessage

1. Start in the friend’s iMessage thread: the invitee receives the referrer’s reusable link with an unnamed pearl-card thumbnail reading **Founding Member**. Tapping it opens the web landing page with inviter attribution preserved; no manual invite entry is required.

2. Show one available card already selected for the founding campaign, with **Choose a different card** as an optional secondary action. On the same web page, ask **Your name on the card** and update the private card preview as they type. Standard membership asks **What should we call you?** without a collectible card. Require a nonblank trimmed name before **Continue to iMessage**; accept Unicode names and a single-word name, bound length, and safely render text. Preserve name and selection when switching cards. Do not require a gallery visit or another confirmation screen.

3. **Continue to iMessage** saves the entered name, validated invite, inviter and selected card in a short-lived private join session, then opens the composer with **“I’d like to join zuzu. [invite attached]”**. Pass an opaque session reference, not a name in the shared URL. User sends the message themselves. Provide a copyable-message fallback. Typing a name or opening the composer does not create membership, claim a card or consume an invitation.

4. The sent join request is sufficient intent. Verify the sender through the messaging integration, bind their join session, and continue the usual onboarding flow with the web-entered name prefilled. Do not ask for the name again or add **Ready to join?** or another claim confirmation. Allow name correction through the usual flow. Illustrative greeting: **“Hi Neha. Taranjeet sent you. Lovely to meet you.”** Engineering reuses the existing onboarding entrypoint and remaining required steps.

5. At successful completion of usual onboarding, create membership, attribute the inviter and consume one referral atomically. For the campaign, claim and lock the selected edition in the same transaction. Return the welcome message and personal card link, then continue the usual product experience. New members receive the default 2 referrals unless configured otherwise. Do not add a second confirmation after onboarding.

6. Recheck current allowance and campaign inventory at membership commit. If an auto-selected card became unavailable, assign another available edition and clearly show the final card without repeating onboarding. If the invitee deliberately chose a specific card, ask them to choose another rather than silently replacing it; preserve their completed onboarding data. If quota ran out or the campaign filled, explain the issue and do not consume quota or partially create membership. Offer standard membership only if configured and explicitly accepted; never silently change an offer or price.

7. Existing members return to their account and existing card, if any; they do not consume another referral or change inviter attribution. Interrupted sessions resume after verification or restart safely if expired. Unsupported messaging identities receive an actionable support path. Show success only after the server commits membership.

# Engineering contract

- **Data:** member and verified messaging identity; referral cohort and versioned policy; optional member allowance override; referral enabled status; opaque referral token; successful-referral ledger with unique referred member and inviter; expiring private join session with preferred display name and optional card selection; notification outbox. Campaigns, entitlements and optional edition claims are separate records. Persist the policy version used for each successful redemption.

- **Proposed endpoints:** authenticated referral link and status returning cohort, effective limit, used and remaining; public invite validation; join-session creation and verification; idempotent redemption; join-status readback; admin cohort and override configuration. Optional campaign endpoints expose availability and claims. Restrict policy writes to admins. Browsers and model-generated messages cannot grant invitations or write membership.

- **Atomic redemption:** revalidate member eligibility, effective policy and remaining allowance at commit. Enforce one referred membership per verified identity. Create membership and inviter attribution, record usage, and enqueue notifications in one transaction. A campaign also validates its cap and commits the unique edition claim in that transaction. Duplicate join messages and onboarding callbacks return the same result; competing redemptions for the last allowance produce at most one success. Failed attempts consume nothing.

- **Security:** unguessable tokens, server-side validation, token hashing at rest, bounded session expiry, rate limits, authenticated messaging callbacks and replay protection. Referral links confer eligibility, not proof of identity. Do not log raw tokens or send them to analytics; exchange URL tokens for a session and remove them from the visible URL. Link previews and crawlers must never consume invitations. Keep the entered name scoped to its join session until verification. Do not place it in public query parameters, shared-link metadata or a global referral-token record; two people using one link must never see or overwrite one another’s names.

- **Recovery:** refresh policy and usage on referral requests and final redemption; keep old links consistent with current limits. Retry notifications independently of membership creation. Support can revoke referral links and make audited allowance corrections without changing successful attribution or silently reassigning a card.

- **Ownership:** Deshraj and engineering connect referral and claim services to zuzu’s messaging identity and onboarding. Validate the iMessage handoff against the actual integration before launch.

# User stories and edge cases

**Referrer:** get one reusable link, share it, see who joined and how many invitations remain.

**Invitee:** open a friend’s link, receive a preselected card, optionally change it, enter a name, and continue usual onboarding in iMessage without repeating steps.

**New member:** receive the default 2 invitations and access their claimed card.

**Admin:** configure cohort limits and member overrides, pause/revoke access, and inspect attribution and usage without resetting history.

| Situation | Required outcome |
| --- | --- |
| Same link forwarded widely or leaked | Anyone eligible may use it until quota is exhausted; no recipient promise or reservation. Admin can revoke/rotate it; old token stops working, completed referrals remain. |
| Multiple inviters or browser tabs | Proposed default: show the inviter attached to the active join session; bind attribution at verified handoff. Changing inviter before completion must be explicit. After membership commits, no reassignment or second reward. |
| Self-referral, existing account, repeat signup | Reject self-referrals; return existing members to their account. Deduplicate on verified canonical identity, never display name; no extra quota use. Multiple aliases must use existing account-linking rules. |
| Limit changes, member disabled, employee leaves | Recheck effective policy at commit. Preserve usage; lowering below usage gives 0 remaining. Existing memberships survive. Admin updates the member’s cohort/eligibility. |
| Invalid invite or quota exhausted mid-flow | Explain the reason; allow another valid invite while preserving onboarding progress. No partial membership, reward or quota consumption. |
| Closed/full campaign | Explain the offer is unavailable. Do not silently substitute a paid or standard offer. Standard referrals outside that campaign continue. |
| Card taken during onboarding | Auto-selected card: choose another available one and show the result. Explicitly chosen card: ask for a replacement; retain entered name and progress. |
| Browser close, back, expired session or device switch | Resume valid sessions safely. Expired sessions revalidate invite and identity; never expose a prior recipient’s name. A verified session cannot be claimed by a different sender. |
| iMessage unavailable, composer cancelled or session code removed | Offer copyable handoff/support; recover through a fresh valid session. No sent join message means no onboarding admission or quota use. |
| Blank, long or Unicode name; name correction | Block blank/whitespace names; support Unicode and single words, escape markup and fit card text. Changes affect only that recipient; shared thumbnail stays Founding Member. Use the usual profile flow for later corrections. |
| Concurrent last slot, duplicate messages, timeout after success | Commit membership, attribution, quota and card atomically. Exactly one winner per remaining slot; retries return the existing result. Read committed status before asking the user to retry. |
| Notification failure or reward pending | Keep committed membership; retry notifications without duplicates. Keep joined and activated distinct; credit any future approved reward once per qualifying referral, never per click. |
| Member leaves or requests privacy changes | No automatic quota refund, card resale or reassignment. Use existing account/privacy handling for public-name removal; retain only permitted accounting records. |

These are release acceptance cases. Attribution-switching and leaked-link defaults above are proposed product rules for engineering review.

- Measure referral-link requests, invite opens, landing views, card changes, name-entry completion, iMessage handoffs, onboarding completion, successful referrals, failures by reason and activation; segment by referrer cohort, policy version and campaign. Proposed activation: invitee completes their first real task within seven days. Track campaign claims separately from referral success. The quota is consumed at membership creation, not task activation.

**Before production:** confirm the proposed no-reset quota accounting, messaging identity handoff and campaign offer duration. Verify Neha’s identity before seeding a real #001 claim. Employee rewards remain a separate policy requiring approved amounts and activation criteria; this PRD does not implement payouts or automatic billing.