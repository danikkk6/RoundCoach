// Match context only. This does not choose a buy or a round strategy.
export function isDecisiveRound(round) {
  return Number.isInteger(round) && (round === 12 || (round >= 24 && round % 6 === 0));
}
