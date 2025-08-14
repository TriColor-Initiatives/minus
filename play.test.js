const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('play.html','utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if(!match) throw new Error('No script found');
const script = match[1];
const sandbox = {console};
vm.createContext(sandbox);
vm.runInContext(script, sandbox);
const Game = vm.runInContext('Game', sandbox);

// Deck has 52 unique cards
const deck = Game.createDeck();
assert.strictEqual(deck.length,52);
assert.strictEqual(new Set(deck.map(c=>c.suit+c.rank)).size,52);

// Rule: must play smallest higher card in lead suit
let hand = [{suit:'H',rank:10},{suit:'H',rank:12},{suit:'S',rank:5}];
let legal = Game.getLegalMoves(hand,[{suit:'H',rank:9,player:1}],'H','S');
assert.deepStrictEqual(legal,[0]);

// Rule: no lead suit, must play trump
hand = [{suit:'S',rank:7},{suit:'S',rank:9},{suit:'C',rank:4}];
legal = Game.getLegalMoves(hand,[{suit:'H',rank:11,player:1}],'H','S');
assert.deepStrictEqual(legal.sort((a,b)=>a-b),[0,1]);

// Rule: must beat highest trump if possible
legal = Game.getLegalMoves(hand,[{suit:'H',rank:11,player:1},{suit:'S',rank:8,player:2}],'H','S');
assert.deepStrictEqual(legal,[1]);

// Trick winner with trump
const trick = [
 {suit:'H',rank:10,player:0},
 {suit:'H',rank:12,player:1},
 {suit:'S',rank:9,player:2},
 {suit:'H',rank:13,player:3}
];
const win = Game.determineTrickWinner(trick,'H','S');
assert.strictEqual(win.index,2);

console.log('All tests passed');
