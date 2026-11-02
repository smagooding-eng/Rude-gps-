import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMaxspeed, limitsFromWays } from '../src/lib/speedLimits.js';
import { matchCommand } from '../src/lib/listener.js';

test('maxspeed tags parse', () => {
  assert.ok(Math.abs(parseMaxspeed('45 mph') - 20.1168) < 0.001);
  assert.ok(Math.abs(parseMaxspeed('50') - 13.8889) < 0.001);
  assert.equal(parseMaxspeed('RU:urban'), null);
  assert.equal(parseMaxspeed('none'), null);
});

test('limits map onto route segments, gaps filled', () => {
  const nodes = [1, 2, 3, 4, 5, 6];
  const ways = [
    { nodes: [1, 2, 3], tags: { maxspeed: '30 mph' } },
    { nodes: [4, 5, 6], tags: { maxspeed: '30 mph' } },
  ];
  const out = limitsFromWays(nodes, ways);
  assert.equal(out.length, 5);
  assert.ok(out.every((v) => Math.abs(v - 13.4112) < 0.001), 'segment 3-4 filled from neighbors');
});

test('report commands, and yes/no only while asking', () => {
  assert.equal(matchCommand('report police'), 'report_police');
  assert.equal(matchCommand('cops ahead'), 'report_police');
  assert.equal(matchCommand('report a crash'), 'report_crash');
  assert.equal(matchCommand('yes'), null);
  assert.equal(matchCommand('yeah still there', { voting: true }), 'vote_yes');
  assert.equal(matchCommand('nope', { voting: true }), 'vote_no');
});
