FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /pashmina-backend .

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /pashmina-backend /app/pashmina-backend
COPY --from=builder /app/uploads /app/uploads

RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

ENV ENVIRONMENT=production
ENV PORT=8080

CMD ["./pashmina-backend"]
