export interface HasRect {
  id: string
  style: {
    position: { x: number; y: number }
    width: number
    height: number
  }
}

export class SpatialIndex<T extends HasRect> {
  private cellSize: number
  private grid = new Map<string, T[]>()

  constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  clear() {
    this.grid.clear()
  }

  private key(cx: number, cy: number) {
    return `${cx},${cy}`
  }

  insert(item: T) {
    const { x, y } = item.style.position
    const w = item.style.width
    const h = item.style.height
    const c1x = Math.floor(x / this.cellSize)
    const c1y = Math.floor(y / this.cellSize)
    const c2x = Math.floor((x + w) / this.cellSize)
    const c2y = Math.floor((y + h) / this.cellSize)
    for (let cx = c1x; cx <= c2x; cx++) {
      for (let cy = c1y; cy <= c2y; cy++) {
        const k = this.key(cx, cy)
        if (!this.grid.has(k)) this.grid.set(k, [])
        this.grid.get(k)!.push(item)
      }
    }
  }

  build(items: T[]) {
    this.clear()
    for (const it of items) this.insert(it)
  }

  queryNeighbors(rect: { x: number; y: number; width: number; height: number }, maxResults: number): T[] {
    const c1x = Math.floor(rect.x / this.cellSize)
    const c1y = Math.floor(rect.y / this.cellSize)
    const c2x = Math.floor((rect.x + rect.width) / this.cellSize)
    const c2y = Math.floor((rect.y + rect.height) / this.cellSize)
    const results: T[] = []
    const seen = new Set<string>()
    for (let cx = c1x - 1; cx <= c2x + 1; cx++) {
      for (let cy = c1y - 1; cy <= c2y + 1; cy++) {
        const bucket = this.grid.get(this.key(cx, cy))
        if (!bucket) continue
        for (const item of bucket) {
          if (seen.has(item.id)) continue
          seen.add(item.id)
          results.push(item)
          if (results.length >= maxResults) return results
        }
      }
    }
    return results
  }
} 