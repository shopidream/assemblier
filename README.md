# Assemblier

Shopify 스토어 자동 생성 SaaS 플랫폼

## 기술 스택

- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Node.js**: v20.20.0 (LTS)

## 프로젝트 구조

```
assemblier/
├─ assemblier-backend/   # NestJS 백엔드
├─ assemblier-frontend/  # Next.js 프론트엔드
└─ README.md
```

## 개발 환경 설정

### Backend

```bash
cd assemblier-backend
npm install
npm run start:dev
```

### Frontend

```bash
cd assemblier-frontend
npm install
npm run dev
```

## 환경 변수

각 프로젝트 디렉토리에 `.env` 파일을 생성하여 환경 변수를 설정합니다.

## 데이터베이스

PostgreSQL 데이터베이스 `assemblier`가 필요합니다.

```sql
CREATE DATABASE assemblier;
```
