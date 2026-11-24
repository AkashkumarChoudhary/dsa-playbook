export type Route =
  | { name: 'home' }
  | { name: 'dashboard' }
  | { name: 'roadmap' }
  | { name: 'settings' }
  | { name: 'drills'; moduleId?: string }
  | { name: 'cards'; deck?: string }
  | { name: 'sheet'; id: string }
  | { name: 'module'; id: string }
  | { name: 'lesson'; id: string }
  | { name: 'problem'; id: string }
  | { name: 'notFound'; path: string };

const ITEM = /^\/(m|l|p|sheets|cards|drills)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;
const PAGES: Record<string, Route> = {
  '/dashboard': { name: 'dashboard' },
  '/roadmap': { name: 'roadmap' },
  '/settings': { name: 'settings' },
  '/cards': { name: 'cards' },
  '/drills': { name: 'drills' },
};

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/') return { name: 'home' };
  const page = PAGES[path.replace(/\/$/, '')];
  if (page) return page;
  const m = ITEM.exec(path);
  if (m) {
    const id = m[2] as string;
    switch (m[1]) {
      case 'm':
        return { name: 'module', id };
      case 'l':
        return { name: 'lesson', id };
      case 'sheets':
        return { name: 'sheet', id };
      case 'cards':
        return { name: 'cards', deck: id };
      case 'drills':
        return { name: 'drills', moduleId: id };
      default:
        return { name: 'problem', id };
    }
  }
  return { name: 'notFound', path };
}

export function href(route: Exclude<Route, { name: 'notFound' }>): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'dashboard':
      return '#/dashboard';
    case 'roadmap':
      return '#/roadmap';
    case 'settings':
      return '#/settings';
    case 'drills':
      return route.moduleId ? `#/drills/${route.moduleId}` : '#/drills';
    case 'cards':
      return route.deck ? `#/cards/${route.deck}` : '#/cards';
    case 'sheet':
      return `#/sheets/${route.id}`;
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
