// Validación del tipo real de las fotos (punto 16). Ejecutar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectImage } from "../src/lib/image-validation.ts";

const bytes = (...v: number[]) => new Uint8Array([...v, ...new Array(16).fill(0)]);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

test("reconoce JPG, PNG y WebP por sus bytes", () => {
  assert.equal(detectImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext, "jpg");
  assert.equal(detectImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext, "png");
  assert.equal(detectImage(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP")))?.ext, "webp");
});

test("rechaza archivos disfrazados de imagen", () => {
  assert.equal(detectImage(new TextEncoder().encode('<svg onload="alert(1)"></svg>')), null);
  assert.equal(detectImage(new TextEncoder().encode("<?php system($_GET['c']); ?>")), null);
  assert.equal(detectImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)), null); // GIF
  assert.equal(detectImage(bytes(0x25, 0x50, 0x44, 0x46)), null); // PDF
  assert.equal(detectImage(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE"))), null);
  assert.equal(detectImage(new Uint8Array([0xff, 0xd8])), null);
});
