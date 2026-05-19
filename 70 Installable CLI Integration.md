# Installable CLI Integration

## 목표

npm/GitHub에 배포 가능한 설치형 CLI로 제공한다.

```bash
npm i -g aidash
# or
npx aidash init
```

사용자는 Claude Code/Codex 같은 CLI 환경에서 별도 웹 대시보드 없이도 텍스트 대시보드를 볼 수 있어야 한다.

```bash
aidash usage
# Claude Code 안에서는 /aidash:usage 또는 커스텀 slash command로 호출
```

## 중요한 제약

Claude Code에는 이미 built-in `/usage`가 있다. 따라서 정확히 `/usage`를 우리가 덮어쓰는 것은 충돌 가능성이 크다.
현실적인 명령은 다음 중 하나다.

- `/aidash:usage` — Claude plugin/skill namespace 방식
- `/token-usage` — 사용자 custom command
- `!aidash usage` — Claude shell mode에서 직접 실행
- 일반 터미널에서 `aidash usage`

## 통합 레벨

### Level 1: Standalone CLI

가장 먼저 구현.

```bash
aidash run -- claude
aidash run -- codex
aidash usage
aidash usage --project current
aidash usage --today
aidash sessions
```

장점:
- 모든 AI CLI에 동일하게 적용
- npm 배포가 쉬움
- Claude/Codex 내부 변화에 덜 민감

### Level 2: Shell alias/wrapper installer

```bash
aidash install shell
```

zshrc/bashrc에 다음 식으로 추가:

```bash
alias claude="aidash run -- claude"
alias codex="aidash run -- codex"
```

주의:
- 기존 command shadowing 위험
- `aidash uninstall shell` 제공 필요
- dry-run 출력 필요

### Level 3: Claude Code integration

```bash
aidash install claude
```

설치 작업:
- `~/.claude/commands/aidash-usage.md` 또는 plugin skill 생성
- optional Claude hooks 설정
- optional MCP server 등록

#### Custom slash command 방식

`~/.claude/commands/aidash-usage.md` 내용 예시:

```md
Run `aidash usage --cwd "$PWD" --format text` and show the output exactly.
If the command fails, explain the error briefly.
```

Claude 안에서:

```text
/aidash-usage
```

#### Plugin 방식

Claude plugin 구조:

```text
.claude-plugin/plugin.json
skills/usage/SKILL.md
.mcp.json
package.json
server.ts
```

- skill: `/aidash:usage` 식으로 호출되는 문서/명령 안내
- MCP server: `get_usage_dashboard`, `list_sessions`, `record_event` 도구 제공
- Claude가 Bash 대신 MCP tool을 호출해 로컬 SQLite 내용을 읽고 텍스트 대시보드를 반환

### Level 4: Claude hooks

Claude Code hooks로 자동 수집.

가능 이벤트:
- `SessionStart`
- `UserPromptSubmit`
- `PreToolUse`
- `PostToolUse`
- `Stop`
- `PreCompact`

설정 예시:

```json
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "aidash hook claude session-start" }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "aidash hook claude prompt" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "aidash hook claude stop" }] }]
  }
}
```

장점:
- wrapper 없이도 Claude Code 세션 이벤트를 수집 가능
- 사용자가 평소처럼 `claude` 실행 가능

주의:
- hook payload/env 포맷 검증 필요
- 모든 세션에 hook이 추가되므로 성능/안정성 중요

### Level 5: Codex integration

Codex는 우선 wrapper 중심.

```bash
aidash run -- codex
```

추후:
- Codex MCP server 등록
- Codex plugin marketplace 구조 조사
- Codex TUI에서 custom command 가능 여부 확인

## 추천 MVP 순서

1. `aidash usage` 텍스트 대시보드
2. `aidash run -- <command>` wrapper
3. SQLite 저장
4. Claude Code `--output-format json` 결과 파싱
5. `aidash install claude-command`로 `/aidash-usage` 제공
6. Claude hook 자동 수집
7. Claude plugin + MCP server
8. Codex 확장

## 텍스트 대시보드 예시

```text
AIDash — Today
Project: graymar

Tokens
- total: 184,230
- input: 131,020
- output: 53,210
- estimated cost: $0.92

By Agent
- Claude Code: 142,100 tokens / $0.71
- Codex: 42,130 tokens / $0.21

By Topic
- bugfix: 73,400
- playtest: 41,200
- refactor: 39,900
- docs: 29,730

Recent Sessions
1. 14:10 Claude Code — combat loop bugfix — 38m — 51k tokens
2. 12:30 Codex — UI cleanup — 18m — 23k tokens
3. 10:15 Claude Code — browser playtest — 44m — 62k tokens
```

## 핵심 결론

- npm 설치형 CLI는 충분히 가능하다.
- Claude 내부 `/usage`를 정확히 대체하기보다는 `/aidash:usage` 또는 `/aidash-usage`가 현실적이다.
- 자동 수집은 처음에는 wrapper, 이후 Claude hooks/plugin/MCP로 고도화한다.
- Codex는 우선 wrapper 중심으로 지원하고, plugin/command는 후순위로 조사한다.
