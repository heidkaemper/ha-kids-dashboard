"""Constants for the Kids Dashboard integration."""

DOMAIN = "kids_dashboard"
VERSION = "0.9.5"

CONF_URL = "url"
CONF_TOKEN = "token"

# A profile is a child's own user in Music Assistant: what it likes, and how far it got, is its own.
SUBENTRY_PROFILE = "profile"

CARD_URL = "/kids_dashboard/kids-dashboard-card.js"
IMAGE_URL = "/api/kids_dashboard/img"

# How often the library is read again from Music Assistant, in seconds.
REFRESH_INTERVAL = 60

# A book counts as heard on a player once it has played there this long without a break, in seconds, so one
# tapped by mistake neither turns up under "Zuletzt" nor moves its group to the front.
HEARD_AFTER = 60

# How many books "Zuletzt" keeps per player.
RECENT_BOOKS = 10

# "Kürzlich aktualisiert": the newest episodes of the podcasts a profile likes, this many days back, at most
# this many.
LATEST_DAYS = 30
LATEST_EPISODES = 20

# What an episode's URI holds, whatever provider it comes from: itunes_podcasts://podcast_episode/…
EPISODE = "://podcast_episode/"

# How many episodes "Zuletzt gehört" lists.
RECENT_EPISODES = 10

# How long a podcast's episodes are kept before Music Assistant is asked again, in seconds. Music Assistant
# reads the feed itself only every few hours; this is about what was heard.
EPISODES_TTL = 60
