"""Constants for the Kids Dashboard integration."""

DOMAIN = "kids_dashboard"
VERSION = "0.8.1"

CONF_URL = "url"
CONF_TOKEN = "token"

CARD_URL = "/kids_dashboard/kids-dashboard-card.js"
IMAGE_URL = "/api/kids_dashboard/img"

# How often the library is read again from Music Assistant, in seconds.
REFRESH_INTERVAL = 60

# A book counts as heard on a player once it has played there this long without a break, in seconds, so one
# tapped by mistake neither turns up under "Zuletzt" nor moves its group to the front.
HEARD_AFTER = 60

# How many books "Zuletzt" keeps per player.
RECENT_BOOKS = 10
