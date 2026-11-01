"""Setting the Kids Dashboard up: Music Assistant's address and a token of its own."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers.selector import (
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)
import voluptuous as vol

from .const import CONF_TOKEN, CONF_URL, DOMAIN
from .library import MusicAssistant, MusicAssistantError


class KidsDashboardConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        errors: dict[str, str] = {}
        if user_input is not None:
            ma = MusicAssistant(self.hass, user_input[CONF_URL], user_input[CONF_TOKEN])
            try:
                await ma.command("players/all")
            except MusicAssistantError:
                errors["base"] = "cannot_connect"
            else:
                return self.async_create_entry(
                    title="Kids Dashboard",
                    data={CONF_URL: user_input[CONF_URL].rstrip("/"), CONF_TOKEN: user_input[CONF_TOKEN]},
                )
        return self.async_show_form(
            step_id="user",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_URL, default=(user_input or {}).get(CONF_URL, "http://homeassistant.local:8095")
                    ): str,
                    vol.Required(CONF_TOKEN): TextSelector(
                        TextSelectorConfig(type=TextSelectorType.PASSWORD)
                    ),
                }
            ),
        )
