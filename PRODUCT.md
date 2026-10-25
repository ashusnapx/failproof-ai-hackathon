# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (shown live on a projector at a hackathon demo table, 1280–1920 px wide)

## Stack

Next.js (App Router, TypeScript, Tailwind) in `web/`, user's choice. Backend logic lives in route handlers that spawn the agent and tail `treasury/state/*`.

## Users

Hackathon judges at Hacktober Hack (Failproof AI × Quad AI, HSR Layout, Bengaluru, 25 Oct 2026), watching a 2-minute live demo from a few metres away, and the Failproof AI founders who built the guardrail product. Secondary: finance/ops leads at Indian startups who would let an AI agent run accounts payable.

## Product Purpose

"Who Said So?" shows an AI accounts-payable agent for Dosa Labs Pvt Ltd (27th Main Rd, Sector 1, HSR Layout) paying vendor invoices over UPI, while Failproof AI policies check every payout: money may only move when a human authorized it in words. Emails, invoices and vendor APIs reach the agent as tool output and never count as authorization.

## Positioning

Not another guardrail dashboard: every rupee carries provenance, the human sentence that allowed it, or the untrusted email that tried to sneak it in.

## Operating Context

Live, real-time: one run takes about 25 seconds. Two runs per demo: Observe (watch only, the fake "UPI ID changed" email drains ₹48,399) then Enforce (the same payout blocked, real vendors paid). Viewers must read the outcome at a glance.

## Capabilities and Constraints

- Real Claude Code agent (haiku), real Failproof AI hooks; payments go to a mock UPI rail, not a bank.
- Policies: payee must be in the vendor master; total spend must stay inside the budget the human typed (₹2,00,000).
- Under 70 minutes to code freeze when this was written; prototype fidelity.

## Brand Commitments

Indian and Bengaluru-specific: ₹ with lakh formatting (₹1,24,500.00), UPI IDs, Karnataka GSTINs (29…), HSR Layout / Koramangala / Silk Board places. Fictional company and vendors; no real brands.

## Evidence on Hand

Live run results (25 Oct 2026): Observe, agent paid ₹48,399.00 to nammacloud.collect@ybl; Enforce, blocked with provenance accounts@nammacloud-payments.in, Silk Board ₹1,24,500 and Filter Kaapi ₹6,800 paid. Incidents: Lobstar Wilde agent sent 52.4M tokens instead of 52,439 (Feb 2026); prompt injection moved ~$155K via Grok/Bankrbot (May 2026).

## Product Principles

- The verdict and its reason are the hero; logs are supporting cast.
- Provenance is always visible: who said so.
- Blocked must look decisively different from allowed and from "money lost".

## Accessibility & Inclusion

Projector legibility: large type, high contrast, colour never the only signal (labels + icons on every verdict).
