import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRelease } from './release-policy.mjs';

const sha = (c) => c.repeat(40);
const digest = (c) => `sha256:${c.repeat(64)}`;
const valid = () => ({
  version: 1, channel: 'stable', repository: 'Udixio/UI',
  pullRequest: { baseRepository: 'Udixio/UI', headRepository: 'Udixio/UI', base: 'main', merged: true, mergeMethod: 'merge', mergeCommitSha: sha('a'), mergeTree: sha('b'), mergeCommitOnMain: true, headSha: sha('c') },
  approval: { headSha: sha('c'), tree: sha('b') },
  validation: { channel: 'stable', sha: sha('a'), tree: sha('b'), runId: 12, attempt: 2, artifactId: 34, artifactDigest: digest('d') },
  artifact: { channel: 'stable', sha: sha('a'), runId: 12, attempt: 2, id: 34, digest: digest('d') },
});

test('accepts the exact approved stable merge and artifact', () => {
  assert.deepEqual(evaluateRelease(valid()), { allowed: true, reasons: [] });
});

test('rejects malformed or unknown fields and versions', () => {
  for (const mutate of [x => { x.version = 2; }, x => { x.extra = true; }, x => { delete x.approval; }, x => { x.validation.runId = '12'; }, x => { x.artifact.digest = 'bad'; }, x => { x.channel = 'other'; }]) {
    const value = valid(); mutate(value);
    const result = evaluateRelease(value);
    assert.equal(result.allowed, false);
    assert.ok(result.reasons.length);
  }
  for (const value of [null, [], 'x']) assert.equal(evaluateRelease(value).allowed, false);
});

test('rejects untrusted PR facts and mismatched bindings', () => {
  for (const mutate of [
    x => { x.pullRequest.headRepository = 'fork/UI'; },
    x => { x.pullRequest.baseRepository = 'fork/UI'; },
    x => { x.pullRequest.base = 'develop'; },
    x => { x.pullRequest.merged = false; },
    x => { x.pullRequest.mergeMethod = 'squash'; },
    x => { x.pullRequest.mergeCommitOnMain = false; },
    x => { x.approval.headSha = sha('e'); },
    x => { x.approval.tree = sha('e'); },
    x => { x.validation.sha = sha('e'); },
    x => { x.validation.tree = sha('e'); },
    x => { x.artifact.sha = sha('e'); },
    x => { x.artifact.runId++; },
    x => { x.artifact.attempt++; },
    x => { x.artifact.id++; },
    x => { x.artifact.digest = digest('e'); },
    x => { x.artifact.channel = 'beta'; },
    x => { x.validation.channel = 'next'; },
  ]) {
    const value = valid(); mutate(value);
    const result = evaluateRelease(value);
    assert.equal(result.allowed, false, JSON.stringify(value));
    assert.ok(result.reasons.length);
  }
});

test('rejects hostile object shapes without invoking accessors', () => {
  let invoked = false;
  const accessor = valid();
  Object.defineProperty(accessor.approval, 'tree', { enumerable: true, get() { invoked = true; throw new Error('getter'); } });
  const symbol = valid(); symbol.artifact[Symbol('extra')] = true;
  const hidden = valid(); Object.defineProperty(hidden.validation, 'extra', { value: true });
  const prototype = valid(); Object.setPrototypeOf(prototype.pullRequest, { injected: true });
  const throwing = new Proxy(valid(), { ownKeys() { throw new Error('proxy'); } });
  for (const value of [accessor, symbol, hidden, prototype, throwing]) {
    assert.deepEqual(evaluateRelease(value), { allowed: false, reasons: ['invalid-contract'] });
  }
  assert.equal(invoked, false);
});

test('refuses unsupported prerelease channels even when all facts agree', () => {
  for (const channel of ['beta', 'next']) {
    const value = valid();
    value.channel = value.validation.channel = value.artifact.channel = channel;
    assert.deepEqual(evaluateRelease(value), { allowed: false, reasons: ['channel-mismatch-or-unsupported'] });
  }
});

test('rejects incorrect repository, invalid IDs and malformed hashes', () => {
  const wrongRepository = valid(); wrongRepository.repository = 'other/UI';
  assert.equal(evaluateRelease(wrongRepository).allowed, false);
  for (const number of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    for (const field of ['runId', 'attempt', 'artifactId']) {
      const value = valid(); value.validation[field] = number;
      assert.equal(evaluateRelease(value).allowed, false);
    }
    for (const field of ['runId', 'attempt', 'id']) {
      const value = valid(); value.artifact[field] = number;
      assert.equal(evaluateRelease(value).allowed, false);
    }
  }
  for (const malformed of ['', 'A'.repeat(40), 'g'.repeat(40), 'a'.repeat(39)]) {
    const value = valid(); value.approval.headSha = malformed;
    assert.equal(evaluateRelease(value).allowed, false);
  }
  for (const malformed of ['d'.repeat(64), `sha256:${'D'.repeat(64)}`, `sha256:${'d'.repeat(63)}`]) {
    const value = valid(); value.artifact.digest = malformed;
    assert.equal(evaluateRelease(value).allowed, false);
  }
  const extra = valid(); extra.approval.extra = true;
  assert.equal(evaluateRelease(extra).allowed, false);
});

test('rejects direct and indirect cycles and proxy inspection exceptions', () => {
  const direct = valid(); direct.approval.extra = direct.approval;
  const indirect = valid(); indirect.approval.extra = { back: indirect };
  const revoked = Proxy.revocable(valid(), {}); revoked.revoke();
  const prototypeTrap = new Proxy(valid(), { getPrototypeOf() { throw new Error('prototype trap'); } });
  const descriptorTrap = new Proxy(valid(), { getOwnPropertyDescriptor() { throw new Error('descriptor trap'); } });
  for (const value of [direct, indirect, revoked.proxy, prototypeTrap, descriptorTrap]) {
    assert.deepEqual(evaluateRelease(value), { allowed: false, reasons: ['invalid-contract'] });
  }
});
