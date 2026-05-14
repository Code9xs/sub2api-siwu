package handler

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestLoginPasswordCryptoRoundTrip(t *testing.T) {
	manager, err := newLoginPasswordCrypto()
	require.NoError(t, err)

	key := manager.PublicKey()
	require.Equal(t, "RSA-OAEP-256", key.Algorithm)
	require.NotEmpty(t, key.KeyID)
	require.Contains(t, key.PublicKey, "BEGIN PUBLIC KEY")

	block, err := base64.StdEncoding.DecodeString(key.PublicKeyDER)
	require.NoError(t, err)
	parsed, err := parseLoginPasswordPublicKeyDER(block)
	require.NoError(t, err)

	ciphertext, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, parsed, []byte("secret-password"), nil)
	require.NoError(t, err)

	plaintext, err := manager.Decrypt(key.KeyID, base64.RawStdEncoding.EncodeToString(ciphertext))
	require.NoError(t, err)
	require.Equal(t, "secret-password", plaintext)
}

func TestAuthHandlerLoginRejectsPlaintextPassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handler := &AuthHandler{}
	router.POST("/auth/login", handler.Login)

	tests := []struct {
		name string
		body map[string]string
	}{
		{
			name: "plaintext only",
			body: map[string]string{
				"email":    "user@example.com",
				"password": "secret-password",
			},
		},
		{
			name: "plaintext alongside encrypted password",
			body: map[string]string{
				"email":              "user@example.com",
				"password":           "secret-password",
				"password_encrypted": encryptPasswordForDefaultLoginKey(t, "secret-password"),
				"password_key_id":    defaultLoginPasswordCrypto.PublicKey().KeyID,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, err := json.Marshal(tt.body)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			require.Equal(t, http.StatusBadRequest, w.Code)
			require.NotContains(t, w.Body.String(), "secret-password")
		})
	}
}

func encryptPasswordForDefaultLoginKey(t *testing.T, password string) string {
	t.Helper()
	key := defaultLoginPasswordCrypto.PublicKey()
	block, err := base64.StdEncoding.DecodeString(key.PublicKeyDER)
	require.NoError(t, err)
	parsed, err := parseLoginPasswordPublicKeyDER(block)
	require.NoError(t, err)
	ciphertext, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, parsed, []byte(password), nil)
	require.NoError(t, err)
	return base64.RawStdEncoding.EncodeToString(ciphertext)
}
