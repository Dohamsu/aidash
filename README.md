# AIDash

Claude Code, Codex, OpenCode 같은 AI coding CLI 사용량과 작업 성과를 추적하는 local-first CLI dashboard / 보조 라이브러리 프로토타입입니다.

## 현재 MVP

로컬 JSONL store 기반으로 사용량을 저장/조회하고, Claude Code print-mode JSON 출력에서 실제 token/cost를 캡처합니다.

```bash
pnpm install
pnpm build

# 로컬 store 초기화
node dist/cli.js init

# Claude Code를 감싸서 실행하면 실제 usage/cost를 저장
node dist/cli.js run claude -p "Reply with OK only" --output-format json --max-turns 1

# 현재 프로젝트 사용량 조회
node dist/cli.js usage --style dashboard
node dist/cli.js usage --style compact --no-color
node dist/cli.js usage --sessions --no-color    # 세션별 토큰 비율 프로그레스바
node dist/cli.js usage --json

# 수동 기록도 가능
node dist/cli.js record --agent Claude --tokens 12345 --cost 0.12 --topic bugfix
# Claude Code transcript history backfill (dry-run first)
node dist/cli.js import claude-history --dry-run
node dist/cli.js import claude-history

# Import one completed Claude Code transcript (used by hooks)
printf '{"transcript_path":"/path/to/session.jsonl"}' | node dist/cli.js import-claude-session

# Current / live Claude Code transcript usage
node dist/cli.js claude-current
node dist/cli.js claude-current --compact      # /au-style compact output with progress bar
node dist/cli.js claude-current --watch --interval 2
node dist/cli.js claude-current --json

# Diagnose Claude integration
node dist/cli.js doctor claude --cli-path /absolute/path/to/dist/cli.js

# Background snapshot daemon (macOS launchd periodic one-shot)
node dist/cli.js install-claude-current-agent --dry-run --cli-path /absolute/path/to/dist/cli.js --interval 5
node dist/cli.js install-claude-current-agent --cli-path /absolute/path/to/dist/cli.js --interval 5
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.aidash.claude-current.plist
launchctl kickstart -k gui/$(id -u)/com.aidash.claude-current
node dist/cli.js claude-current-daemon --once

# Install integrations (dry-run first)
node dist/cli.js install shell --dry-run       # zsh function: claude -> aidash run claude
node dist/cli.js install-claude --dry-run --cli-path /absolute/path/to/dist/cli.js # Stop hook + /aiusage + /au
node dist/cli.js install-claude-hook --dry-run # Claude Stop hook only
node dist/cli.js install-claude-aiusage --dry-run --cli-path /absolute/path/to/dist/cli.js # slash commands only

# Enable them when ready
node dist/cli.js install shell
node dist/cli.js install-claude --cli-path /absolute/path/to/dist/cli.js
```

개발 중 demo UI 확인:

```bash
pnpm dev usage --demo --style dashboard --no-color
pnpm dev usage --demo --style compact --no-color
pnpm dev usage --sessions --no-color
pnpm dev usage --demo --style plain --no-color
pnpm dev usage --demo --json
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
