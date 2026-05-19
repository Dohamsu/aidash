# Text Dashboard and ASCII UI

## 목표

웹 대시보드 없이도 CLI 안에서 “대시보드처럼 보이는” 텍스트/ASCII/Unicode 그래픽을 제공한다.

Claude Code 안에서:

```text
/aidash-usage
```

일반 터미널에서:

```bash
aidash usage
aidash usage --project graymar
aidash usage --today
```

## 가능 여부

충분히 가능하다. Node.js CLI에서 다음을 조합하면 된다.

- ANSI color
- Unicode box drawing
- braille/sparkline charts
- progress bars
- stacked bars
- tree/list UI
- terminal width 감지
- plain fallback

## 추천 라이브러리

### 기본 출력

- `chalk` 또는 `kleur`: 색상
- `picocolors`: 더 가벼운 색상
- `cli-table3`: 테이블
- `boxen`: 박스/패널
- `figures`: cross-platform symbols
- `string-width`: 한글/이모지 폭 계산
- `wrap-ansi`: 줄바꿈
- `supports-color`: 컬러 지원 감지

### 그래프/차트

- `asciichart`: 라인 차트
- `sparkly` 또는 직접 구현: sparkline
- `cli-progress`: progress bar
- 직접 구현: horizontal bar, stacked bar

### 대화형/고급 TUI는 후순위

- `ink`: React 기반 CLI UI
- `blessed`/`neo-blessed`: full-screen TUI

MVP는 non-interactive text dashboard로 충분하다.

## 출력 모드

```bash
aidash usage --style compact
aidash usage --style dashboard
aidash usage --style plain
aidash usage --no-color
aidash usage --json
```

- `dashboard`: 기본. 박스/그래프/색상 포함
- `compact`: 작은 터미널/Claude 출력용
- `plain`: 로그/CI/마크다운용
- `json`: 다른 도구 연동용

## Claude Code 안에서의 주의점

Claude가 ANSI 컬러를 그대로 보여줄 수도 있고 제거할 수도 있다. 따라서 `/aidash-usage`는 기본적으로 ANSI 없는 Unicode dashboard를 쓰는 편이 안전하다.

추천:

```bash
aidash usage --style compact --no-color
```

일반 터미널에서는 컬러 ON.

```bash
aidash usage --style dashboard
```

## 대시보드 예시 1 — compact

```text
╭─ AIDash · Today · graymar ─────────────────────╮
│ Sessions  7       Tokens 184.2k       Cost $0.92│
│ Agent     Claude 142.1k  ███████████░ 77%       │
│           Codex   42.1k  ███░░░░░░░░░ 23%       │
├─ Topics ────────────────────────────────────────┤
│ bugfix        73.4k  ████████░░░ 40%            │
│ playtest      41.2k  ████░░░░░░░ 22%            │
│ refactor      39.9k  ████░░░░░░░ 21%            │
│ docs          29.7k  ███░░░░░░░░ 16%            │
├─ Recent ────────────────────────────────────────┤
│ 14:10 Claude  combat loop bugfix      51k  38m  │
│ 12:30 Codex   UI cleanup              23k  18m  │
│ 10:15 Claude  browser playtest        62k  44m  │
╰─────────────────────────────────────────────────╯
```

## 대시보드 예시 2 — project comparison

```text
AIDash — This Week

Projects
graymar           412k  ████████████████████  61%
ai-cli-agentops   154k  ███████░░░░░░░░░░░░░  23%
blog-automation    63k  ███░░░░░░░░░░░░░░░░░   9%
resume-tools       45k  ██░░░░░░░░░░░░░░░░░░   7%

Trend
Mon ▁▂▆█▅▃▂  98k
Tue ▁▃▇█▆▂▁  141k
Wed ▁▁▂▅█▇▃  112k
```

## 대시보드 예시 3 — session detail

```text
╭─ Session 2026-05-19 14:10 ─────────────────────╮
│ Project   graymar                               │
│ Agent     Claude Code                           │
│ Topic     bugfix / gameplay                     │
│ Duration  38m 12s                               │
│ Tokens    51,240 actual                         │
│ Cost      $0.26                                 │
├─ Git ───────────────────────────────────────────┤
│ Branch    main                                  │
│ Files     8 modified, +214 -87                  │
│ Tests     pnpm test: passed                     │
├─ Summary ───────────────────────────────────────┤
│ Fixed combat turn desync and verified browser   │
│ playtest flow.                                  │
╰─────────────────────────────────────────────────╯
```

## 구현 포인트

### 1. Terminal width 대응

```ts
const width = process.stdout.columns ?? 80;
```

- 80 columns 기준 기본
- 60 미만이면 compact
- CI나 non-TTY면 plain

### 2. 한글 폭 처리

한글/이모지가 있으면 단순 `str.length`로 박스 정렬이 깨진다.

필수:
- `string-width`
- `slice-ansi`
- `wrap-ansi`

### 3. 컬러 감지

- TTY + supports-color면 컬러
- `--no-color`면 제거
- Claude command에서는 no-color 기본 추천

### 4. 그래프는 직접 구현해도 충분

Progress bar:

```text
██████░░░░ 60%
```

Sparkline:

```text
▁▂▃▄▅▆▇█
```

Stacked bar:

```text
Claude ████████ Codex ███ Other ░
```

### 5. 출력과 데이터 분리

```ts
UsageSummary -> renderDashboard(summary, options)
```

- 데이터 계산과 렌더링 분리
- 나중에 JSON/Web/TUI 모두 재사용

## 설계 결정

MVP 기본값:

- 일반 터미널: `dashboard` + color
- Claude command: `compact` + no-color
- CI: `plain` + no-color
- JSON: `--json`

## 포트폴리오 포인트

단순 CLI 리포트가 아니라, 터미널 제약 안에서 정보 시각화/UX를 설계한 프로젝트로 보일 수 있다.

강조 가능한 역량:
- CLI UX
- terminal rendering
- data visualization
- local-first developer tools
- AI AgentOps observability
- 한글/Unicode 폭 처리 같은 디테일
