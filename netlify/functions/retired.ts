export default async function () {
  return new Response(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page retired | NightSky.earth</title><h1>This chapter is for another night.</h1><p>Our former experiences page has been retired.</p><a href="/">Explore NightSky</a></html>',
    {
      status: 410,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
