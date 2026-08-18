"""
Contrast audit — run with:  npm run audit:contrast

Extracts every className in src/, finds foreground/background token pairs on the
SAME element, resolves both to hex, and measures the WCAG ratio.

Understands Tailwind state variants: a `group-hover:bg-X` is only paired with a
`group-hover:text-Y` if one exists, because that is what actually renders
together. Without that, hover-inverting buttons produce false positives and the
audit stops being trusted — which is worse than not having one.

Exits non-zero on any pair below 4.5:1 so it can gate CI.
"""
import pathlib, re, sys

# Tokens are PARSED FROM globals.css rather than duplicated here.
# A hardcoded copy drifts the moment someone edits a colour — which it already
# did once, producing a phantom failure for a value that had just been fixed.
def load_tokens(css_path: pathlib.Path):
    css = css_path.read_text(encoding="utf-8")
    theme = css[css.index('@theme'):]
    return {
        m.group(1): m.group(2).upper()
        for m in re.finditer(r'--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6})', theme)
    }

def lum(h):
    h=h.lstrip('#'); c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[(x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4) for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
def ratio(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+.05)/(lo+.05)
# Tokens that are BORDERS or DECORATION, never text. Measuring them as
# foregrounds produces failures for things that are working as designed —
# `outline` is a 3.9:1 hairline and is supposed to be.
NON_TEXT = {'outline', 'outline-variant', 'muted-gold'}

def resolve(t): return '#FFFFFF' if t=='white' else TOKENS.get(t)

# The trailing (?!/) matters: `bg-white/[0.08]` is a TRANSLUCENT overlay whose
# effective colour depends on whatever is painted behind it, so it cannot be
# measured from the class alone. Treating it as opaque white produced a
# "white on white 1.00:1" false positive on the onDark button — and an audit
# that cries wolf stops being read, which is worse than no audit.
TOK = re.compile(r'(?:([a-z-]+):)?(text|bg)-(?:\[var\(--color-([a-z-]+)\)\]|(white))(?![/\w-])')

def pairs_for(cls: str):
    """Group tokens by state variant; pair fg/bg within the same state,
       falling back to the base state for whichever half is absent."""
    states = {}
    for m in TOK.finditer(cls):
        state = m.group(1) or 'base'
        kind  = m.group(2)
        tok   = m.group(3) or m.group(4)
        states.setdefault(state, {})[kind] = tok
    base = states.get('base', {})
    out = []
    for state, d in states.items():
        fg = d.get('text', base.get('text'))
        bg = d.get('bg',   base.get('bg'))
        if fg and bg:
            out.append((state, fg, bg))
    return out

root = pathlib.Path(__file__).resolve().parent.parent / 'src'
TOKENS = load_tokens(root / 'app' / 'globals.css')
print(f'tokens loaded from globals.css: {len(TOKENS)}')
cls_re = re.compile(r'[\'"`]([^\'"`\n]*(?:text|bg)-[^\'"`\n]*)[\'"`]')

problems, checked = [], 0
for p in sorted(root.rglob('*.tsx')):
    for m in cls_re.finditer(p.read_text(encoding="utf-8")):
        for state, fgt, bgt in pairs_for(m.group(1)):
            if fgt in NON_TEXT: continue
            fg, bg = resolve(fgt), resolve(bgt)
            if not (fg and bg): continue
            checked += 1
            r = ratio(fg, bg)
            if r < 4.5:
                problems.append((r, f'{fgt} on {bgt}', state, str(p.relative_to(root))))

print(f'pairs checked: {checked}')
if problems:
    print(f'\n{len(problems)} BELOW AA (4.5:1):\n')
    for r, pair, state, f in sorted(problems):
        print(f'  {r:4.2f}:1  {pair:38} [{state}]  {f}')
    sys.exit(1)
print('all same-element pairs clear AA')
