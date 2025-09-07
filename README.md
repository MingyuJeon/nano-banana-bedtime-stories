# AI 동화책 생성 서비스

사용자의 이미지와 정보를 기반으로 개인화된 동화를 생성하는 웹 애플리케이션입니다.

## 주요 기능

1. **사용자 이미지 업로드**: 사용자가 자신의 이미지를 업로드
2. **사용자 정보 입력**: 나이와 성별 정보 입력
3. **음성 파일 업로드** (선택사항): 내레이션용 음성 파일 업로드
4. **개인화된 동화 생성**: Gemini Pro 2.5를 사용한 동화 생성
5. **배경 음악 생성**: 생성된 이미지 분석을 통한 적절한 배경 음악 생성
6. **읽기 기능**: 업로드된 음성 또는 ElevenLabs API를 통한 내레이션 재생

## 기술 스택

### Frontend
- React (TypeScript)
- Zustand (상태 관리)
- React Testing Library (TDD)
- Axios (HTTP 클라이언트)

### Backend
- Node.js / Express
- TypeScript
- Multer (파일 업로드)
- Google Generative AI (Gemini)

## 설치 및 실행

### 필수 요구사항
- Node.js (v14 이상)
- npm 또는 yarn
- Gemini API 키

### 설치

1. 저장소 클론
```bash
cd story-teller
```

2. 서버 의존성 설치
```bash
cd server
npm install
```

3. 클라이언트 의존성 설치
```bash
cd ../client
npm install
```

### 환경 변수 설정

1. 서버 환경 변수
```bash
cd server
cp .env.example .env
# .env 파일을 열어 GEMINI_API_KEY를 설정하세요
```

2. 클라이언트 환경 변수 (선택사항)
```bash
cd ../client
cp .env.example .env
# 필요시 API URL을 수정하세요
```

### 실행

1. 서버 시작
```bash
cd server
npm run dev
```

2. 새 터미널에서 클라이언트 시작
```bash
cd client
npm start
```

3. 브라우저에서 http://localhost:3000 접속

## 테스트

### 클라이언트 테스트
```bash
cd client
npm test
```

## 프로젝트 구조

```
story-teller/
├── client/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── UserInfo.tsx
│   │   │   ├── VoiceUpload.tsx
│   │   │   └── StoryViewer.tsx
│   │   ├── store/          # Zustand 스토어
│   │   │   └── useStoryStore.ts
│   │   └── App.tsx         # 메인 앱 컴포넌트
│   └── package.json
│
├── server/                  # Express 백엔드
│   ├── src/
│   │   ├── controllers/    # 컨트롤러
│   │   │   └── storyController.ts
│   │   ├── routes/         # 라우트
│   │   │   └── storyRoutes.ts
│   │   └── index.ts        # 서버 엔트리 포인트
│   └── package.json
│
└── README.md
```

## API 엔드포인트

- `POST /api/story/generate` - 동화 생성
- `POST /api/story/generate-images` - 이미지 생성
- `POST /api/story/generate-music` - 배경 음악 생성
- `POST /api/story/generate-narration` - 내레이션 생성

## 개발 방법론

이 프로젝트는 TDD(Test-Driven Development) 방법론을 따라 개발되었습니다:
1. 테스트 먼저 작성
2. 테스트를 통과하는 최소한의 코드 구현
3. 리팩토링

## 라이센스

MIT