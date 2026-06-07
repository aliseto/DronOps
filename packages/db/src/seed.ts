// Seed runner (privileged admin client; bypasses RLS). Idempotent seeds go
// here as domain tables arrive. No-op for now.
async function main() {
  console.log("nothing to seed yet");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
