# SMS IL Tracker Viewer

This is a simple web project made with no libraries beyond jQuery. It's a **leaderboard viewer** for Super Mario Sunshine individual-level speedruns, and is currently live [here](https://smsilview.netlify.app). See also its sister project [**il-leaderboard-2023**](https://github.com/pyorot/il-leaderboard-2023), which generates the data it uses.

### Publication

Published on: 2023/06/20 (v1), 2023/12/01 (v2).

Past versions of this app are accessible on branch subdomains:
* v0.1: <https://v0--smsilview.netlify.app/1>
* v0.2: <https://v0--smsilview.netlify.app>
* v1.2: <https://v1--smsilview.netlify.app>

The current version with fixed data snapshots is available here:
* <https://history--smsilview.netlify.app>

### Development Environment
HTML and CSS are generated locally by preprocessors, [Pug](https://pugjs.org/) and [Sass](https://sass-lang.com/) respectively. It's recommended to use these via the Live Sass/Pug Compiler VSCode extensions, paired with Live Server, so that all files are generated live during development (Pug was only picked because it's the only such preprocessor that has such a plugin). Both source and generated files are included in this repository, side-by-side.
