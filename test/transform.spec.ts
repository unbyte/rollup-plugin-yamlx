import PluginYamlX from '../src'

type TestTransformer = (code: string, fileName: string) => Promise<string>

describe('Rollup Plugin YamlX', () => {
  const singleSample = `
a: 1
b: true
c:
  - x: 1
    y: 2
    z: 3
`

  const multiSample = `
a: 1
b: true
c:
  - x: 1
    y: 2
    z: 3
---
a: 1
b: false
c:
  - x: 1
    y: 2
    z: 3
`

  describe('basic usage', () => {
    let transform: TestTransformer
    beforeEach(() => {
      transform = PluginYamlX().transform as TestTransformer
    })

    it(`should default-export the first document by default`, async () => {
      const code = await transform(multiSample, 'test.yaml')
      expect(code).toBe(
        `export default { a:1,
  b:true,
  c:[ { x:1,
      y:2,
      z:3 } ] };`
      )
    })

    it(`should default-export an array of documents if 'multi' enabled`, async () => {
      const code = await transform(multiSample, 'test.yaml?multi')
      expect(code).toBe(
        `export default [ { a:1,
    b:true,
    c:[ { x:1,
        y:2,
        z:3 } ] },
  { a:1,
    b:false,
    c:[ { x:1,
        y:2,
        z:3 } ] } ];`
      )
    })

    it(`should default-export an array of documents even there is only one document if 'multi' enabled `, async () => {
      const code = await transform(singleSample, 'test.yaml?multi')
      expect(code).toBe(
        `export default [ { a:1,
    b:true,
    c:[ { x:1,
        y:2,
        z:3 } ] } ];`
      )
    })

    it(`should named-export and default-export the first document by default if 'named' enabled`, async () => {
      const code = await transform(singleSample, 'test.yaml?named')
      expect(code).toBe(
        `export default { a:1,
  b:true,
  c:[ { x:1,
      y:2,
      z:3 } ] };
export const a = 1;
export const b = true;
export const c = [ { x:1,
    y:2,
    z:3 } ];`
      )
    })

    it(`should only default-export even if both 'multi' and 'named' enabled`, async () => {
      const code = await transform(multiSample, 'test.yaml?multi&named')
      expect(code).toBe(
        `export default [ { a:1,
    b:true,
    c:[ { x:1,
        y:2,
        z:3 } ] },
  { a:1,
    b:false,
    c:[ { x:1,
        y:2,
        z:3 } ] } ];`
      )
    })

    it(`should only named-export if both 'no-default' and 'named' enabled`, async () => {
      const code = await transform(singleSample, 'test.yaml?no-default&named')
      expect(code).toBe(
        `export const a = 1;
export const b = true;
export const c = [ { x:1,
    y:2,
    z:3 } ];`
      )
    })

    it(`should default-export the specified document by default if 'index' specified`, async () => {
      const code = await transform(multiSample, 'test.yaml?index=1')
      expect(code).toBe(
        `export default { a:1,
  b:false,
  c:[ { x:1,
      y:2,
      z:3 } ] };`
      )
    })

    it(`should named-export the specified document by default if both 'named' and 'no-default' enabled and 'index' specified`, async () => {
      const code = await transform(
        multiSample,
        'test.yaml?named&no-default&index=1'
      )
      expect(code).toBe(
        `export const a = 1;
export const b = false;
export const c = [ { x:1,
    y:2,
    z:3 } ];`
      )
    })

    it(`should throw error if both 'no-default' and 'no-named' enabled`, async () => {
      await expect(() =>
        transform(multiSample, 'test.yaml?no-default&no-named')
      ).rejects.not.toBeNull()
    })

    it(`should throw error if index is out of the number of documents`, async () => {
      await expect(() =>
        transform(multiSample, 'test.yaml?index=2')
      ).rejects.not.toBeNull()
    })
  })

  describe('custom filter', () => {
    it(`should ignore excluded files`, async () => {
      const transform = PluginYamlX({
        exclude: ['*.ignore*'],
      }).transform as TestTransformer
      expect(await transform(multiSample, 'a.ignore.yaml?multi')).toBeNull()
      expect(await transform(multiSample, 'a.ignore.yml?multi')).toBeNull()
      expect(await transform(multiSample, 'a.yml?multi')).not.toBeNull()
    })

    it(`should only transform included files`, async () => {
      const transform = PluginYamlX({
        include: [/(en|zh)\.ya?ml/],
      }).transform as TestTransformer
      expect(await transform(multiSample, 'a.yaml?multi')).toBeNull()
      expect(await transform(multiSample, 'b.yml?multi')).toBeNull()
      expect(await transform(multiSample, 'zh.yml?multi')).not.toBeNull()
      expect(await transform(multiSample, 'en.yml?multi')).not.toBeNull()
    })
  })

  describe('custom transform', () => {
    let fn: jest.MockedFunction<any>
    let transform: TestTransformer
    beforeEach(() => {
      fn = jest.fn(() => {})
      transform = PluginYamlX({ transform: fn }).transform as TestTransformer
    })

    it(`should apply transformer to all documents when 'multi' enabled`, async () => {
      await transform(multiSample, 'test.yaml?multi')
      expect(fn.mock.calls.length).toBe(2)
    })

    it(`should only apply transformer once when 'multi' not enabled`, async () => {
      await transform(multiSample, 'test.yaml')
      expect(fn.mock.calls.length).toBe(1)
    })
  })
})
