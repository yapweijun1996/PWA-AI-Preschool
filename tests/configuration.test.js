import test from 'node:test';
import assert from 'node:assert/strict';
import {STUDIO_CONFIG} from '../src/config.js';

test('public configuration cannot be mutated through its exported reference',()=>{
 const original=structuredClone(STUDIO_CONFIG);
 assert.throws(()=>{STUDIO_CONFIG.organizationName='Changed demo identity'},TypeError);
 assert.throws(()=>{STUDIO_CONFIG.demoGateway.projectId='Changed route'},TypeError);
 assert.throws(()=>{STUDIO_CONFIG.metrics.hypotheticalEditingTargetPercent=100},TypeError);
 assert.throws(()=>{STUDIO_CONFIG.demoGateway={}},TypeError);
 assert.deepEqual(STUDIO_CONFIG,original);
});
