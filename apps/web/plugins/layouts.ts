// vite-react-hierarchical-layouts.ts
import fs from 'node:fs';
import path from 'node:path';
import type { PluginContext } from 'rollup';
import { normalizePath, type Plugin } from 'vite';

export interface HierarchicalLayoutOptions {
  /**
   * RegExp that identifies a “page” file.
   * Default:   /\/page\.(jsx?|tsx?)$/
   */
  pagePattern?: RegExp;
  /**
   * File names to look for when searching for a layout in each directory.
   * The first match wins. Default: ['layout.jsx', 'layout.tsx']
   */
  layoutFiles?: string[];
  /**
   * Absolute paths that act as “roots”.
   * The upward walk stops once we reach any of these.
   * Default: the Vite project root (`config.root`)
   */
  srcRoots?: string[];
}

const DEFAULT_PAGE_PATTERN = /\/page\.(jsx?)$/;
const DEFAULT_LAYOUT_FILES = ['layout.jsx'];
const DEFAULT_PARAM_PATTERN = /\[(\.{3})?([^\]]+)\]/g;
const NO_LAYOUT_QUERY = '?noLayout.jsx';

export function layoutWrapperPlugin(userOpts: HierarchicalLayoutOptions = {}): Plugin {
  const opts: Required<HierarchicalLayoutOptions> = {
    pagePattern: userOpts.pagePattern ?? DEFAULT_PAGE_PATTERN,
    layoutFiles: userOpts.layoutFiles ?? DEFAULT_LAYOUT_FILES,
    srcRoots: userOpts.srcRoots ?? [path.join(__dirname, '../src')],
  };

  return {
    name: 'vite-react-hierarchical-layouts',
    enforce: 'pre',

    // Teach Rollup (SSR build) that ?noLayout.jsx is a virtual module backed
    // by the real file at the same path minus the query. Without this,
    // Rollup tries to open a file literally named "page.jsx?noLayout.jsx"
    // (which doesn't exist) and emits a sourcemap error instead of the real one.
    resolveId(id, importer) {
      if (!id.includes(NO_LAYOUT_QUERY)) return null;
      // Already an absolute path — pass through unchanged.
      if (path.isAbsolute(id)) return id;
      // Relative import from the wrapper — resolve against the importer.
      if (importer && (id.startsWith('./') || id.startsWith('../'))) {
        const realPath = path.resolve(path.dirname(importer.split('?')[0]), id.split('?')[0]);
        return normalizePath(realPath) + NO_LAYOUT_QUERY;
      }
      return null;
    },

// Supply raw file content for ?noLayout.jsx virtual modules.
    // Without this, Rollup (SSR production build) tries to open a literal file
    // named "page.jsx?noLayout.jsx" on disk which doesn't exist.
    load(id) {
      if (!id.includes(NO_LAYOUT_QUERY)) return null;
      const realPath = id.split('?')[0];
      if (!fs.existsSync(realPath)) return null;
      // Strip 'use client'/'use server' directives — they're RSC-only and cause
      // Rollup to emit MODULE_LEVEL_DIRECTIVE warnings that reference line 1:0
      // of the virtual module. Babel's generated jsx-runtime import occupies
      // line 1 and has no sourcemap entry, so Rollup can't display the warning
      // location and emits SOURCEMAP_ERROR instead.
      const code = fs.readFileSync(realPath, 'utf-8').replace(/^['"]use (client|server)['"];?\r?\n?/m, '');
      return { code, map: null };
    },

    /* ——— turn any   src/foo/bar/page.jsx   into a wrapper ——— */
    async transform(_code, id) {
      if (opts.pagePattern.test(id) && !id.includes(NO_LAYOUT_QUERY)) {
        return buildWrapper.call(this, id);
      }
      // ?noLayout.jsx virtual modules have their JSX already converted to JS by
      // the addRenderIds plugin (Babel) which runs earlier. Returning null here
      // lets Rollup keep the Babel-generated sourcemap (which correctly maps
      // back to the real file), avoiding a double-transform that shifts line
      // numbers and produces wrong sourcemap positions for 'use client' warnings.
      return null;
    },
  };

  /**
   * Walk from `pagePath` upward, collecting each directory’s first matching layout file.
   * Returned order: outermost → innermost (root‑first).
   */
  function collectLayouts(pagePath: string, o: Required<HierarchicalLayoutOptions>) {
    const layouts: { absFile: string; hasExport: boolean }[] = [];
    let dir = path.dirname(pagePath);

    const stopDirs = o.srcRoots.map((r) => path.resolve(r));

    while (true) {
      for (const name of o.layoutFiles) {
        const candidate = path.join(dir, name);
        // this ensures we don't try to include layouts that don't export anything
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          const hasExport = fs.readFileSync(candidate, 'utf-8').includes('export');
          layouts.unshift({ absFile: candidate, hasExport });
        }
      }
      if (stopDirs.includes(dir)) break;
      const parent = path.dirname(dir);
      if (parent === dir) break; // reached filesystem root
      dir = parent;
    }
    return layouts;
  }
  /**
   * Extract route parameters from a file path.
   * For example, from '/users/[id]/posts/[postId]/page.tsx' it extracts ['id', 'postId']
   * Also handles spread parameters like '/files/[...path]/page.tsx' -> ['path']
   */
  function extractRouteParams(pagePath: string, paramPattern: RegExp): string[] {
    const relativePath = normalizePath(pagePath);
    const params: string[] = [];
    const matches = relativePath.matchAll(new RegExp(paramPattern));

    for (const match of matches) {
      // match[1] will be "..." if it's a spread parameter, otherwise undefined
      // match[2] will be the parameter name
      if (match[2]) {
        params.push(match[2]);
      }
    }

    return params;
  }
  /**
   * Build the wrapper module that nests the route page inside any matching
   * layouts. Call this from the `transform` hook and return its output directly.
   */
  function buildWrapper(this: PluginContext, pagePath: string): string {
    const layouts = collectLayouts(pagePath, opts);

    // Tell Vite to watch these layout files for changes
    for (const layout of layouts) {
      this.addWatchFile(layout.absFile);
    }

    // route params like [id] or [...slug]
    const routeParams = extractRouteParams(pagePath, DEFAULT_PARAM_PATTERN);
    const hasSpreadParams = /\[\.{3}[^\]]+\]/.test(normalizePath(pagePath));

    /* ---------- imports ---------- */
    const imports: string[] = [];
    const opening: string[] = [];
    const closing: string[] = [];

    layouts.forEach(({ absFile, hasExport }, i) => {
      const varName = `Layout${i}`;
      imports.push(`import ${varName} from ${JSON.stringify(absFile)};`);
      if (hasExport) {
        opening.push(`<${varName}>`);
        closing.unshift(`</${varName}>`);
      }
    });

    // import the actual page with a flag to skip re-wrapping
    imports.push(`import Page from ${JSON.stringify(pagePath + NO_LAYOUT_QUERY)};`);

    if (routeParams.length > 0) {
      imports.push(
        `import { useParams${hasSpreadParams ? ', useLocation' : ''} } from 'react-router-dom';`
      );
    }

    /* ---------- module body ---------- */
    return `
${imports.join('\n')}

export default function WrappedPage(props) {
  ${routeParams.length > 0 ? 'const params = useParams();' : ''}
  ${hasSpreadParams ? 'const location = useLocation();' : ''}
  return (
    ${opening.join('\n    ')}
      <Page {...props}${
        routeParams.length > 0
          ? routeParams
              .map((param) =>
                pagePath.includes(`[...${param}]`)
                  ? // collect the rest of the path for spread params
                    `${param}={location.pathname
                      .split('/')
                      .slice(
                        location.pathname
                          .split('/')
                          .findIndex(Boolean) + 1
                      )}`
                  : `${param}={params.${param}}`
              )
              .join(' ')
          : ''
      } />
    ${closing.join('\n    ')}
  );
}
`;
  }
}
