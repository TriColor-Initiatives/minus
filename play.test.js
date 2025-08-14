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

// Sorting: spades, hearts, clubs, diamonds; high to low within suit
let unsorted=[
  {suit:'C',rank:2},
  {suit:'S',rank:14},
  {suit:'H',rank:10},
  {suit:'S',rank:9},
  {suit:'D',rank:13}
];
Game.sortHand(unsorted);
assert.deepStrictEqual(unsorted.map(Game.cardString),['AS','9S','10H','2C','KD']);

// Rule: must beat highest in lead suit when possible
let hand = [{suit:'H',rank:2},{suit:'H',rank:8},{suit:'C',rank:4}];
let legal = Game.getLegalMoves(hand,[{suit:'H',rank:6,player:1}],'H','S',true);
assert.deepStrictEqual(legal.sort((a,b)=>a-b),[1]);

// Rule: no lead suit, must play trump
hand = [{suit:'S',rank:7},{suit:'S',rank:9},{suit:'C',rank:4}];
legal = Game.getLegalMoves(hand,[{suit:'H',rank:11,player:1}],'H','S',true);
assert.deepStrictEqual(legal.sort((a,b)=>a-b),[0,1]);

// Rule: no lead suit and no trump, play any card
hand = [{suit:'H',rank:7},{suit:'C',rank:4},{suit:'H',rank:8}];
legal = Game.getLegalMoves(hand,[{suit:'D',rank:11,player:1}],'D','S',true);
assert.deepStrictEqual(legal.sort((a,b)=>a-b),[0,1,2]);

// Trick winner with trump
const trick = [
 {suit:'H',rank:10,player:0},
 {suit:'H',rank:12,player:1},
 {suit:'S',rank:9,player:2},
 {suit:'H',rank:13,player:3}
];
const win = Game.determineTrickWinner(trick,'H','S');
assert.strictEqual(win.index,2);

// Ace outranks King in same suit
const trick2=[{suit:'D',rank:13,player:0},{suit:'D',rank:14,player:1}];
const win2=Game.determineTrickWinner(trick2,'D','S');
assert.strictEqual(win2.index,1);

// enforceHigh forces playing higher card when available
let hand2=[{suit:'D',rank:3},{suit:'D',rank:10},{suit:'C',rank:5}];
let legal2=Game.getLegalMoves(hand2,[{suit:'D',rank:7,player:1}],'D','S',true);
assert.deepStrictEqual(legal2.sort((a,b)=>a-b),[1]);
// if no higher card, all lead suit cards allowed
hand2=[{suit:'D',rank:3},{suit:'D',rank:10}];
legal2=Game.getLegalMoves(hand2,[{suit:'D',rank:12,player:1}],'D','S',true);
assert.deepStrictEqual(legal2.sort((a,b)=>a-b),[0,1]);

// Turn order cycles A3 -> A1 -> A2 -> You -> A3
assert.strictEqual(Game.nextPlayer(1),2);
assert.strictEqual(Game.nextPlayer(2),3);
assert.strictEqual(Game.nextPlayer(3),0);
assert.strictEqual(Game.nextPlayer(0),1);

console.log('All tests passed');
