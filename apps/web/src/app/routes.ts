import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	type RouteConfigEntry,
	index,
	route,
} from '@react-router/dev/routes';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

type Tree = {
	path: string;
	children: Tree[];
	hasPage: boolean;
	routeFile: string | null;
	isParam: boolean;
	paramName: string;
	isCatchAll: boolean;
};

function buildRouteTree(dir: string, basePath = ''): Tree {
	const files = readdirSync(dir);
	const node: Tree = {
		path: basePath,
		children: [],
		hasPage: false,
		routeFile: null,
		isParam: false,
		isCatchAll: false,
		paramName: '',
	};

	const dirName = basePath.split('/').pop();
	if (dirName?.startsWith('[') && dirName.endsWith(']')) {
		node.isParam = true;
		const paramName = dirName.slice(1, -1);
		if (paramName.startsWith('...')) {
			node.isCatchAll = true;
			node.paramName = paramName.slice(3);
		} else {
			node.paramName = paramName;
		}
	}

	for (const file of files) {
		const filePath = join(dir, file);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			const childPath = basePath ? `${basePath}/${file}` : file;
			// Skip Create.xyz internal platform routes — they have circular imports
			// and are not part of the application's API surface.
			if (childPath === 'api/__create') continue;
			node.children.push(buildRouteTree(filePath, childPath));
		} else if (file === 'page.jsx') {
			node.hasPage = true;
		} else if (file === 'route.js' || file === 'route.ts') {
			node.routeFile = file;
		}
	}

	return node;
}

function toRouterPath(nodePath: string): string {
	return nodePath
		.split('/')
		.map((segment) => {
			if (!segment.startsWith('[') || !segment.endsWith(']')) return segment;
			const inner = segment.slice(1, -1);
			if (inner.startsWith('...')) return '*';
			if (inner.startsWith('[') && inner.endsWith(']')) return `:${inner.slice(1, -1)}?`;
			return `:${inner}`;
		})
		.join('/');
}

function generateRoutes(node: Tree): RouteConfigEntry[] {
	const routes: RouteConfigEntry[] = [];

	if (node.hasPage) {
		const componentPath =
			node.path === '' ? `./page.jsx` : `./${node.path}/page.jsx`;
		if (node.path === '') {
			routes.push(index(componentPath));
		} else {
			routes.push(route(toRouterPath(node.path), componentPath));
		}
	}

	if (node.routeFile && node.path !== '') {
		routes.push(route(toRouterPath(node.path), `./${node.path}/${node.routeFile}`));
	}

	for (const child of node.children) {
		routes.push(...generateRoutes(child));
	}

	return routes;
}

// These glob calls tell Vite this file uses dynamic imports — required for
// correct build-time vs browser bundling behaviour in React Router v7.
if ((import.meta as any).env?.DEV) {
	(import.meta as any).glob('./**/page.jsx', {});
	(import.meta as any).glob('./**/route.js', {});
	if ((import.meta as any).hot) {
		(import.meta as any).hot.accept((_newSelf: unknown) => {
			(import.meta as any).hot?.invalidate();
		});
	}
}

const tree = buildRouteTree(__dirname);
const notFound = route('*?', './__create/not-found.tsx');
const routes = [...generateRoutes(tree), notFound];

export default routes;
