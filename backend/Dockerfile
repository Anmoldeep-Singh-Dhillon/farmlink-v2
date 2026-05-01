FROM eclipse-temurin:17-jre-jammy
WORKDIR /backend
EXPOSE 8080
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]


#in pipeline we are building the project and it makes a .jar so instead of repeating that in docker file we directly will copy that file
# FROM eclipse-temurin:17-jdk-jammy AS builder
# WORKDIR /backend
# COPY .mvn/ .mvn
# COPY mvnw pom.xml ./
# RUN ./mvnw dependency:go-offline
# COPY ./src ./src
# RUN ./mvnw clean install -DskipTests

# FROM eclipse-temurin:17-jre-jammy AS final
# WORKDIR /backend
# EXPOSE 8080
# COPY --from=builder /backend/target/*.jar /backend/app.jar
# ENTRYPOINT ["java", "-jar", "/backend/app.jar"]