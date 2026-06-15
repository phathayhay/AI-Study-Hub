# ── BUILD STAGE ────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Sao chép pom.xml để tải dependencies trước (tận dụng Docker cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Sao chép mã nguồn và đóng gói ứng dụng
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── RUN STAGE ──────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Sao chép file jar từ build stage sang run stage
COPY --from=build /app/target/ai-studyhub-backend-1.0.0-SNAPSHOT.jar app.jar

# Khai báo cổng ứng dụng chạy (Render sẽ tự động ánh xạ)
EXPOSE 8080

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]
