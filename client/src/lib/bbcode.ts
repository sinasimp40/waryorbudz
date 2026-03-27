export function renderBBCode(bbcode: string): string {
  if (!bbcode) return '';
  
  const linkClass = 'inline-flex items-center gap-1 text-primary font-medium underline decoration-primary/40 underline-offset-2 hover:decoration-primary hover:opacity-90 transition-all';
  const linkIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

  let html = bbcode
    .replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div class="text-center">$1</div>')
    .replace(/\[left\]([\s\S]*?)\[\/left\]/gi, '<div class="text-left">$1</div>')
    .replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<div class="text-right">$1</div>')
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>')
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>')
    .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')
    .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>')
    .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="border-l-4 border-primary pl-4 italic opacity-80 my-2">$1</blockquote>')
    .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono whitespace-pre-wrap">$1</code>')
    .replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, `<a href="$1" target="_blank" rel="noopener" class="${linkClass}">$2 ${linkIcon}</a>`)
    .replace(/\[url\](.*?)\[\/url\]/gi, `<a href="$1" target="_blank" rel="noopener" class="${linkClass}">$1 ${linkIcon}</a>`)
    .replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" alt="" class="inline-block max-w-full h-auto max-h-[150px] object-contain rounded my-2" />')
    .replace(/\[color=(.*?)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>')
    .replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi, '<span style="font-size:$1px">$2</span>')
    .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, content) => {
      const items = content.split(/\[\*\]/).filter((item: string) => item.trim()).map((item: string) => `<li>${item.trim()}</li>`).join('');
      return `<ul class="list-disc pl-5 space-y-1 my-2">${items}</ul>`;
    })
    .replace(/\n/g, '<br />');

  html = html.replace(
    /(?<!["'=])(https?:\/\/[^\s<>"']+)/gi,
    (match) => {
      if (match.endsWith(')') || match.endsWith('.')) {
        match = match.slice(0, -1);
      }
      return `<a href="${match}" target="_blank" rel="noopener" class="${linkClass}">${match} ${linkIcon}</a>`;
    }
  );

  return html;
}
