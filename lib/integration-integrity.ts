export function matchesRequestedSymbol(expected: string, actual: unknown) {
  return typeof actual === "string" && actual.trim().toUpperCase() === expected.trim().toUpperCase();
}

export class RequestGenerationGate {
  private generation = 0;

  begin() {
    this.generation += 1;
    return this.generation;
  }

  invalidate() {
    this.generation += 1;
  }

  isCurrent(generation: number) {
    return generation === this.generation;
  }
}
