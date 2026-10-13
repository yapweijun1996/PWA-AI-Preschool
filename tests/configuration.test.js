import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STUDIO_CONFIG} from '../src/config.js';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('white-label defaults contain no named client organization', () => {
  assert.equal(STUDIO_CONFIG.productName, 'AI Preschool Studio');
  assert.equal(STUDIO_CONFIG.organizationName, '');
  assert.equal(STUDIO_CONFIG.portfolioTitle, 'Learning & Development Portfolio');
  assert.ok(STUDIO_CONFIG.demoOnly);
});

test('gateway routing is public config, not a bundled secret', () => {
  assert.equal(STUDIO_CONFIG.demoGateway.projectId, 'github-pages');
  assert.match(STUDIO_CONFIG.demoGateway.origin, /^https:\/\//);
  assert.equal(STUDIO_CONFIG.demoGateway.modelId, 'demo-auto');
  const appFiles=['../src/app.js','../src/providers.js','../src/config.js','../index.html'];
  for (const file of appFiles){
    const source=read(file);
    assert.doesNotMatch(source,/['"](?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|gw_[A-Za-z0-9]{15,})['"]/);
    assert.doesNotMatch(source,/\b(?:localStorage|sessionStorage|indexedDB)\.(?:setItem|put|add)\(/);
  }
});

test('demo does not advertise secure access or real student records', () => {
  const index=read('../index.html');
  assert.match(index,/UI simulation only/);
  assert.match(index,/Fictional data only/);
  assert.match(index,/not production-grade credential security/);
});
