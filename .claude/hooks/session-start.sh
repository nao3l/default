#!/bin/bash
# クラウドセッション開始時に依存パッケージを入れ、テストとリントをすぐ実行できるようにする
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
npm ci --no-audit --no-fund
