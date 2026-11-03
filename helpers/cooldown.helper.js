/**
 * Per-user cooldown: rejects a request when the same user made one less than `ms` ago.
 * Unlike a fixed-window rate limit, two requests can never slip through on either side
 * of a window boundary. Must run after the auth middleware (needs req.userId).
 */
const userCooldown = (ms, message = "Too many requests, please try again in a second") => {
  const lastSeen = new Map();

  // Forget users that have been idle for a while so the map stays small
  setInterval(() => {
    const cutoff = Date.now() - ms;
    for (const [userId, time] of lastSeen) if (time < cutoff) lastSeen.delete(userId);
  }, Math.max(ms, 60 * 1000)).unref();

  return (req, res, next) => {
    const now = Date.now();
    const last = lastSeen.get(req.userId);
    if (last !== undefined && now - last < ms) {
      return res.status(200).json({ status: false, message });
    }
    lastSeen.set(req.userId, now);
    next();
  };
};

module.exports = { userCooldown };
