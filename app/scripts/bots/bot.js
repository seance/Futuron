/**
 * FUTURON bot template.
 *
 * Implement your strategy function to give the next move for your FUTURON bot.
 *
 * The function gets two parameters: look and state. Look is detailed below.
 * State contains always the `pos` key with value [x, y], indicating your bot's
 * current position. The strategy function must return an object containing at
 * least the `pos` key with the new position. Any further members will be
 * passed back as such in the next invocation, enabling the bot to store state
 * between invocations if so desired.
 *
 * Each invocation has a maximum time limit of 100 ms for computing - timeout
 * will result in crash of your bot. Don't be late!
 *
 * Helper functions & utilities available:
 *
 *  - look(pos): Returns true if `pos` is obstructed
 *  - move(pos, dir): Returns position with `dir` vector applied to `pos`
 *  - turnLeft(forward): Unit vector representing left direction wrt. `forward`
 *  - turnRight(forward): Unit vector representing right direction wrt. `forward`
 *  - directions: Array containing the 4 cardinal direction unit vectors
 *
 * In addition, Lodash.js is available in the usual `_` variable.
 */

var name = 'Your bot name'

function strategy(look, state) {
  return { pos: [state.pos[0] + 1, state.pos[1]] }
}