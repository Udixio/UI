/**
 * Prototype local, stable uniquement. Entrée : faits JSON déjà authentifiés par
 * un contrôleur de confiance ; aucune provenance n'est vérifiée ici. Cette
 * fonction ne valide ni identité de préparation/App, protection GitHub, revue,
 * mode de merge réel, manifeste, archives, tags, ni disponibilité des secrets.
 * Elle ne doit pas servir seule à autoriser une publication. Beta et next sont
 * refusés tant que leur contrat distinct n'est pas défini et vérifié.
 *
 * Les identifiants Git sont des SHA-1 complets en minuscules, les identifiants
 * de run/artefact des entiers sûrs positifs, le digest un SHA-256 préfixé.
 * Les noms des champs représentent des faits observés, pas des preuves. Les
 * objets doivent être des données simples : aucun accesseur, symbole ou
 * prototype personnalisé. Toute exception pendant leur copie entraîne un refus.
 */
const sha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const digest = value => typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value);
const id = value => Number.isSafeInteger(value) && value > 0;
const string = value => typeof value === 'string' && value.length > 0;
const bool = value => typeof value === 'boolean';
const object = (value, schema) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === Object.keys(schema).length &&
    Object.entries(schema).every(([key, check]) => Object.hasOwn(value, key) && check(value[key]));
};
const pr = value => object(value, {
  baseRepository: string, headRepository: string, base: string, merged: bool,
  mergeMethod: string, mergeCommitSha: sha, mergeTree: sha, mergeCommitOnMain: bool, headSha: sha,
});
const approval = value => object(value, { headSha: sha, tree: sha });
const validation = value => object(value, {
  channel: string, sha, tree: sha, runId: id, attempt: id, artifactId: id, artifactDigest: digest,
});
const artifact = value => object(value, {
  channel: string, sha, runId: id, attempt: id, id, digest,
});

// Copie les propriétés propres une seule fois, sans exécuter de getter. Les
// pièges des proxies peuvent exécuter du code et mentir sur les faits ; aucune
// provenance n’est prouvée ici et leur authentification reste externe.
function snapshot(value, seen = new Set()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value) || Array.isArray(value)) throw new Error('invalid object');
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) throw new Error('invalid prototype');
  seen.add(value);
  const copy = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string') throw new Error('invalid key');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new Error('invalid property');
    copy[key] = snapshot(descriptor.value, seen);
  }
  seen.delete(value);
  return copy;
}

export function evaluateRelease(input) {
  let facts;
  try {
    facts = snapshot(input);
  } catch {
    return { allowed: false, reasons: ['invalid-contract'] };
  }
  if (!object(facts, { version: value => value === 1, channel: string, repository: string, pullRequest: pr, approval, validation, artifact })) {
    return { allowed: false, reasons: ['invalid-contract'] };
  }
  const { channel, repository, pullRequest: p, approval: a, validation: v, artifact: t } = facts;
  const reasons = [];
  const require = (condition, reason) => { if (!condition) reasons.push(reason); };
  require(channel === 'stable' && v.channel === channel && t.channel === channel, 'channel-mismatch-or-unsupported');
  require(repository === 'Udixio/UI' && p.baseRepository === repository && p.headRepository === repository, 'repository-mismatch');
  require(p.base === 'main' && p.merged && p.mergeMethod === 'merge' && p.mergeCommitOnMain, 'invalid-merge');
  require(a.headSha === p.headSha, 'approval-head-mismatch');
  require(a.tree === p.mergeTree, 'approval-tree-mismatch');
  require(v.sha === p.mergeCommitSha && t.sha === v.sha, 'candidate-sha-mismatch');
  require(v.tree === p.mergeTree, 'validation-tree-mismatch');
  require(t.runId === v.runId && t.attempt === v.attempt && t.id === v.artifactId && t.digest === v.artifactDigest, 'artifact-mismatch');
  return { allowed: reasons.length === 0, reasons };
}
