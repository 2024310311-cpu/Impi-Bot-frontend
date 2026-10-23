import test from 'node:test';
import assert from 'node:assert/strict';
import { checkedSearch, errorMessage, REQUEST_TIMEOUT_MS } from './search-contract.js';

test('only a verified complete search is accepted, including confirmed zero matches', () => {
  const resultados = { peligro_alto: [], peligro_medio: [], peligro_bajo: [] };
  assert.equal(checkedSearch({ consulta: { estado: 'completada', completa: true }, resultados }), resultados);
  for (const consulta of [undefined, { estado: 'error', completa: true }, { estado: 'completada', completa: false }]) {
    assert.throws(() => checkedSearch({ consulta, resultados }));
  }
});

test('a malformed group cannot be presented as zero matches', () => {
  assert.throws(() => checkedSearch({ consulta: { estado: 'completada', completa: true }, resultados: {} }));
});

test('the user gets a timeout message and a finite request budget', () => {
  assert.equal(REQUEST_TIMEOUT_MS, 120000);
  assert.match(errorMessage({ code: 'ECONNABORTED' }), /tardó demasiado/);
  assert.equal(errorMessage({ response: { data: { detail: { message: 'El buscador está ocupado.' } } } }), 'El buscador está ocupado.');
});
