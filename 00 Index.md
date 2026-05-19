# AI CLI AgentOps — Index

생성일: 2026-05-19

## 목적

Claude Code, Codex, OpenCode 등 CLI 기반 AI coding 도구의 사용 로그를 수집해 **프로젝트 / 토픽 / 토큰 / 비용 / 작업 결과** 단위로 보여주는 local-first 대시보드 제품을 설계한다.

## 핵심 질문

- 어떤 프로젝트에 AI 토큰을 얼마나 쓰고 있는가?
- 어떤 작업 유형에 비용과 시간이 많이 들어가는가?
- AI CLI 사용이 실제 결과물, 커밋, 테스트, PR로 어떻게 이어졌는가?
- 개인 개발자/팀이 신뢰할 수 있는 local-first AgentOps 도구가 될 수 있는가?

## 노트 구조

- [[10 Product Brainstorm]] — 제품 정의, 사용자, 차별화
- [[20 MVP Scope]] — 1차 버전 범위
- [[30 Data Model]] — SQLite/이벤트 모델
- [[40 Capture Strategy]] — Claude Code/Codex/OpenCode 로그 수집 전략
- [[50 Dashboard IA]] — 대시보드 정보 구조
- [[60 Open Questions]] — 결정 필요 항목

## 현재 가설

> 단순 토큰 사용량 추적기가 아니라, AI CLI 기반 개발 작업을 관측하고 회고할 수 있는 **local-first AgentOps dashboard**로 포지셔닝한다.

