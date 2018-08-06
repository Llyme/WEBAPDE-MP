/** Neat little guy that transforms date (in milliseconds) to hex.
 * This is mainly for ObjectIds.
 *
 * The name came from the game 'Dota 2', in which was derived from an
 * in-game item 'Scythe of Vyse', which was also called 'Sheep Stick'
 * (the item 'hexes' an enemy; a play of word, turning integers into
 * HEXadecimal characters).
**/

module.exports = v => Math.floor(new Date(v)/1000)
	.toString(16) + "0000000000000000";
