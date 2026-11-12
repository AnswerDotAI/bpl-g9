const article = document.querySelector('#about-content');
try {
  const [response, {marked}] = await Promise.all([
    fetch(new URL('../about.md', import.meta.url)),
    import('https://cdn.jsdelivr.net/npm/marked@15.0.12/lib/marked.esm.js'),
  ]);
  if (!response.ok) throw new Error(`Could not load the guide (${response.status})`);
  article.innerHTML = marked.parse(await response.text());
} catch (error) {
  article.textContent = 'Could not load the guide. The Markdown source is linked above.';
  console.error(error);
} finally { article.removeAttribute('aria-busy'); }
