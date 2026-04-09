import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FALLBACK_SITE_URL = "https://www.istm-kinshasa.ac.cd";
const SITE_NAME = "ISTM Kinshasa - Institut Supérieur des Techniques Médicales";
const SITE_DESCRIPTION = "Institut Supérieur des Techniques Médicales de Kinshasa - Formation médicale d'excellence";

const SOCIAL_BOT_PATTERNS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "telegrambot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
  "applebot",
  "ia_archiver",
  "embedly",
  "pinterest",
];

function isSocialBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return SOCIAL_BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const contentId = url.searchParams.get("contenu");
    const appUrl = url.searchParams.get("app_url") || FALLBACK_SITE_URL;
    const userAgent = req.headers.get("user-agent") || "";

    const siteUrl = appUrl.replace(/\/$/, "");
    const targetUrl = `${siteUrl}/?contenu=${contentId}`;

    if (!contentId) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: siteUrl },
      });
    }

    if (!isSocialBot(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: targetUrl,
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: content } = await supabase
      .from("content_items")
      .select("id, title, description, thumbnail, images, type")
      .eq("id", contentId)
      .maybeSingle();

    const shareParams = new URLSearchParams({ contenu: contentId, app_url: appUrl });
    const canonicalUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/og-preview?${shareParams.toString()}`;
    const defaultImage = `${siteUrl}/image.png`;

    let title = SITE_NAME;
    let description = SITE_DESCRIPTION;
    let image = defaultImage;

    if (content) {
      title = `${content.title} - ISTM Kinshasa`;
      description = content.description
        ? content.description.replace(/<[^>]*>/g, "").substring(0, 200)
        : SITE_DESCRIPTION;

      if (content.thumbnail && content.thumbnail.trim() !== "") {
        image = content.thumbnail;
      } else if (Array.isArray(content.images) && content.images.length > 0 && content.images[0]) {
        image = content.images[0];
      }
    }

    const escaped = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escaped(title)}</title>
  <meta name="description" content="${escaped(description)}" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="ISTM Kinshasa" />
  <meta property="og:title" content="${escaped(title)}" />
  <meta property="og:description" content="${escaped(description)}" />
  <meta property="og:image" content="${escaped(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escaped(canonicalUrl)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escaped(title)}" />
  <meta name="twitter:description" content="${escaped(description)}" />
  <meta name="twitter:image" content="${escaped(image)}" />
</head>
<body>
  <p><a href="${escaped(targetUrl)}">${escaped(title)}</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("og-preview error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
