# myrep

Node.js 내장 `https` 모듈만으로 동작하는 로컬 HTTPS 서버 예제입니다.

## 기능

- `localhost` / `127.0.0.1` 범위로만 바인딩
- 포트는 `PORT` 환경변수로 변경 가능
- 개발용 인증서는 로컬에서 자동 생성
- 정적 샘플 페이지와 `/health` 엔드포인트 제공
- 실제 임시 HTTPS 서버를 띄우는 자동 테스트 포함

## 준비

```bash
npm install
npm run generate-cert
```

Windows 기본 PKI를 이용해 `certs/localhost.pfx`와 임의 비밀번호 파일을 생성합니다. 두 파일은 저장소에 추적되지 않습니다. `npm start`도 파일이 없으면 자동으로 생성합니다.

## 실행

```bash
npm start
```

기본값:

- host: `127.0.0.1`
- port: `8443`

PowerShell에서 환경변수로 변경:

```powershell
$env:HOST = "localhost"
$env:PORT = "9443"
npm start
```

브라우저에서 다음 주소로 접속하세요.

- `https://127.0.0.1:8443/`
- `https://127.0.0.1:8443/health`

## 테스트

```bash
npm test
```

테스트는 임시 HTTPS 서버를 시작해 응답 상태와 본문을 검증한 뒤 종료합니다.
