export type Route =
  | { name: 'home' }
  | { name: 'module'; id: string }
  | { name: 'lesson'; id: string }
  | { name: 'problem'; id: string }
  | { name: 'notFound'; path: string };

const ITEM = /^\/(m|l|p)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { name: 'home' };
  const m = ITEM.exec(path);
  if (m) {
    const id = m[2] as string;
    if (m[1] === 'm') return { name: 'module', id };
    if (m[1] === 'l') return { name: 'lesson', id };
    return { name: 'problem', id };
  }
  return { name: 'notFound', path };
}

export function href(route: Exclude<Route, { name: 'notFound' }>): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'module':
      return `#/m/${route.id}`;
    case 'lesson':
      return `#/l/${route.id}`;
    case 'problem':
      return `#/p/${route.id}`;
  }
}

export function startRouter(win: Window, onRoute: (r: Route) => void): () => void {
  const fire = () => onRoute(parseRoute(win.location.hash));
  win.addEventListener('hashchange', fire);
  fire();
  return () => win.removeEventListener('hashchange', fire);
}
