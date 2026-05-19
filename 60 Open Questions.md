# Open Questions

## 제품 결정

- 이름은 무엇으로 할 것인가?
- 개인용 local-first에 집중할 것인가, 팀 SaaS 가능성을 초반부터 열어둘 것인가?
- 주요 타깃은 개인 개발자인가, AI-heavy 팀인가?

## 기술 결정

- CLI는 Node.js/TypeScript로 갈 것인가?
- Dashboard는 Next.js로 갈 것인가, Tauri/Electron desktop으로 갈 것인가?
- SQLite 라이브러리는 `better-sqlite3` vs `libsql` 중 무엇이 적합한가?
- token estimate는 `tiktoken` 계열을 쓸 것인가, provider별 tokenizer를 나눌 것인가?

## 수집 결정

- Claude Code/Codex 로그 위치와 포맷을 어디까지 지원할 것인가?
- stdout/stderr를 저장할 것인가, 요약만 저장할 것인가?
- prompts/messages 원문 저장은 opt-in으로 할 것인가?

## UX 결정

- 사용자는 매번 `aidash run -- claude`로 실행해야 하는가?
- alias 자동 설치를 지원할 것인가?
- 세션 종료 후 topic/summary 수정을 CLI에서 받을 것인가?
- 대시보드는 read-only로 시작할 것인가, session annotation까지 지원할 것인가?

## 포트폴리오 관점

- 이 프로젝트를 Frontend 포트폴리오로 보이게 할 핵심 화면은 무엇인가?
- Agentic AI/FDE 포트폴리오로 보이게 할 핵심 기능은 무엇인가?

