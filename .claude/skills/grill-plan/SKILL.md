---
name: grill-plan
description: 実装計画フェーズ。grillingで要件を詰め、SPEC.mdとTASKS.mdを更新する。実装はしない。
argument-hint: "[実装したい機能の概要]"
model: claude-opus-4-8
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, WebSearch
---

以下について `/grilling` セッションを行い、一問一答で要件と設計判断を詰めてください。

$ARGUMENTS

共有理解に達したら、以下を更新してください:

- `SPEC.md`: 何を・なぜ作るか、インターフェース/仕様
- `TASKS.md`: 実装を細かいタスクに分解したチェックリスト

実装（コードの記述）はまだ行わないでください。
