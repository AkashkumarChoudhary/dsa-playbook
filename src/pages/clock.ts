/** A page's clock: `ctx.now` in tests, Date.now on the site. Kept apart from router-view to avoid an import cycle. */
export const clockOf = (ctx: { now?: () => number }): (() => number) => ctx.now ?? (() => Date.now());
