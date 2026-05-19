# Capture Strategy

## 기본 전략

초기에는 각 AI CLI의 내부 포맷에 직접 의존하지 않고, wrapper로 실행을 감싼다.

```bash
aidash run -- claude
aidash run -- codex
aidash run -- opencode
```

또는 alias:

```bash
alias claude="aidash run -- claude"
alias codex="aidash run -- codex"
```

## 수집 계층

### 1. Process wrapper

수집 가능:
- 시작/종료 시각
- cwd
- command args
- exit code
- stdout/stderr stream
- duration

장점:
- 도구별 내부 구현 변화에 강함
- Claude/Codex/OpenCode/custom CLI 모두 지원 가능

리스크:
- 토큰 사용량이 stdout에 없으면 정확히 알기 어려움

### 2. Known log parser

도구별 로컬 로그가 확인되면 optional parser 제공.

예상 대상:
- Claude Code transcript/log
- Codex session log
- OpenCode log
- Hermes session log

원칙:
- parser 실패해도 세션 기록은 유지
- parser는 plugin 형태

### 3. Git snapshot

세션 전후로 기록:

```bash
git status --porcelain
git diff --numstat
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
```

세션 후 커밋이 생겼으면 연결.

### 4. Topic inference

초기:
- command text
- git diff file paths
- stdout keywords
- user-provided tag

나중:
- LLM summary/classification optional

## 민감 정보 처리

- `.env`, secrets, token, key 패턴 마스킹
- 원문 transcript 저장은 opt-in
- 기본은 metadata 중심 저장
- 로컬 DB는 사용자가 직접 소유

## 결정 필요

- stdout/stderr 원문을 어디까지 저장할 것인가?
- token estimate는 어떤 tokenizer를 쓸 것인가?
- Claude/Codex별 실제 usage 추출 가능 위치는 어디인가?

