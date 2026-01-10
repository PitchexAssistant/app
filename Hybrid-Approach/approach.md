Hybrid Low-Latency Voice Intelligence Architecture
For PITCHEX: AI Pitching & Negotiation Coach
1. Objective

Design and implement a hybrid voice intelligence pipeline that delivers:

Low-latency, natural live conversation

High-accuracy, negotiation-aware reasoning

Investor-style feedback and objections

Scalable architecture for live and non-live sessions

The system must feel like speech-to-speech to the user while internally preserving text-based reasoning and control.

2. Core Problem Statement

The traditional pipeline:

Speech → STT → LLM → TTS


Introduces unavoidable latency due to:

Speech buffering

LLM reasoning time

TTS synthesis

Pure Speech-to-Speech (S2S) models reduce latency but:

Lack deep reasoning

Cannot enforce negotiation strategy

Cannot integrate tools (search, scoring, memory)

Are not reliable for coaching or evaluation

3. High-Level Solution: Hybrid Architecture

The solution is a dual-path hybrid pipeline:

Fast Reactive Path → handles immediacy and conversational flow

Smart Reasoning Path → handles negotiation logic, accuracy, and coaching

Both paths operate simultaneously on the same audio stream.

4. Architecture Overview
                ┌─────────────────────────┐
User Audio ───▶ │ Audio Stream (WebSocket)│
                └────────────┬────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
          ▼                                     ▼
FAST PATH (Reactive)                     SMART PATH (Reasoning)
────────────────────                     ──────────────────────
• Streaming / partial STT                • Full STT (sentence-level)
• Lightweight LLM or rules               • Negotiation-tuned LLM
• Immediate response                     • Strategy + memory + tools
• Backchannels / fillers                 • Investor objections
• < 300 ms latency                       • 700–1200 ms latency


The user hears one voice, but the intelligence is layered.

5. FAST PATH – Reactive Layer
5.1 Purpose

Eliminate perceived silence

Maintain conversational engagement

Control turn-taking

Mimic human listening behavior

5.2 Responsibilities

Detect partial speech segments

Generate short acknowledgements

Avoid strategic or factual claims

Never override the smart path

5.3 Input

Partial audio chunks (100–300 ms)

Partial STT tokens

5.4 Output Examples

Allowed outputs:

“Okay.”

“I see.”

“Go on.”

“Interesting.”

“Let me think.”

Disallowed outputs:

Advice

Objections

Feedback

Numbers or facts

5.5 Implementation Options

Option A: Rule-based

Based on silence duration

Based on speech length

Based on sentiment

Option B: Small LLM

Quantized small model

Prompt strictly limited to fillers

5.6 Constraints

Max response length: 3–5 words

Must stop speaking immediately when smart path response starts

6. SMART PATH – Reasoning Layer
6.1 Purpose

This is the core intelligence of PITCHEX.

Negotiation reasoning

Investor simulation

Feedback generation

Persuasion scoring

Strategy evaluation

6.2 Responsibilities

Wait for complete utterance

Perform deep reasoning

Maintain session memory

Integrate external tools

Generate high-quality responses

6.3 Input

Full STT transcript

Conversation context

Session metadata (role, difficulty, scenario)

6.4 Processing Steps

Clean transcription

Context assembly

Negotiation stage detection

Strategy evaluation

Response generation

Optional tool calls

Streaming TTS output

7. Tool Integration (Tavily, Scoring, Analytics)
7.1 When to Use Tavily

Allowed:

Post-claim verification

Market size validation

Industry benchmarking

After-session feedback

Not allowed:

Mid-sentence reactions

Live backchanneling

7.2 Example Tool Usage
User claim → LLM uncertainty detected → Tavily lookup →
Delayed correction or follow-up question

8. Voice Output Strategy
8.1 Single Voice Illusion

Even though two paths exist:

Only one voice is audible

Smart path always has priority

Fast path is interrupted immediately when needed

8.2 Streaming TTS

Smart path responses must stream

No full buffering before playback

Prosody optimized for investor tone

9. Session Types
9.1 Live Session (Hybrid Enabled)

Fast path: ON

Smart path: ON

Tavily: LIMITED

Goal: realism + flow

9.2 Simple / Practice Session

Fast path: OFF

Smart path: ON

Tavily: FULL

Goal: learning + analysis

10. Latency Targets
Component	Target
Fast Path Response	< 300 ms
Smart Path Start	< 1.2 s
Perceived Silence	~0 ms
End-to-End Feel	Human-like
11. Model Strategy
11.1 STT

Streaming-capable

Partial token emission

Low-latency decoding

11.2 Fast LLM

Small

Quantized

No tools

Prompt strictly constrained

11.3 Smart LLM

Large

Negotiation-tuned

Tool-enabled

Memory-aware

12. Safety & Control Rules

Fast path cannot:

Give advice

Ask strategic questions

Challenge the user

Smart path:

Always overrides

Owns factual correctness

Owns coaching authority

13. Why This Architecture Was Chosen
Approach	Verdict
Pure STT → LLM → TTS	Too slow
Pure Speech-to-Speech	Too shallow
Hybrid (this)	✅ Optimal

This approach balances:

Latency

Accuracy

Control

Scalability