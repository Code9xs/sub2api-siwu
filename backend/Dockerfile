FROM golang:1.26.4-alpine

WORKDIR /app

# Install required tools. pg_dump/psql are used by backup and restore.
RUN apk add --no-cache git postgresql-client

# Copy go.mod and go.sum first for better layer caching.
COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o main ./cmd/server/

EXPOSE 8080

CMD ["./main"]
