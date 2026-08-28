# AVAX Impact pilot field guide

Use this guide to recruit qualified Avalanche participants, run discovery before a
demonstration, collect privacy-safe evidence, and capture feedback without turning a
public declaration into an identity claim.

## Outreach copy

Adapt the wording to the channel and relationship. Do not imply endorsement,
partnership, funding, or an existing user base.

### Short message

> I'm researching how Avalanche C-Chain apps, wallets, bots, and agents prove which
> surface prepared a transaction when users call third-party contracts directly. Could
> we spend 20 minutes on your current reporting workflow? I will ask about the last real
> case before showing any solution. If the problem is relevant, there is an optional
> Fuji-only technical pilot. No wallet connection, private key, production data, or
> public attribution is required for the interview.

### Email

**Subject:** 20-minute research call on Avalanche transaction-origin reporting

> I'm speaking with teams that build Avalanche C-Chain transactions for users or
> automation. I want to understand how they currently distinguish the app, wallet, bot,
> or agent that prepared a call when the sender and destination do not reveal that
> surface.
>
> The first 15 to 20 minutes are discovery only: a recent example, the current workflow,
> and whether the problem has enough priority to solve. I will not present AVAX Impact
> until those questions are complete. If the job is relevant, I can share a read-only
> Fuji workbench and an optional testnet integration guide afterward.
>
> Interview notes are anonymized by default. We will not request keys, authenticated RPC
> URLs, production user data, or permission to publish your name. Any quote, team name,
> or link between a public Fuji transaction and your team needs a separate explicit yes.

## Discovery interview: 15 to 30 minutes

Do not send the product deck, explain ERC-8021, or demonstrate the workbench before
section 4. The goal is to observe an existing job, not teach the participant a problem.

### 1. Permission and role: 0 to 2 minutes

Read this aloud:

> I will take text notes about the workflow, not record the call. I will not collect
> customer identifiers, wallet keys, private RPC URLs, or production payloads. Findings
> are anonymous unless we make a separate publication decision at the end. Is that okay?

Ask:

- What part of the Avalanche transaction-building or reporting flow do you own?
- Which Avalanche network and transaction types are in scope for your work today?

Stop or exclude the interview from the qualified count if the participant does not own
or directly operate the relevant workflow.

### 2. Last real episode: 2 to 8 minutes

- Tell me about the last time you needed to determine which product surface prepared an
  Avalanche transaction.
- What triggered that need?
- Walk me through the evidence you used, in order.
- Which step took the most time or created the most uncertainty?
- What happened when two surfaces could produce the same contract call?

Capture the participant's words before introducing terms such as builder code,
attribution suffix, or registry.

### 3. Current priority and constraints: 8 to 17 minutes

- How often has this happened in the last month or quarter?
- Who consumes the answer, and what decision do they make with it?
- What do you use today: private logs, campaign tags, sender heuristics, contract events,
  explorer data, Data API, Dune, or another method?
- What breaks if the current method is wrong or unavailable?
- Where does this job rank among your top three analytics or reporting problems?
- What would make a public, copyable declaration unusable for this job?
- Which signer, wallet, or backend path would have to preserve calldata exactly?
- Are there targets that inspect calldata length, use custom decoders, or depend on
  `msg.sender` or transaction value?

Do not convert “interesting” into demand. Record the stated rank, current workaround,
frequency, and consequence.

### 4. Solution reveal and falsification: 17 to 25 minutes

Ask permission to show the product. Then explain only this:

> AVAX Impact appends a public builder-code declaration to ordinary EVM calldata. It
> pins one block, requires the original call to succeed, and compares original and
> attributed return data. It selects the tested original only when policy permits. The
> code is copyable and proves declaration, not identity or authorization.

