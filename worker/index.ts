import handler from "vinext/server/fetch-handler";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    // Purge stale rate-limit counters once a day.
    await env.DB.prepare("DELETE FROM RateLimitBucket WHERE expiresAt < ?")
      .bind(Math.floor(Date.now() / 1000)).run();
  },
};
