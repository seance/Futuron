var name = 'Your bot name'

function strategy(look, state) {
  return { pos: [state.pos[0] + 1, state.pos[1]] }
}