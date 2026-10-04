# 인천공항 예상 승객 추이

React 19, TypeScript, Vite, Recharts로 만든 터미널별 24시간 예상 승객 차트입니다.

## 실행

1. `npm install`로 의존성을 설치합니다.
2. `.env.example`을 `.env`로 복사하고 API 주소와 인증키를 설정합니다.
3. `npm run dev`로 개발 서버를 실행합니다.

검증 명령: `npm run build`, `npm run lint`, `npm run test`.

## 코드 구조

| 경로 | 역할 |
| --- | --- |
| `src/App.tsx` | 헤더, 입력 폼, 조회 결과 연결 |
| `src/components/` | 화면 표시와 각 컴포넌트의 스타일 |
| `src/hooks/useAirportForecast.ts` | 조회 상태, 요청 취소, 오래된 응답 방지 |
| `src/hooks/useTheme.ts` | 테마 전환과 선택 저장 |
| `src/hooks/useMediaQuery.ts` | 반응형 화면 크기 구독 |
| `src/services/airportForecast.ts` | 입력 검증, API 요청, 응답 파싱과 오류 처리 |
| `src/config/airportApi.ts` | 환경변수에서 API 설정 읽기 |
| `src/types/` | 날짜·시간, 승객 데이터, 조회 상태와 테마 타입 |
| `src/utils/` | 한국 시간 처리, TOTAL 분리, 숫자 파싱과 24시간 터미널별 집계 |
| `tests/` | API 응답·오류 처리와 데이터 변환 테스트 |

입력값은 `DepartureForm`에서 관리하고, 조회가 끝난 날짜와 시간은 조회 상태에 저장합니다. 입력값을 편집해도 표시 중인 차트의 기준은 바뀌지 않습니다. `ForecastResults`는 성공한 조회에 대해서만 차트를 지연 로딩합니다.

`index.html`은 첫 화면이 그려지기 전에 저장된 테마를 복원합니다. 테마 색상은 `src/index.css`의 CSS 변수로 관리합니다.

## 템플릿 참고

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
