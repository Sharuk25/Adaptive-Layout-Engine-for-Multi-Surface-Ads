export type DegradationLevel = 0 | 1 | 2 | 3;

// Level 0: Preferred sizes, all elements
// Level 1: Minimum sizes, all elements
// Level 2: Minimum sizes, hide priority 3
// Level 3: Minimum sizes, hide priority 2 and 3

export function getDegradationName(level: DegradationLevel): string {
  switch (level) {
    case 0: return "None";
    case 1: return "Reduced Sizes";
    case 2: return "Dropped Optional (P3)";
    case 3: return "Dropped Secondary (P2+P3)";
    default: return "Unknown";
  }
}
