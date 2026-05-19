# AIDash

Claude Code, Codex, OpenCode 같은 AI coding CLI 사용량과 작업 성과를 추적하는 local-first CLI dashboard / 보조 라이브러리 프로토타입입니다.

## 현재 MVP

데이터 수집/SQLite 이전 단계로, demo data 기반 텍스트 대시보드를 먼저 구현했습니다.

```bash
pnpm install
pnpm dev usage --demo --style dashboard --no-color
pnpm dev usage --demo --style compact --no-color
pnpm dev usage --demo --style plain --no-color
pnpm dev usage --demo --json
```

빌드 후 실행:

```bash
pnpm build
node dist/cli.js usage --demo --style compact --no-color
```

검증:

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Obsidian 설계 노트

- 시작 노트: [[00 Index]]
- 제품 브레인스토밍: [[10 Product Brainstorm]]
- MVP 설계: [[20 MVP Scope]]
- 데이터 모델: [[30 Data Model]]
- 수집 전략: [[40 Capture Strategy]]
- 설치형 CLI 통합: [[70 Installable CLI Integration]]
- 텍스트/ASCII UI: [[80 Text Dashboard and ASCII UI]]
- 구현 시작 계획: [[90 Implementation Start Plan]]
