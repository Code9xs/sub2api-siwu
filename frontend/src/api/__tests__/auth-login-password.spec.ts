import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('@/api/client', () => ({
  apiClient: {
    get,
    post
  }
}))

const originalCrypto = globalThis.crypto

function installCryptoMock() {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      subtle: {
        importKey: vi.fn().mockResolvedValue({ kind: 'public-key' }),
        encrypt: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer)
      }
    }
  })
}

describe('auth login password transport', () => {
  beforeEach(() => {
    vi.resetModules()
    get.mockReset()
    post.mockReset()
    post.mockResolvedValue({
      data: {
        access_token: 'token',
        token_type: 'Bearer',
        user: { id: 1, email: 'user@example.com' }
      }
    })
    get.mockResolvedValue({
      data: {
        key_id: 'login-key',
        algorithm: 'RSA-OAEP-256',
        public_key: '-----BEGIN PUBLIC KEY-----\nAQIDBA==\n-----END PUBLIC KEY-----',
        public_key_der: 'AQIDBA=='
      }
    })
    installCryptoMock()
    localStorage.clear()
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto
    })
  })

  it('encrypts the login password before posting credentials', async () => {
    const { login } = await import('@/api/auth')

    await login({
      email: 'user@example.com',
      password: 'secret-password',
      turnstile_token: 'turnstile-token'
    })

    expect(get).toHaveBeenCalledWith('/auth/login-password-key')
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@example.com',
      password_encrypted: 'AQIDBA',
      password_key_id: 'login-key',
      turnstile_token: 'turnstile-token'
    })
    expect(JSON.stringify(post.mock.calls[0]?.[1])).not.toContain('secret-password')
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty('password')
  })
})
