import type { Plugin } from 'rollup'
import {
  createFilter,
  FilterPattern,
  makeLegalIdentifier,
} from '@rollup/pluginutils'
import { DEFAULT_SCHEMA, loadAll, Schema } from 'js-yaml'
import toSource from 'tosource'

type ValidYamlType =
  | number
  | string
  | boolean
  | null
  | { [key: string]: ValidYamlType }
  | ValidYamlType[]

export type YamlXOptions = {
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should operate on.
   * By default all files are targeted.
   */
  include?: FilterPattern
  /**
   * A minimatch pattern, or array of patterns, which specifies the files in the build the plugin
   * should _ignore_.
   * By default no files are ignored.
   */
  exclude?: FilterPattern
  /**
   * A function which can optionally mutate parsed YAML.
   * The function should return the mutated result, or `undefined` which will make no changes to
   * the parsed YAML.
   */
  transform?: (
    data: ValidYamlType,
    filePath: string
  ) => ValidYamlType | undefined
  /**
   * Schema used to parse yaml files.
   * See https://github.com/nodeca/js-yaml/blob/49baadd52af887d2991e2c39a6639baa56d6c71b/README.md#load-string---options-
   */
  schema?: Schema
}

export default function PluginYamlX(
  { include, exclude, transform, schema }: YamlXOptions = {
    schema: DEFAULT_SCHEMA,
  }
): Plugin {
  const filter = createFilter(include, exclude)
  const ext = /\.ya?ml$/

  const transformer: (data: ValidYamlType, filePath: string) => ValidYamlType =
    transform && typeof transform === 'function'
      ? (data, id) => {
          const result = transform(data, id)
          if (result !== undefined) return result
          return data
        }
      : (data) => data

  return {
    name: 'yamlx',
    async transform(content, id) {
      const options = parseQuery(id)

      if (!ext.test(options.filename)) return null
      if (!filter(options.filename)) return null

      const documents = loadAll(content, undefined, { schema })

      if (options.mode === 'multi') {
        const data = documents.map((data) => transformer(data, id))
        return `export default ${toSource(data)};`
      }

      if (options.index >= documents.length)
        throw new Error(
          `Cannot get the #${options.index} document from '${options.filename}' because it only has ${documents.length} documents.`
        )
      const data = transformer(documents[options.index], id)
      const code: string[] = []
      {
        if (options.default) code.push(`export default ${toSource(data)};`)
        if (
          options.named &&
          typeof data === 'object' &&
          data !== null &&
          !Array.isArray(data)
        ) {
          Object.keys(data)
            .map((key) => ({ key, identifier: makeLegalIdentifier(key) }))
            .filter(({ identifier }) => identifier !== '_')
            .forEach(({ key, identifier }) =>
              code.push(`export const ${identifier} = ${toSource(data[key])};`)
            )
        }
      }

      return code.join('\n')
    },
  }
}

type Options = (
  | {
      mode: 'single'
      index: number
      named: boolean
      default: boolean
    }
  | { mode: 'multi' }
) & {
  filename: string
}

function parseQuery(id: string): Options {
  const [filename, query] = id.split('?')
  const options: Options = {
    filename,
    mode: 'single',
    index: 0,
    default: true,
    named: false,
  }
  if (!query) return options
  const params = new URLSearchParams(query)
  if (params.has('multi')) return { filename, mode: 'multi' }
  if (params.has('single')) options.mode = 'single'
  {
    const index = params.get('index')
    if (index && /^\d+$/.test(index)) options.index = Number.parseInt(index)
  }
  if (params.has('named')) options.named = true
  if (params.has('no-named')) options.named = false
  if (params.has('default')) options.default = true
  if (params.has('no-default')) options.default = false

  if (!options.default && !options.named)
    throw new Error(
      `no-named and no-default cannot exist at the same time in '${id}'`
    )
  return options
}
