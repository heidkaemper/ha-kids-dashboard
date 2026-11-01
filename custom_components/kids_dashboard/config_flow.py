"""Setting the Kids Dashboard up: Music Assistant's address, and a profile per child with the token of its
own user in Music Assistant. A profile is named after that user."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    ConfigSubentryFlow,
    SubentryFlowResult,
)
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)
import voluptuous as vol

from .const import CONF_TOKEN, CONF_URL, DOMAIN, SUBENTRY_PROFILE
from .library import MusicAssistant, MusicAssistantError

TOKEN = TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD))


def _name(user: dict) -> str:
    return user.get("display_name") or user["username"]


class KidsDashboardConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 2

    @classmethod
    @callback
    def async_get_supported_subentry_types(
        cls, config_entry: ConfigEntry
    ) -> dict[str, type[ConfigSubentryFlow]]:
        return {SUBENTRY_PROFILE: ProfileFlow}

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        errors: dict[str, str] = {}
        if user_input is not None:
            url = user_input[CONF_URL].rstrip("/")
            try:
                user = await MusicAssistant(self.hass, url, user_input[CONF_TOKEN]).user()
            except MusicAssistantError:
                errors["base"] = "cannot_connect"
            else:
                return self.async_create_entry(
                    title="Kids Dashboard",
                    data={CONF_URL: url},
                    subentries=[
                        {
                            "subentry_type": SUBENTRY_PROFILE,
                            "title": _name(user),
                            "data": {CONF_TOKEN: user_input[CONF_TOKEN]},
                            "unique_id": user["user_id"],
                        }
                    ],
                )
        return self.async_show_form(
            step_id="user",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_URL, default=(user_input or {}).get(CONF_URL, "http://homeassistant.local:8095")
                    ): str,
                    vol.Required(CONF_TOKEN): TOKEN,
                }
            ),
        )


class ProfileFlow(ConfigSubentryFlow):
    """A child's profile: the token of its own user in Music Assistant, made while signed in as that user."""

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> SubentryFlowResult:
        entry = self._get_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                user = await MusicAssistant(self.hass, entry.data[CONF_URL], user_input[CONF_TOKEN]).user()
            except MusicAssistantError:
                errors["base"] = "cannot_connect"
            else:
                if any(sub.unique_id == user["user_id"] for sub in entry.subentries.values()):
                    return self.async_abort(reason="already_configured")
                return self.async_create_entry(
                    title=_name(user), data={CONF_TOKEN: user_input[CONF_TOKEN]}, unique_id=user["user_id"]
                )
        return self.async_show_form(
            step_id="user", errors=errors, data_schema=vol.Schema({vol.Required(CONF_TOKEN): TOKEN})
        )
