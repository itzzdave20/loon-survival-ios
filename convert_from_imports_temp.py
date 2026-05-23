import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent

pattern = re.compile(r'^(?P<indent>\s*)from\s+(?P<module>[A-Za-z0-9_\.]+)\s+import\s+(?P<names>.+?)\s*$')

def convert_line(line: str):
    match = pattern.match(line)
    if not match:
        return None

    indent = match.group("indent")
    module = match.group("module")
    names = [part.strip() for part in match.group("names").split(",")]
    out = [f"{indent}import {module}"]

    if names == ["*"]:
        if module == "settings":
            out.append(f"{indent}globals().update({{k: v for k, v in settings.__dict__.items() if not k.startswith('__')}})")
        else:
            alias = module.split(".")[-1]
            out[0] = f"{indent}import {module} as {alias}"
            out.append(f"{indent}globals().update({{k: v for k, v in {alias}.__dict__.items() if not k.startswith('__')}})")
        return "\n".join(out)

    for name in names:
        if " as " in name:
            original, alias = [piece.strip() for piece in name.split(" as ", 1)]
        else:
            original = alias = name
        out.append(f"{indent}{alias} = {module}.{original}")

    return "\n".join(out)

changed_files = []

for path in ROOT.rglob("*.py"):
    if ".venv" in path.parts or path.name == "convert_from_imports_temp.py":
        continue

    original_text = path.read_text()
    converted_lines = []
    modified = False

    for line in original_text.splitlines():
        converted = convert_line(line)
        if converted is None:
            converted_lines.append(line)
        else:
            converted_lines.extend(converted.splitlines())
            modified = True

    if modified:
        final_text = "\n".join(converted_lines)
        if original_text.endswith("\n"):
            final_text += "\n"
        path.write_text(final_text)
        changed_files.append(str(path.relative_to(ROOT)))

print(f"Modified {len(changed_files)} files")
for changed_file in changed_files:
    print(changed_file)
