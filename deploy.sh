#!/bin/sh
# Lints and builds the card, then copies the integration into Home Assistant's /config over SSH (the "Terminal & SSH" add-on).
#
#   ./deploy.sh                 copy, then check the configuration
#   ./deploy.sh --restart       copy, check, and restart Home Assistant (needed for Python changes)
#
# HA_SSH says where Home Assistant is (default: root@homeassistant.local).
set -eu

HA_SSH="${HA_SSH:-root@homeassistant.local}"
cd "$(dirname "$0")"

npm run --silent lint
npm run --silent build

find custom_components -name __pycache__ -type d -prune -exec rm -rf {} +
COPYFILE_DISABLE=1 tar -cf - custom_components/kids_dashboard | ssh "$HA_SSH" '
  set -e
  rm -rf /config/custom_components/kids_dashboard.new
  mkdir -p /config/custom_components/kids_dashboard.new
  tar -xf - -C /config/custom_components/kids_dashboard.new --strip-components=2 2>/dev/null
  rm -rf /config/custom_components/kids_dashboard
  mv /config/custom_components/kids_dashboard.new /config/custom_components/kids_dashboard
  echo "copied to /config/custom_components/kids_dashboard"
'

ssh "$HA_SSH" 'ha core check' >/dev/null && echo "configuration ok"
if [ "${1:-}" = "--restart" ]; then
  ssh "$HA_SSH" 'ha core restart' && echo "Home Assistant restarted"
fi
