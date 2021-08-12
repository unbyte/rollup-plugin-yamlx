[npm]: https://badgen.net/npm/v/rollup-plugin-yamlx
[npm-url]: https://www.npmjs.com/package/rollup-plugin-yamlx
[size]: https://packagephobia.now.sh/badge?p=rollup-plugin-yamlx
[size-url]: https://packagephobia.now.sh/result?p=rollup-plugin-yamlx
[license]: https://badgen.net/npm/license/vite-plugin-macro
[license-url]: https://github.com/unbyte/rollup-plugin-yamlx/blob/master/LICENSE
[types]: https://badgen.net/npm/types/rollup-plugin-yamlx

# rollup-plugin-yamlx

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![license][license]][license-url]
![types][types]

🍣 An enhanced Rollup/Vite plugin which converts YAML files to ES6 modules.

## Install

```bash
$ npm install -D rollup-plugin-yamlx
# or
# yarn add -D rollup-plugin-yamlx
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import PluginYamlX from 'rollup-plugin-yamlx'

export default {
  plugins: [PluginYamlX()]
}
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

With an accompanying file `src/index.js`, the local `heroes.yaml` file would now be importable as seen below:

```js
// src/index.js
import { batman } from './heroes.yaml?named';

console.log(`na na na na ${batman}`);
```

## Options

### Import Options

Users can use below query params in import path to specify how the plugin converts yaml to esm.

- `multi` - get an array of documents of the yaml file.
- `single` - get one of the documents of the yaml file.
- `index` - use `index` to specify which one document should be returned when 'single' is enabled.
- `named` - generate named-exports for the top-level fields of the returned document.
- `no-named` - do not generate named-exports. This option is always enabled when 'multi' enabled.
- `default` - generate default-export for the returned document.
- `no-default` - do not generate default-export for the returned document.

By default `single` and `default` is enabled, and `index` is 0,
which means you can get default-export of the first document in `some.yaml` easily:

```
import doc from 'some.yaml'
```

See [test cases](https://github.com/unbyte/rollup-plugin-yamlx/blob/master/test/transform.spec.ts) for more examples.

### Plugin Options

```typescript
declare type YamlXOptions = {
    /**
     * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
     * should operate on.
     * By default all files are targeted.
     */
    include?: FilterPattern;
    /**
     * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
     * should _ignore_.
     * By default no files are ignored.
     */
    exclude?: FilterPattern;
    /**
     * A function which can optionally mutate parsed YAML.
     * The function should return the mutated result, or `undefined` which will make no changes to
     * the parsed YAML.
     */
    transform?: (data: ValidYamlType, filePath: string) => ValidYamlType | undefined;
    /**
     * Schema used to parse yaml files.
     * See https://github.com/nodeca/js-yaml/blob/49baadd52af887d2991e2c39a6639baa56d6c71b/README.md#load-string---options-
     */
    schema?: Schema;
};
```

## License

MIT License © 2021 [unbyte](https://github.com/unbyte)
