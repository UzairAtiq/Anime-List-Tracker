/** @fileoverview Curated list of retro and anime-themed emojis for anime card representations. */

/**
 * Static collection of emoji icons used to assign distinctive visual badges to anime cards.
 * @type {string[]}
 */
export const emojiList = [
  '🎌', '⚔️', '🗡️', '🛡️', '👺', '🎭', '🎪', '🎨',
  '🌸', '🌙', '⭐', '🌟', '✨', '💫', '🔥', '💥',
  '🎯', '🎲', '🎮', '🎰', '🎸', '🎺', '🎻', '🎤',
  '👑', '💎', '🏆', '🎖️', '🎗️', '🎟️', '🎫', '🎪',
  '🌊', '🌋', '🗻', '🏔️', '🌲', '🌳', '🌴', '🌵',
  '🐉', '🐲', '🦄', '🦁', '🐯', '🐺', '🦊', '🐱',
  '⚡', '💀', '👻', '🤖', '👽', '👾', '🦾', '🦿',
  '🎃', '🎄', '🎅', '🤶', '🧙', '🧚', '🧛', '🧜',
  '🌠', '☄️', '🌌', '🔮', '🧿', '💊', '⚗️', '🧪',
  '🎈', '🎉', '🎊', '🎁', '🎀', '🎂', '🍰', '🍭',
  '🍡', '🍢', '🍣', '🍤', '🍥', '🥮', '🍱', '🍙',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱',
  '🚀', '🛸', '✈️', '🛩️', '🛰️', '🌍', '🌎', '🌏',
  '🔱', '⚜️', '🔰', '🛡️', '⚔️', '🗡️', '🏹', '🪃',
  '🎴', '🃏', '🀄', '🕯️', '💡', '🔦', '🕳️', '🕰️',
];

/**
 * Selects and returns a pseudorandom emoji from the emojiList collection.
 *
 * Steps:
 * 1. Compute a random integer index within [0, emojiList.length).
 * 2. Return the emoji character at that index.
 *
 * @returns {string} Randomly selected emoji.
 */
export const getRandomEmoji = () => {
  return emojiList[Math.floor(Math.random() * emojiList.length)];
};
