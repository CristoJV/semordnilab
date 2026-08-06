import { describe, expect, it } from 'vitest'

import { BrowserSelectedDatasetRepository } from '@/infrastructure/repositories'

function createStorage(initial?: string) {
  let value = initial ?? null
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
    removeItem: () => {
      value = null
    },
  }
}

describe('BrowserSelectedDatasetRepository', () => {
  it('recupera, actualiza y limpia el dataset de sesión', () => {
    const storage = createStorage('es-gl')
    const repository = new BrowserSelectedDatasetRepository(storage)

    expect(repository.load()).toBe('es-gl')
    repository.save('es-ca')
    expect(repository.load()).toBe('es-ca')
    repository.save('')
    expect(repository.load()).toBe('')
  })

  it('no interrumpe la aplicación si el almacenamiento está bloqueado', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    const repository = new BrowserSelectedDatasetRepository(storage)

    expect(repository.load()).toBe('')
    expect(() => repository.save('es-gl')).not.toThrow()
  })
})
