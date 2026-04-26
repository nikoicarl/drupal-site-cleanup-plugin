const { query } = require('../config/db');

// ── Posts ──────────────────────────────────────────────────

/**
 * GET /api/community/posts
 * Query params: page, limit
 * Schema: posts has is_published (bool), body, media_urls, post_type.
 * No slug, excerpt, cover_image_url, or status column on posts.
 */
exports.listPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows } = await query(
      `SELECT po.id, po.title, po.body, po.media_urls, po.post_type,
              po.view_count, po.like_count, po.comment_count, po.created_at,
              pr.display_name AS author_name,
              pr.avatar_url   AS author_avatar
       FROM posts po
       JOIN profiles pr ON pr.user_id = po.author_id
       WHERE po.is_published = TRUE
         AND po.deleted_at IS NULL
       ORDER BY po.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    res.json({ data: rows, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/community/posts
 * Body: { title?, body, mediaUrls?, postType? }
 * Schema: posts has no slug, excerpt, or cover_image_url.
 */
exports.createPost = async (req, res, next) => {
  try {
    const { title, body, mediaUrls, postType = 'status' } = req.body;

    if (!body && (!mediaUrls || !mediaUrls.length)) {
      return res.status(400).json({ error: 'Post must have body text or media' });
    }

    const { rows } = await query(
      `INSERT INTO posts (author_id, title, body, media_urls, post_type, is_published)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [req.user.id, title ?? null, body ?? null, mediaUrls ?? null, postType]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// ── Recipes ────────────────────────────────────────────────

/**
 * GET /api/community/recipes
 * Query params: cuisineType, difficulty, page, limit
 * Schema: recipes has cuisine_type (not cuisine), prep_time_min (not prep_time_mins),
 *         cook_time_min (not cook_time_mins), is_published (not status).
 */
exports.listRecipes = async (req, res, next) => {
  try {
    const { cuisineType, difficulty, page = 1, limit = 20 } = req.query;
    const params = [];
    const conditions = ['r.is_published = TRUE', 'r.deleted_at IS NULL'];

    if (cuisineType) {
      params.push(cuisineType);
      conditions.push(`r.cuisine_type = $${params.length}`);
    }
    if (difficulty) {
      params.push(difficulty);
      conditions.push(`r.difficulty = $${params.length}`);
    }

    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await query(
      `SELECT r.id, r.title, r.slug, r.description,
              r.cuisine_type, r.difficulty,
              r.prep_time_min, r.cook_time_min, r.servings,
              r.dietary_tags,
              r.like_count, r.view_count, r.rating_avg,
              r.created_at,
              pr.display_name AS author_name,
              pr.avatar_url   AS author_avatar,
              -- first cover image if available
              (SELECT url FROM recipe_images
               WHERE recipe_id = r.id AND is_cover = TRUE
               LIMIT 1) AS cover_image_url
       FROM recipes r
       JOIN profiles pr ON pr.user_id = r.author_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/community/recipes/:id
 * Schema: ingredients and instructions are JSONB columns on the recipes row,
 *         NOT separate recipe_ingredients / recipe_steps tables.
 */
exports.getRecipe = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.id, r.title, r.slug, r.description,
              r.ingredients, r.instructions,
              r.cuisine_type, r.difficulty,
              r.prep_time_min, r.cook_time_min, r.servings,
              r.dietary_tags, r.like_count, r.view_count, r.rating_avg,
              r.created_at, r.updated_at,
              pr.display_name AS author_name,
              pr.avatar_url   AS author_avatar,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id',         ri.id,
                    'url',        ri.url,
                    'alt_text',   ri.alt_text,
                    'is_cover',   ri.is_cover,
                    'sort_order', ri.sort_order
                  ) ORDER BY ri.sort_order
                ) FILTER (WHERE ri.id IS NOT NULL),
                '[]'
              ) AS images
       FROM recipes r
       JOIN profiles pr ON pr.user_id = r.author_id
       LEFT JOIN recipe_images ri ON ri.recipe_id = r.id
       WHERE r.id = $1 AND r.deleted_at IS NULL
       GROUP BY r.id, pr.display_name, pr.avatar_url`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });

    // Increment view count (fire-and-forget)
    query('UPDATE recipes SET view_count = view_count + 1 WHERE id = $1', [req.params.id])
      .catch(() => {});

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
