# Patienty Render 배포 가이드

이 문서는 **Patienty (Next.js 프론트엔드 + Spring Boot 백엔드 + PostgreSQL 데이터베이스)**를 클라우드 플랫폼 [Render](https://render.com)에 안정적으로 배포하고 `.env` 환경변수를 연동하는 전체 과정을 설명합니다.

---

## 1. 사전 준비 사항

1. [Render](https://render.com) 계정 가입 및 로그인
2. Patienty 저장소를 GitHub에 푸시 (본 브랜치 `feature/render-deployment` 또는 `main`)
3. OpenRouter API Key 준비 (`.env`의 `OPENROUTER_API_KEY`)

---

## 2. 배포 방식 1: Render Blueprint (원클릭 자동 배포, 권장)

저장소 루트에 포함된 `render.yaml` 파일을 사용하여 데이터베이스, 백엔드, 프론트엔드를 한 번에 배포하는 방식입니다.

### 배포 절차

1. **Render 대시보드 접속**: [dashboard.render.com](https://dashboard.render.com)
2. **New 버튼 클릭 -> [Blueprints] 선택**
3. **Patienty GitHub 저장소 연결**
4. **Blueprint 설정 확인**:
   - `patienty-db` (PostgreSQL)
   - `patienty-backend` (Spring Boot Web Service)
   - `patienty-frontend` (Next.js Web Service)
5. **환경변수 입력**:
   - `OPENROUTER_API_KEY`: 보유하신 OpenRouter API 키 입력
   - (선택) 프론트엔드 도메인이 확정되면 백엔드의 `PATIENTY_CORS_ALLOWED_ORIGINS`에 해당 도메인 입력 (기본값: `https://patienty-frontend.onrender.com,http://localhost:3000`)
6. **[Apply] 버튼 클릭**: 3개 서비스가 순차적으로 빌드 및 배포됩니다.

---

## 3. 배포 방식 2: Render 대시보드 수동 배포

각 서비스를 개별적으로 생성하여 연결하는 방식입니다.

### Step 1: PostgreSQL 데이터베이스 생성
1. Render 대시보드 -> **New -> PostgreSQL**
2. 설정값:
   - **Name**: `patienty-db`
   - **Database**: `patienty`
   - **User**: `patienty`
   - **Region**: `Oregon (US West)` (또는 프론트/백과 동일한 리전)
   - **Plan**: `Free`
3. 생성 완료 후 **Internal Database URL** 및 **Password** 복사

### Step 2: 백엔드 Web Service 생성
1. Render 대시보드 -> **New -> Web Service**
2. Patienty 저장소 선택
3. 설정값:
   - **Name**: `patienty-backend`
   - **Language / Runtime**: `Docker`
   - **Docker Context**: `./backend`
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Plan**: `Free`
   - **Health Check Path**: `/actuator/health`
4. **Environment Variables (환경 변수)** 추가:
   | Key | Value | 설명 |
   | :--- | :--- | :--- |
   | `SPRING_PROFILES_ACTIVE` | `prod,demo` | 프로덕션 + 시드 데모 데이터 활성화 |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<DB_HOST>:5432/patienty` | Step 1 DB의 Internal Database URL 또는 JDBC URL |
   | `SPRING_DATASOURCE_USERNAME` | `patienty` | Step 1 DB User |
   | `SPRING_DATASOURCE_PASSWORD` | `<DB_PASSWORD>` | Step 1 DB Password |
   | `OPENROUTER_API_KEY` | `<YOUR_OPENROUTER_KEY>` | .env의 OpenRouter API Key |
   | `PATIENTY_AI_PROVIDER` | `openrouter` | AI 공급자 |
   | `PATIENTY_AI_OPENROUTER_MODEL` | `google/gemini-2.0-flash-001` | 사용할 LLM 모델명 |
   | `PATIENTY_CORS_ALLOWED_ORIGINS` | `https://<프론트엔드_도메인>.onrender.com` | 프론트엔드 CORS 허용 도메인 |
   | `PATIENTY_SESSION_COOKIE_SECURE` | `true` | HTTPS 전송 쿠키 강제 |
   | `PATIENTY_SESSION_COOKIE_SAME_SITE` | `none` | Cross-site 쿠키 허용 |

### Step 3: 프론트엔드 Web Service 생성
1. Render 대시보드 -> **New -> Web Service**
2. Patienty 저장소 선택
3. 설정값:
   - **Name**: `patienty-frontend`
   - **Language / Runtime**: `Docker`
   - **Docker Context**: `./frontend`
   - **Dockerfile Path**: `./frontend/Dockerfile`
   - **Plan**: `Free`
4. **Docker Build Arguments 및 Environment Variables**:
   - **Build Argument**: `NEXT_PUBLIC_API_BASE_URL` = `https://patienty-backend.onrender.com` (Step 2 백엔드 URL)
   - **Environment Variable**: `NEXT_PUBLIC_API_BASE_URL` = `https://patienty-backend.onrender.com`

---

## 4. 환경변수(.env) 매핑 가이드

로컬 `.env`에 설정된 값들이 Render 서비스에 다음과 같이 1:1로 매핑됩니다.

| 로컬 .env 설정 | Render 백엔드 환경변수 | Render 프론트엔드 환경변수 | 비고 |
| :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `SPRING_DATASOURCE_URL` | - | Render DB 연결 주소 (`jdbc:postgresql://...`) |
| `POSTGRES_USER` | `SPRING_DATASOURCE_USERNAME` | - | DB 사용자명 |
| `POSTGRES_PASSWORD` | `SPRING_DATASOURCE_PASSWORD` | - | DB 비밀번호 |
| `OPENROUTER_API_KEY` | `OPENROUTER_API_KEY` | - | AI 어시스턴트 API Key |
| `PATIENTY_AI_PROVIDER` | `PATIENTY_AI_PROVIDER` | - | `openrouter` |
| `PATIENTY_AI_OPENROUTER_MODEL` | `PATIENTY_AI_OPENROUTER_MODEL`| - | 모델명 |
| - | `PATIENTY_CORS_ALLOWED_ORIGINS` | - | 프론트엔드 Render URL 지정 |
| `NEXT_PUBLIC_API_BASE_URL` | - | `NEXT_PUBLIC_API_BASE_URL` | 백엔드 Render URL 지정 |

---

## 5. 배포 후 검증 체크리스트

1. **백엔드 헬스체크**: `https://<backend-url>.onrender.com/actuator/health` 접속 시 `{"status":"UP"}` 확인
2. **프론트엔드 접속**: `https://<frontend-url>.onrender.com/login` 접속
3. **데모 계정 로그인 테스트**:
   - 이메일: `kim.doctor@patienty.dev`
   - 비밀번호: `password123!` (또는 시드된 데모 계정 정보)
4. **환자 목록 및 상세 조회**: 환자 타임라인, 생체 지표 추세 차트 로딩 확인
5. **AI 어시스턴트 질의응답**: 환자 상세 화면에서 OpenRouter AI 질의응답 정상 동작 확인

---

## 6. 트러블슈팅

- **CORS 또는 401 인증 에러**:
  - 백엔드의 `PATIENTY_CORS_ALLOWED_ORIGINS`에 프론트엔드의 정확한 HTTPS URL(끝에 슬래시 제외)이 등록되어 있는지 확인합니다.
  - `PATIENTY_SESSION_COOKIE_SECURE=true`, `PATIENTY_SESSION_COOKIE_SAME_SITE=none` 설정 여부를 확인합니다.
- **Free 인스턴스 Sleep 모드**:
  - Render Free 플랜은 15분 동안 요청이 없으면 슬립(Spin down) 상태로 진입합니다. 첫 요청 시 기동까지 약 30~50초가 소요될 수 있습니다.
