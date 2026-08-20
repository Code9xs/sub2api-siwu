FROM golang:1.26.6-alpine

WORKDIR /app

# Install required tools. pg_dump/psql are used by backup and restore.
RUN apk add --no-cache git postgresql-client

# Copy go.mod and go.sum first for better layer caching.
COPY go.mod go.sum ./

RUN go mod download

COPY . .

# 构建应用
RUN VERSION_VALUE="$(./scripts/resolve-version.sh)" && \
    go build -ldflags="-s -w -X main.Version=${VERSION_VALUE}" -o main ./cmd/server/

EXPOSE 8080

CMD ["./main"]
