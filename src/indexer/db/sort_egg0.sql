SELECT 
    id,
    meta->>'name' as name,
    meta->>'high_res_img_url' as image_url
FROM inscriptions
ORDER BY (regexp_replace(meta->>'name', '\D', '', 'g'))::integer DESC;