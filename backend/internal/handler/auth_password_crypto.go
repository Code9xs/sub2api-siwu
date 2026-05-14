package handler

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"strings"
)

const loginPasswordAlgorithm = "RSA-OAEP-256"

type LoginPasswordKeyResponse struct {
	KeyID        string `json:"key_id"`
	Algorithm    string `json:"algorithm"`
	PublicKey    string `json:"public_key"`
	PublicKeyDER string `json:"public_key_der"`
}

type loginPasswordCrypto struct {
	keyID        string
	privateKey   *rsa.PrivateKey
	publicKeyPEM string
	publicKeyDER []byte
}

func newLoginPasswordCrypto() (*loginPasswordCrypto, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, fmt.Errorf("generate login password key: %w", err)
	}

	publicKeyDER, err := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	if err != nil {
		return nil, fmt.Errorf("marshal login password public key: %w", err)
	}

	sum := sha256.Sum256(publicKeyDER)
	publicKeyPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: publicKeyDER})
	if publicKeyPEM == nil {
		return nil, errors.New("encode login password public key")
	}

	return &loginPasswordCrypto{
		keyID:        base64.RawURLEncoding.EncodeToString(sum[:16]),
		privateKey:   privateKey,
		publicKeyPEM: string(publicKeyPEM),
		publicKeyDER: publicKeyDER,
	}, nil
}

func (c *loginPasswordCrypto) PublicKey() LoginPasswordKeyResponse {
	return LoginPasswordKeyResponse{
		KeyID:        c.keyID,
		Algorithm:    loginPasswordAlgorithm,
		PublicKey:    c.publicKeyPEM,
		PublicKeyDER: base64.StdEncoding.EncodeToString(c.publicKeyDER),
	}
}

func (c *loginPasswordCrypto) Decrypt(keyID, ciphertextB64 string) (string, error) {
	if c == nil {
		return "", errors.New("login password crypto unavailable")
	}
	if strings.TrimSpace(keyID) == "" || keyID != c.keyID {
		return "", errors.New("invalid login password key")
	}
	ciphertext, err := base64.RawStdEncoding.DecodeString(strings.TrimSpace(ciphertextB64))
	if err != nil {
		ciphertext, err = base64.StdEncoding.DecodeString(strings.TrimSpace(ciphertextB64))
	}
	if err != nil {
		return "", errors.New("invalid encrypted password encoding")
	}
	plaintext, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, c.privateKey, ciphertext, nil)
	if err != nil {
		return "", errors.New("invalid encrypted password")
	}
	return string(plaintext), nil
}

func parseLoginPasswordPublicKeyDER(der []byte) (*rsa.PublicKey, error) {
	parsed, err := x509.ParsePKIXPublicKey(der)
	if err != nil {
		return nil, err
	}
	key, ok := parsed.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("login password public key is not RSA")
	}
	return key, nil
}

var defaultLoginPasswordCrypto = mustLoginPasswordCrypto()

func mustLoginPasswordCrypto() *loginPasswordCrypto {
	manager, err := newLoginPasswordCrypto()
	if err != nil {
		panic(err)
	}
	return manager
}