Use the [live Fuji workbench](https://avax-impact.0xarayy.workers.dev) to inspect the
confirmed schema 1 sample and run both compatible and strict preflight paths.

Ask:

- What part fails to fit your current transaction path?
- Is declared, spoofable origin still useful for the decision you described? Why?
- What evidence would you need before trying this on Fuji?
- Would you allocate up to one engineering day to an independent pilot? A polite yes to
  another conversation is not a pilot commitment.

State explicitly that the visible Fuji transaction embeds the deployed standard
registry address and chain ID under the pinned ERC-8021 draft. The draft is not a
finalized ERC, the contracts are unaudited, and a public declaration is still copyable.
Historical schema 0 evidence is available only as a separately labeled reproduction.

### 5. Close: 25 to 30 minutes

- Ask whether the participant wants the [technical flow](pilot-technical-flow.md).
- Make no publication request until the interview is complete.
- Record the evidence classification and consent choices below.
- Schedule technical help only after the participant records its first independent
  attempt.

## Interview note template

Copy this block into a private, access-controlled note. Do not commit raw interview
notes to the public repository.

```markdown
# Discovery record

- Participant ID: P-YYYY-NN
- Date in UTC:
- Role category: app engineer | wallet engineer | bot/agent engineer | analytics/growth | other
- Avalanche scope: C-Chain mainnet | Fuji | both
- Qualification result: qualified | not qualified
- Qualification reason:

## Last real episode

- Trigger:
- Current workflow, in order:
- Existing tools/data:
- Frequency:
- Time or cost:
- Failure consequence:
- Problem rank: top 1 | top 2 | top 3 | below top 3 | no problem
- Origin gap emerged before solution reveal: yes | no
- Manual workaround shown or described: yes | no

## Constraints

- Transaction-building path owned by participant:
- Signer/wallet/backend path:
- Representative target class:
- Sender/value-dependent behavior:
- Strict/custom calldata concerns:
- Public declaration useful despite spoofability: yes | no | uncertain
- Reason:

## After solution reveal

- Fit reaction in participant's words:
- Main objection:
- Evidence needed:
- Technical pilot commitment: yes | no | conditional
- Condition or next step:

## Research classification

- Supports H1 | weakens H1 | neutral
- Counts as qualified interview: yes | no
- Counts as pilot agreement: yes | no
- Reviewer initials or anonymous role:
```

Do not enter a name, email, handle, wallet address, private repository link, customer
identifier, raw production calldata, key, seed, or authenticated endpoint in this note.
Keep contact details in the user's existing contact system, separate from research data.

## Consent record

Consent is granular. “The transaction is already public” does not permit linking it to
a team, interview, or quote.

```markdown
# Evidence consent

- Participant ID: P-YYYY-NN
- Consent captured at UTC time:
- Consent captured by: anonymous operator role
- May retain anonymized workflow notes: yes | no
- May publish aggregate answers: yes | no
- May publish an anonymized quote: yes | no
- May publish the exact approved quote below: yes | no
- May name the team: yes | no
- May display the team logo: yes | no
- May link public Fuji transaction hashes to the team: yes | no
- May link a public integration commit/repository: yes | no
- May publish integration time and blockers anonymously: yes | no
- May recontact about this pilot: yes | no
- Consent expiry or withdrawal route communicated: yes | no

Approved public quote, if any:
Approved public team spelling, if any:
Approved public URLs, if any:
Restrictions or expiry:
```

Default every unanswered item to `no`. If consent is withdrawn, remove offchain names,
quotes, logos, and links under project control. A public blockchain transaction cannot
be deleted; explain that before asking to link it.

## Technical evidence template

Use one record per attempt. Publish only fields allowed by the consent record.

```markdown
# Pilot attempt

- Participant ID: P-YYYY-NN
- Attempt ID:
- Started at UTC:
- Finished or stopped at UTC:
- First attempt completed without maintainer pairing: yes | no
- Maintainer help after first attempt, minutes:
- Engineering time, minutes:
- Result: matched | original selected | blocked | abandoned
- Failure or abandonment reason:

## Environment

- AVAX Impact commit:
- Node / npm / Foundry versions:
- Chain ID: 43113
- Integration path: app | wallet | bot | agent | backend
- Target class and public address, if consented:
- Builder code is a public declaration, not identity: acknowledged | not acknowledged
- Format: schema-1-fuji | schema-0-historical

## Preflight

- Original calldata hash:
- Attributed calldata hash:
- Selected calldata hash:
- Real from context supplied: yes | not relevant | no
- Real value context supplied: yes | not relevant | no
- `success`:
- Fallback error class:
- Selected equals attributed after success: yes | no | not applicable
- Selected equals original after failure: yes | no | not applicable
- Transaction sent after failed preflight: no | yes, stop and investigate

## Confirmation

- Transaction hash, only if consented:
- Receipt status:
- Block number:
- Decoder status: declared | unattributed | malformed
- Decoded schema ID:
- Decoded code:
- Decoded original equals recorded original: yes | no
- Independently decoded by anonymous role:

## Acceptance

- No target modification, routing proxy, custody, or wallet fork: yes | no
- Completed within one engineering day: yes | no
- Individual gate: pass | fail
- Main gap:
```

Hash calldata before storing evidence when raw payloads may expose application or user
information. Keep the raw bytes only as long as needed for the participant's private
verification. Public historical AVAX Impact fixtures are the exception because they are
already committed and contain no private user data.

## Post-pilot feedback form

Ask after the attempt, including failed attempts. Use a 1 to 5 scale where 1 means
strongly disagree and 5 means strongly agree.

1. I understood that attribution is a public declaration, not verified identity. `1-5`
2. I could complete the read-only rehearsal without maintainer help. `1-5`
3. The compatible versus fallback result was clear before any signing step. `1-5`
4. The integration fit my existing transaction path without a proxy or target change. `1-5`
5. I would use declared transaction origin in the reporting job discussed before the
   demo. `1-5`
6. How many engineering minutes did the first working attempt take?
7. Which code, wallet, signer, or target behavior created the most friction?
8. Did any preflight select the original calldata? If yes, which target class and error?
9. Did the confirmed calldata match the selected calldata byte-for-byte?
10. Could your analyst recover the origin without private session logs? Why or why not?
11. What would block continued Fuji use?
12. What would have to be true before you considered C-Chain mainnet use?
13. Should this product continue, narrow to safety/decoding, add a separately versioned
    identity mechanism, or stop? Why?

Do not average away hard failures. Report security violations, selected-payload
mismatches, target semantic changes, and transactions sent after failed preflight as
separate zero-tolerance findings.

## Evidence roll-up

Publish aggregates with denominators and missed thresholds:

```markdown
- Qualified discovery interviews: N / 10
- Origin gap emerged unprompted or workaround shown: N / qualified
- Ranked in top three: N / qualified
- Agreed to a technical pilot: N / qualified
- Independent first attempts: N
- Individual integrations passed: N / attempts
- Median and range of engineering minutes:
- Confirmed attributed Fuji transactions: N
- Baseline-verified original selections: N / preflights
- Silent selection mismatches: N
- Independent analyst reproduction: pass | fail | not attempted
- Schema 0 historical transactions: N
- Schema 1 Fuji transactions: N
- Negative interviews and abandoned attempts: N
- Main falsifying evidence:
```

Never count AVAX Impact maintainer transactions as external pilot volume. Never infer a
team identity from a code, owner address, payout address, or transaction sender.

## Related

- [Pilot fit, acceptance, and stop criteria](pilot-program.md)
- [Copy-paste Fuji technical flow](pilot-technical-flow.md)
- [Market validation hypotheses](market-validation.md)
- [Attribution trust boundary](attribution-format.md)
