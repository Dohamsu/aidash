# Data Model

## 원칙

- SQLite local-first
- 세션 단위 원본 이벤트 보존
- 민감 정보는 기본 저장 제외 또는 마스킹
- 나중에 sync/SaaS로 확장 가능하게 ID 구조 유지

## 주요 테이블 초안

### projects

- id
- name
- root_path
- git_remote
- created_at
- updated_at

### sessions

- id
- project_id
- agent: claude | codex | opencode | custom
- command
- cwd
- git_branch
- started_at
- ended_at
- duration_ms
- exit_code
- status: running | completed | failed | interrupted
- input_tokens
- output_tokens
- total_tokens
- token_source: actual | estimated | unknown
- estimated_cost
- model
- summary
- created_at

### session_events

- id
- session_id
- type: stdout | stderr | tool_call | file_change | test_run | cost_update | note
- timestamp
- payload_json

### file_changes

- id
- session_id
- file_path
- change_type: added | modified | deleted | renamed
- additions
- deletions

### topics

- id
- name
- category: feature | bugfix | refactor | test | docs | research | planning | review | ops

### session_topics

- session_id
- topic_id
- confidence
- source: manual | rule | llm

### costs

- id
- session_id
- provider
- model
- input_tokens
- output_tokens
- price_input_per_million
- price_output_per_million
- estimated_cost

## 추후 고려

- prompts/messages 원문 저장 여부
- redaction policy
- workspace-level aggregation
- 팀/사용자 테이블
- external links: GitHub PR, Linear issue, Jira ticket

