# Dashboard IA

## Overview

- 오늘 사용 토큰
- 이번 주 사용 토큰
- 예상 비용
- 세션 수
- 가장 많이 사용한 프로젝트
- 가장 많이 사용한 agent

## Projects

프로젝트별 카드:
- 총 세션
- 총 토큰/비용
- 최근 작업 요약
- 주요 topic
- 최근 변경 파일
- 연결된 commit

## Sessions

세션 리스트:
- 시간
- project
- agent
- topic
- duration
- tokens/cost
- status
- summary

세션 상세:
- timeline
- command
- git diff summary
- file changes
- test/build result
- raw logs 링크 또는 preview

## Topics

- feature
- bugfix
- refactor
- test
- docs
- research
- planning
- review
- ops

각 topic별:
- 토큰
- 비용
- 프로젝트 분포
- 성공/실패 세션

## Insights

예시 문장:

- 이번 주 토큰의 62%가 Graymar 디버깅에 사용됨
- Codex는 구현 세션이 많고 Claude Code는 계획/리뷰 세션이 많음
- 실패한 테스트 루프에서 비용이 크게 발생함
- 문서화보다 버그 수정에 3.4배 많은 토큰을 사용함

## UI 톤

- 개발자 도구 느낌
- 로컬/보안 신뢰감
- Linear + Vercel + Datadog 중간 톤
- 숫자보다 작업 맥락을 강조

