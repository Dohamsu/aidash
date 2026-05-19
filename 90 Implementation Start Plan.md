# Implementation Start Plan

## 추천 시작점

웹 대시보드나 Claude plugin부터 만들지 말고, **텍스트 대시보드가 나오는 npm CLI**부터 만든다.

첫 목표:

```bash
npm i -g aidash
aidash init
aidash usage --demo
```

위 명령이 실제 SQLite 없이도 예쁜 CLI 대시보드를 출력하면 1차 UX 검증이 가능하다.

## 구현 순서

### Phase 0 — Repo bootstrap

목표: TypeScript CLI 프로젝트 생성.

구성:

```text
ai-cli-agentops/
  package.json
  tsconfig.json
  src/
    cli.ts
    commands/
    render/
    core/
  tests/
```

추천 스택:

- TypeScript
- `tsx` for dev
- `tsup` for build
- `vitest` for tests
- `commander` or `cac` for CLI
- `picocolors` or `chalk` for colors
- `string-width`, `wrap-ansi`, `strip-ansi` for terminal rendering

### Phase 1 — Text dashboard renderer first

목표: 데이터 수집 없이 demo data로 CLI 대시보드 출력.

명령:

```bash
aidash usage --demo
aidash usage --demo --style compact
aidash usage --demo --style plain
aidash usage --demo --json
```

이유:

- 제품의 핵심 경험을 가장 빨리 검증
- Claude Code 안에서 `/aidash-usage`로 어떤 느낌인지 먼저 확인 가능
- DB/수집/로그 파싱보다 UX 리스크를 먼저 제거

### Phase 2 — SQLite 저장소

목표: 세션 데이터를 로컬 DB에 저장하고 조회.

명령:

```bash
aidash init
aidash record --agent claude --project graymar --tokens 12345 --cost 0.12
aidash usage
```

저장 위치:

```text
~/.aidash/aidash.sqlite
```

MVP 테이블:

- projects
- sessions
- file_changes

### Phase 3 — Process wrapper

목표: 실제 명령 실행을 감싸서 자동 기록.

명령:

```bash
aidash run -- claude -p "hello" --output-format json
aidash run -- codex exec "hello"
```

수집:

- started_at / ended_at
- cwd
- git repo/branch
- command
- exit_code
- stdout/stderr 일부
- duration

### Phase 4 — Claude JSON parser

목표: Claude print mode JSON에서 실제 usage/cost 추출.

대상 필드:

- session_id
- duration_ms
- total_cost_usd
- usage
- modelUsage
- num_turns

### Phase 5 — Claude slash command installer

목표: Claude Code 안에서 텍스트 대시보드 호출.

명령:

```bash
aidash install claude-command
```

생성 파일:

```text
~/.claude/commands/aidash-usage.md
```

내용:

```md
Run `aidash usage --style compact --no-color --cwd "$PWD"` and show the output exactly.
Do not summarize unless the command fails.
```

### Phase 6 — Shell alias installer

목표: 사용자가 평소처럼 `claude`, `codex`를 쳐도 자동 기록.

명령:

```bash
aidash install shell --dry-run
aidash install shell
aidash uninstall shell
```

zshrc에 삽입:

```bash
# aidash start
alias claude="aidash run -- claude"
alias codex="aidash run -- codex"
# aidash end
```

## 가장 먼저 만들 파일

```text
src/cli.ts
src/commands/usage.ts
src/render/dashboard.ts
src/render/bar.ts
src/render/box.ts
src/core/demo-data.ts
```

## 첫 번째 acceptance criteria

```bash
pnpm dev usage --demo
```

출력에 포함되어야 함:

- AIDash title
- total tokens
- cost
- by agent bar chart
- by topic bar chart
- recent sessions

## 두 번째 acceptance criteria

```bash
pnpm dev usage --demo --style compact --no-color
```

Claude Code 안에서 깨지지 않는 no-color 텍스트 대시보드 출력.

## 세 번째 acceptance criteria

```bash
pnpm test
```

테스트:

- bar width 계산
- percent 계산
- 한글/ANSI width 정렬
- compact/plain/dashboard render snapshot

## MVP 원칙

- 웹 UI 금지: 텍스트 대시보드 먼저
- Claude plugin 금지: custom command 먼저
- Codex deep integration 금지: wrapper 먼저
- token 정확도 집착 금지: `actual | estimated | unknown` 표시
- 데이터 원문 저장 기본 off

