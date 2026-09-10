# X UI

The primary timeline and navigation are preserved. The secondary desktop column
(`sidebarColumn`) is hidden as a surface, including search/news/trends/follow
suggestions it contains. The timeline is not widened. CSS covers SPA replacements;
re-injection disposes the previous style.

Every rendered post receives direct **Copy post link** and **Copy post as Markdown**
actions beside X's native actions. At the action boundary, a passive adapter reads
complete text from the optional local `x.posts` capture projection. If that
independent capability is absent or has not observed the post, a page-local adapter
tries the matching Tweet model without retaining or changing component state. These
paths issue no X requests and change no X state. The pack reads the post's own timestamp
permalink at the click boundary and normalizes it to
`https://x.com/<author>/status/<id>`. X does not expose a matching collapse action
after **Show more**, so Markdown never activates that control. If neither passive
source has complete text yet, the action reports failure and leaves the post exactly
as it was.
The clipboard write itself starts in the original gesture with a deferred
`ClipboardItem`, so asynchronous local lookup does not lose browser activation or
navigate the card. The projection preserves line breaks and inline links, then appends the
canonical post URL after one blank line. A media-only card therefore still yields
its source URL. Quoted cards are
independently scoped by their nearest post article and are not folded into the
parent text. Mutation observation covers infinite-scroll and recycled cards.
Once the direct link action is present, the duplicate **Copy link** entry is hidden
in X's Share menu; its other share choices remain available.

Clicking X's native **Bookmark** also asks the optional local `x.posts` capability
to retain the same complete Markdown. The pack waits until X changes the native
control to **Bookmarked**, so a failed site action does not create a local saved
post. Unbookmarking does not delete the local material.

When a full X Article is open, **Copy post as Markdown** projects its title,
cover, headings, lists, text and inline `pbs.twimg.com` images in document order,
then appends the canonical post URL. It reads the rendered Article and performs
no additional X request. X Articles expose action rows above and below the body;
both receive the direct copy actions. Ordinary posts retain one action set.

Column bindings live in `adapters/columns.js`; post identity, placement and menu
presentation are separate site adapters. `primaryColumn` and `sidebarColumn` were
observed in the authenticated desktop page. X omits the latter on narrow viewports.
X Article previews remain previews unless X exposes their article body in the post
document. Build/check with TAP Pack SDK.
