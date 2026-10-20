/-
Trusted checker for a compiled candidate proof.

Usage: lake env lean --run Checker.lean <dir> <module> <theoremName>

Runs in its own process after the untrusted source has been compiled to
<dir>/<module>.olean. It never runs code from the candidate: it reads the
module's declarations, rebuilds the environment from its (Mathlib) imports,
replays every declaration through the kernel (as `leanchecker` does), and
reads the theorem's axioms from the replayed environment. Anything the source
did while it was elaborated (fake `#print axioms` output, environment hacks)
can't affect the result.

Prints one JSON line: {"theorem", "axioms", "declarations"}. Exits non-zero
with a message on stderr if the module can't be checked.
-/
import Lean.CoreM
import Lean.Replay
import Lean.Util.CollectAxioms
import Lean.Data.Json

open Lean

-- Every module implicitly imports `Init`; proofs may only add Mathlib.
def allowedImport (module : Name) : Bool :=
  module == `Init || module.getRoot == `Mathlib

unsafe def check (dir : System.FilePath) (module theoremName : Name) : IO Json := do
  let file := dir / s!"{module}.olean"
  unless (← file.pathExists) do
    throw <| IO.userError s!"compiled proof not found: {file}"
  -- Load every part (exported, server, private) so no declaration escapes the replay.
  let mut fnames := #[file]
  let serverFile := OLeanLevel.server.adjustFileName file
  if (← serverFile.pathExists) then
    fnames := fnames.push serverFile
    let privateFile := OLeanLevel.private.adjustFileName file
    if (← privateFile.pathExists) then
      fnames := fnames.push privateFile
  let parts ← readModuleDataParts fnames
  if h : parts.size = 0 then throw <| IO.userError "could not read the compiled proof" else
  let (mod, _) := parts[0]
  for imp in mod.imports do
    unless allowedImport imp.module do
      throw <| IO.userError s!"import not allowed: {imp.module}"
  let (_, s) ← importModulesCore mod.imports |>.run
  let env ← finalizeImport s mod.imports {} 0 false false (isModule := true)
  let mut newConstants : Std.HashMap Name ConstantInfo := {}
  for name in parts[parts.size - 1].1.constNames, ci in parts[parts.size - 1].1.constants do
    newConstants := newConstants.insert name ci
  match newConstants[theoremName]? with
  | some (.thmInfo _) => pure ()
  | some _ => throw <| IO.userError s!"{theoremName} is not a theorem"
  | none => throw <| IO.userError s!"{theoremName} is not declared in the compiled proof"
  -- Throws a kernel exception if any declaration does not type-check.
  let env' ← env.replay newConstants
  let (axioms, _) ← (collectAxioms theoremName : CoreM (Array Name)).toIO
    { fileName := "<checker>", fileMap := default } { env := env' }
  return Json.mkObj [
    ("theorem", toJson theoremName.toString),
    ("axioms", toJson (axioms.map (·.toString))),
    ("declarations", toJson newConstants.size)
  ]

unsafe def main (args : List String) : IO UInt32 := do
  match args with
  | [dir, module, theoremName] =>
    initSearchPath (← findSysroot)
    try
      let result ← check dir module.toName theoremName.toName
      IO.println result.compress
      return 0
    catch e =>
      IO.eprintln s!"check failed: {e}"
      return 1
  | _ =>
    IO.eprintln "usage: lean --run Checker.lean <dir> <module> <theoremName>"
    return 2
