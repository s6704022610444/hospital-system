# ADR 0004: Registrar Visit Printing — Routing Slip and Barcode Labels

- **Status:** Accepted
- **Date:** 2026-10-31
- **Context:** OPD Registration & Patient Identification
- **Primary Source Evidence:** OPD Card and appointment/referral forms in `documents/แบบฟอร์มใบต่างๆ/`

## Context & Problem Statement
After opening a Visit, registrar staff need to give the patient a document showing where to go and provide machine-readable identifiers for downstream care. A routing slip supports patient wayfinding and queue handling; barcode labels support accurate specimen and document identification. Printing only one of these leaves a gap in the registrar-to-clinic handoff.

## Decision Drivers
1. Give the patient a clear, printed destination and queue reference after a Visit is opened.
2. Reduce identification and specimen-labeling errors by printing labels tied to the correct patient and Visit.
3. Keep the routing slip and label printing available as distinct print actions so staff can reprint either as needed.

## Decision Outcome
Choose **Option B: support both outputs** after a Visit is successfully opened:

### 1. OPD Routing Slip / Queue Card
- Print a compact patient-facing slip (A5 or an appropriate receipt/slip size).
- Include patient name, HN, VN, destination clinic, queue number, Visit date/time, and basic wayfinding instructions.
- Include a barcode representing the appropriate patient/Visit identifier.

### 2. Barcode Label Set
- Provide a separate print action for a configurable set of small labels (initial default may be 6 labels; final count is a clinic configuration).
- Each label identifies the patient and the active Visit, including name, HN, VN, and barcode.
- Labels are intended for specimen tubes and associated request documents; they must not substitute for staff verification of patient identity and specimen at collection.
- Reprinting labels remains available from the Visit and should be visibly marked as a reprint where operationally appropriate.

## Consequences
- **Positive:** The patient receives wayfinding information and downstream staff can label specimens/documents consistently using Visit-linked identifiers.
- **Trade-offs:** Label dimensions and printer compatibility need configuration for the actual hardware at the hospital; avoid assuming one printer or label stock fits all stations.

## Open Implementation Detail
The exact label count, paper size, barcode symbology, and printer model are deployment/configuration details and should be confirmed against the hospital's physical printers and label stock before production use.
