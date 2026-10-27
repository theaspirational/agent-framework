// Optional source overlay for same-install base/final comparisons. Never checks
// out a branch and never resolves/installs packages. Use only in local tests.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const base = '4976c67d5c7916a15046c627b68913994c33b3cb';
const root = fileURLToPath(new URL('../', import.meta.url));
const sources = new Map(['types', 'transport', 'protocol-family'].map(name => {
  const path = `src/mcpl/${name}.ts`;
  return [root + path, execFileSync('git', ['show', `${base}:${path}`], { cwd: root, encoding: 'utf8' })];
}));
if (process.versions.bun) {
  const { plugin } = await import('bun');
  plugin({ name: 'mcpl-credential-base', setup(build) {
    build.onLoad({ filter: /src\/mcpl\/(types|transport|protocol-family)\.ts$/ }, args => {
      const contents = sources.get(args.path);
      if (contents !== undefined) return { contents, loader: 'ts' };
    });
  } });
} else {
  const { registerHooks } = await import('node:module');
  const { transformSync } = await import('esbuild');
  registerHooks({ load(url, context, next) {
    const source = url.startsWith('file:') ? sources.get(fileURLToPath(url)) : undefined;
    if (source !== undefined) return { format: 'module', shortCircuit: true,
      source: transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code };
    return next(url, context);
  } });
}
