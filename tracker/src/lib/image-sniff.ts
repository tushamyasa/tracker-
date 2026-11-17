export type ImageExt = "jpg" | "png" | "webp";

/**
 * Определяет формат по первым байтам файла. MIME-тип из запроса задаёт клиент,
 * поэтому доверять ему нельзя: файл с чужим содержимым и расширением .png не пройдёт.
 */
export function sniffImage(bytes: Uint8Array): ImageExt | null {
  const at = (i: number) => bytes[i];
  if (bytes.length >= 8 && at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47) {
    return at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a ? "png" : null;
  }
  if (bytes.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "jpg";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(at(0), at(1), at(2), at(3)) === "RIFF" &&
    String.fromCharCode(at(8), at(9), at(10), at(11)) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}
