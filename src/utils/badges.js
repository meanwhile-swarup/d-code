export const difficultyBadge = (d) => {
  if (d === "Easy") return "text-success bg-success/12 border border-success/25"
  if (d === "Medium") return "text-warning bg-warning/12 border border-warning/25"
  return "text-danger bg-danger/12 border border-danger/25"
}

export const statusBadge = (status) => {
  if (status === "Online") return "text-success bg-success/12 border border-success/25"
  if (status === "In battle") return "text-warning bg-warning/12 border border-warning/25"
  return "text-text-tertiary bg-text-tertiary/12 border border-text-tertiary/25"
}

export const resultBadge = (result) => {
  if (result === "W") return "text-success bg-success/12 border border-success/25"
  return "text-danger bg-danger/12 border border-danger/25"
}

export const typeBadge = (type) => {
  if (type === "Ranked") return "text-warning bg-warning/12 border border-warning/25"
  return "text-accent bg-accent/12 border border-accent/25"
}
