export type IdPrefix = 'asset' | 'diagram' | 'node' | 'edge' | 'project';

export type DomainId<TPrefix extends IdPrefix = IdPrefix> = `${TPrefix}_${string}`;

export function createId<TPrefix extends IdPrefix>(prefix: TPrefix): DomainId<TPrefix> {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomPart}` as DomainId<TPrefix>;
}
