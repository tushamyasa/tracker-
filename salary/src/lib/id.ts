/** Генерация идентификаторов записей (UUID v4). */
export function createId(): string {
  return crypto.randomUUID();
}
