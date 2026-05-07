#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/build-cv.sh [src.tex] [out_dir]
SRC_TEX=${1:-cv/cv.tex}
OUT_DIR=${2:-public/cv}

echo "Source .tex: $SRC_TEX"
echo "Output dir: $OUT_DIR"

mkdir -p "$OUT_DIR"

if [ ! -f "$SRC_TEX" ]; then
  echo "Error: source .tex not found: $SRC_TEX" >&2
  exit 2
fi

pdflatex -interaction=nonstopmode -halt-on-error -output-directory="$OUT_DIR" "$SRC_TEX"

PDF="$OUT_DIR/$(basename "${SRC_TEX%.tex}.pdf")"
if [ ! -f "$PDF" ]; then
  # fallback: try basename of input
  PDF="$OUT_DIR/$(basename "${SRC_TEX%.*}.pdf")"
fi

if [ ! -f "$PDF" ]; then
  echo "PDF not found after pdflatex: expected $PDF" >&2
  exit 3
fi

echo "Generated PDF: $PDF"

# Export page 1 and page 2 as PNG using pdftocairo (poppler)
pdftocairo -png -f 1 -l 1 -singlefile "$PDF" "$OUT_DIR/cv_1" || { echo "pdftocairo page1 failed" >&2; exit 4; }
pdftocairo -png -f 2 -l 2 -singlefile "$PDF" "$OUT_DIR/cv_2" || { echo "pdftocairo page2 failed" >&2; exit 5; }

echo "Exported images: $OUT_DIR/cv_1.png, $OUT_DIR/cv_2.png"
