module.exports = {
  // All blog posts will inherit this layout
  // which ensures they generate the right permalinks.
  layout: 'blog',
  // Create a path object so things like breadcrumbs can differentiate posts
  // coming from the blog versus other learning paths.
  path: {
    slug: 'blog',
    title: 'Blog',
    titleVariation: 'All articles',
  },
};
