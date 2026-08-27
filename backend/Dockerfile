# Build stage
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Gradle wrapper 및 설정 복사
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle

# gradlew 실행 권한 부여 및 줄바꿈 정규화 (Windows CRLF 호환)
RUN chmod +x gradlew && sed -i 's/\r$//' gradlew

# 종속성 사전 다운로드 (캐시 레이어 활용)
RUN ./gradlew dependencies --no-daemon || true

# 소스 코드 복사 및 빌드
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 실행용 비루트 사용자 생성
RUN addgroup -S patienty && adduser -S patienty -G patienty
USER patienty:patienty

# 빌드된 JAR 파일 복사
COPY --from=builder /app/build/libs/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
