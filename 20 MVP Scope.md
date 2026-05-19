# MVP Scope

## MVP 목표

가장 먼저 검증할 가설:

> CLI wrapper 방식만으로도 AI coding 세션을 프로젝트/작업/토큰/결과 단위로 충분히 기록할 수 있는가?

## 1차 기능

### 1. CLI wrapper

```bash
aidash run claude
aidash run codex
aidash run opencode
```

기록 항목:
- 시작/종료 시각
- cwd
- git repo / branch / remote
- 실행 agent
- command
- exit code
- stdout/stderr 일부 또는 로그 경로
- 세션 길이

### 2. 프로젝트 감지

우선순위:
1. git remote repo name
2. package.json name
3. cwd folder name

### 3. 토큰/비용 추정

- 공식 usage 출력이 있으면 파싱
- 없으면 transcript/log 기반 추정
- 정확도 플래그: `actual`, `estimated`, `unknown`

### 4. Git 변경사항 연결

세션 전후로 다음 기록:
- changed files
- additions/deletions
- commit hash if created
- branch

### 5. 로컬 대시보드

```bash
aidash serve
```

화면:
- Overview
- Projects
- Sessions
- Topics
- Costs

## MVP에서 제외

- 팀 SaaS 계정/동기화
- 실시간 IDE extension
- 정확한 모든 provider별 과금 계산
- Claude/Codex 내부 비공개 API 의존
- 조직 단위 권한 관리

## 성공 기준

- 내 실제 프로젝트에서 1주일치 사용 기록을 자동 수집 가능
- 프로젝트별/agent별/작업유형별 사용량이 보임
- 세션별 “무슨 작업을 했는지”를 다시 읽을 수 있음
- 이력서/포트폴리오에 넣을 만큼 명확한 결과물 도출

