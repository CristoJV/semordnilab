import { describe, expect, it } from 'vitest'

import {
  AddSemordnilapTagAssignments,
  ApplySemordnilapTagChanges,
  CreateSemordnilapTag,
  DeleteSemordnilapTag,
  ListSemordnilapTags,
  RemoveSemordnilapTagAssignments,
  UpdateSemordnilapTag,
} from '@/application'

import { InMemorySemordnilapTagRepository } from '../support/in-memory-semordnilap-tag-repository'

describe('etiquetas de semordnilaps', () => {
  it('crea nombres normalizados y evita duplicados equivalentes', async () => {
    const repository = new InMemorySemordnilapTagRepository()
    const create = new CreateSemordnilapTag(
      repository,
      () => 'uno',
      () => new Date('2026-08-06T10:00:00.000Z'),
    )
    const tag = await create.execute({
      name: '  Para   revisar ',
      color: 'violet',
      icon: 'star',
    })

    expect(tag).toMatchObject({
      id: 'tag:uno',
      name: 'Para revisar',
      normalizedName: 'para revisar',
      icon: 'star',
    })
    await expect(
      create.execute({ name: 'PARA REVISAR', color: 'mustard', icon: 'tag' }),
    ).rejects.toThrow('Ya existe')
  })

  it('asigna, retira, actualiza y elimina etiquetas sin tocar semordnilaps', async () => {
    const repository = new InMemorySemordnilapTagRepository()
    const create = new CreateSemordnilapTag(repository, () => 'uno')
    const tag = await create.execute({
      name: 'Curioso',
      color: 'mustard',
      icon: 'tag',
    })
    const add = new AddSemordnilapTagAssignments(
      repository,
      () => new Date('2026-08-06T11:00:00.000Z'),
    )
    await add.execute(
      'es-gl',
      ['atomic:uno', 'atomic:uno', 'atomic:dos'],
      tag.id,
    )

    expect(
      (await new ListSemordnilapTags(repository).execute('es-gl')).assignments,
    ).toHaveLength(2)

    const updated = await new UpdateSemordnilapTag(
      repository,
      () => new Date('2026-08-06T12:00:00.000Z'),
    ).execute(tag, { name: 'Muy curioso', color: 'green', icon: 'heart' })
    expect(updated).toMatchObject({
      id: tag.id,
      normalizedName: 'muy curioso',
      color: 'green',
      icon: 'heart',
    })

    await new RemoveSemordnilapTagAssignments(repository).execute(
      'es-gl',
      ['atomic:uno'],
      tag.id,
    )
    expect((await repository.list('es-gl')).assignments).toHaveLength(1)

    await new ApplySemordnilapTagChanges(repository).execute(
      'es-gl',
      ['atomic:uno', 'atomic:dos'],
      [{ tagId: tag.id, assigned: true }],
    )
    expect((await repository.list('es-gl')).assignments).toHaveLength(2)

    await new DeleteSemordnilapTag(repository).execute(tag.id)
    expect(await repository.list('es-gl')).toEqual({
      tags: [],
      assignments: [],
    })
  })
})
