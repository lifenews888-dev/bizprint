/** Shared by server and client. It used to live in a 'use client' file,
 *  which crashed the server-rendered /posts/[slug] page. */
export const formatPostDate = (post: { published_at?: string | null; created_at: string }) =>
  new Date(post.published_at || post.created_at).toLocaleDateString('mn-MN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
