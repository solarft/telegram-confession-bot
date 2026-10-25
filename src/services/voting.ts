import { redis } from '..'
import { APPROVAL_THRESHOLD, VOTE_TTL_SECONDS } from '../env'

export type VoteSide = 'approve' | 'reject'

export type CastVoteResult =
  // Click landed after the ballot expired — never recreate it.
  | { status: 'expired' }
  // The user is already on the pressed side (duplicate press / Telegram retry).
  | { status: 'already-voted'; side: VoteSide }
  // Vote recorded (fresh or switched), threshold not reached.
  | {
      status: 'voted'
      side: VoteSide
      switched: boolean
      approves: number
      rejects: number
    }
  // Ballot is closed; `side` is the winning side. No side effects allowed.
  | { status: 'decided'; side: VoteSide }
  // This processing won the exclusive claim and MUST perform the transition.
  | { status: 'claimed'; side: VoteSide; approves: number; rejects: number }

function ballotKey(ballotId: number, suffix: string) {
  return `ballot:${ballotId}:${suffix}`
}

const aliveKey = (ballotId: number) => ballotKey(ballotId, 'alive')
const approveKey = (ballotId: number) => ballotKey(ballotId, 'approves')
const rejectKey = (ballotId: number) => ballotKey(ballotId, 'rejects')
const decidedKey = (ballotId: number) => ballotKey(ballotId, 'decided')

/**
 * Eagerly marks that a real ballot exists. Its presence is the only thing
 * distinguishing a fresh, zero-vote ballot from an expired one, so this must
 * run at broadcast time — never lazily on the first vote.
 */
export function startBallot(ballotId: number) {
  return redis.set(aliveKey(ballotId), '1', { ex: VOTE_TTL_SECONDS })
}

async function winner(ballotId: number): Promise<VoteSide | null> {
  const decided = await redis.get<string>(decidedKey(ballotId))
  return decided === 'approve' || decided === 'reject' ? decided : null
}

/**
 * Records a press against a ballot. Correctness lives here, not in the
 * handler: every branch's outcome is decided by Redis's own atomic return
 * values, so overlapping and duplicate deliveries cannot corrupt the ballot.
 */
export async function castVote(
  ballotId: number,
  userId: number,
  side: VoteSide,
): Promise<CastVoteResult> {
  if (!(await redis.exists(aliveKey(ballotId)))) {
    return { status: 'expired' }
  }

  // Ballot closed: record nothing, act on nothing.
  const decidedSide = await winner(ballotId)
  if (decidedSide) {
    return { status: 'decided', side: decidedSide }
  }

  const source = side === 'approve' ? rejectKey(ballotId) : approveKey(ballotId)
  const target = side === 'approve' ? approveKey(ballotId) : rejectKey(ballotId)

  // Switching is the atomic move attempt; a fresh vote then rides on SADD.
  // No pre-check anywhere: the command's return value IS the check, so a
  // press delivered twice is indistinguishable from one delivered once.
  const switched = (await redis.smove(source, target, userId)) === 1
  if (!switched && (await redis.sadd(target, userId)) === 0) {
    return { status: 'already-voted', side }
  }

  // SADD/SMOVE cannot carry a TTL, so the lease is applied right after the
  // write. NX anchors it to this key's creation, so its lifetime mirrors
  // the SET-born keys (alive, decided) instead of sliding with every vote.
  await redis.expire(target, VOTE_TTL_SECONDS, 'NX')

  // Counts are always derived, so the tally can never diverge.
  const [approves, rejects] = await Promise.all([
    redis.scard(approveKey(ballotId)),
    redis.scard(rejectKey(ballotId)),
  ])
  const count = side === 'approve' ? approves : rejects

  if (count < APPROVAL_THRESHOLD) {
    return { status: 'voted', side, switched, approves, rejects }
  }

  // The decision transition: exactly one caller wins the claim, even when
  // overlapping racers see the same threshold crossed. Losers must not
  // publish, edit the message, or touch recent_confessions.
  const claimed = await redis.set(decidedKey(ballotId), side, {
    ex: VOTE_TTL_SECONDS,
    nx: true,
  })
  if (claimed !== 'OK') {
    return { status: 'decided', side: (await winner(ballotId)) ?? side }
  }

  return { status: 'claimed', side, approves, rejects }
}
