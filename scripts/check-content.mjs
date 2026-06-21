// Fails the build early with a clear message if the content submodule wasn't
// initialized (so we never deploy an empty site). Runs before `astro build`.
import { existsSync, readdirSync } from 'node:fs';

const folders = ['sports', 'projects', 'community', 'contributors'];
const missing = [];

for (const f of folders) {
  const dir = `content/${f}`;
  const hasMd =
    existsSync(dir) && readdirSync(dir).some((n) => n.endsWith('.md'));
  if (!hasMd) missing.push(f);
}

if (missing.length) {
  console.error(
    '\n\u001b[31m✗ Content is missing: ' +
      missing.join(', ') +
      '\u001b[0m\n' +
      'The `content/` git submodule does not appear to be initialized.\n' +
      'Locally run:  git submodule update --init --recursive\n' +
      'On Netlify set: GIT_SUBMODULE_STRATEGY = "recursive" (already in netlify.toml)\n'
  );
  process.exit(1);
}

console.log('✓ Content present (' + folders.join(', ') + ')');
