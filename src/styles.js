import { css } from 'lit'

// Colors come from the Home Assistant theme, so the card follows light and dark mode. The card is as tall as
// the screen and scrolls inside itself: the header stays at the top and the player bar at the bottom.
export const styles = css`
    :host {
        display: block;
        height: var(--kids-dashboard-height, 100vh);
    }

    ha-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        padding: 0;
        background: var(--ha-card-background, var(--card-background-color));
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
        fill: currentColor;
    }

    button {
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    /* Header and content */

    header {
        display: flex;
        flex: none;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        padding: 12px 16px 6px;
    }

    header h1 {
        flex: 1;
        margin: 0;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 26px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .back {
        flex: none;
        width: 48px;
        height: 48px;
        padding: 12px;
        border-radius: 50%;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    .content {
        flex: 1;
        min-height: 0;
        padding: 4px 16px 18px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: none;
    }

    .content::-webkit-scrollbar {
        display: none;
    }

    .content.home {
        padding-top: 16px;
    }

    .empty {
        padding: 30px;
        color: var(--secondary-text-color);
        font-size: 17px;
        text-align: center;
    }

    /* Tiles: authors on the home page, books in a group */

    .shelf {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 18px 16px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 16px;
    }

    .tile {
        display: flex;
        flex-direction: column;
        gap: 7px;
        min-width: 0;
    }

    .cover {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: var(--ha-card-border-radius, 12px);
        background: var(--secondary-background-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    }

    .cover img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .name {
        display: -webkit-box;
        overflow: hidden;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 500;
        line-height: 1.25;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
    }

    .name.single-line {
        display: block;
        margin-top: 2px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sub {
        margin-top: -3px;
        color: var(--secondary-text-color);
        font-size: 14px;
    }

    .heard {
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 22px;
        height: 22px;
        padding: 3px;
        border-radius: 50%;
        background: var(--success-color, #43a047);
        color: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
    }

    .progress {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        height: 6px;
        background: rgba(0, 0, 0, 0.5);
    }

    .progress i {
        display: block;
        height: 100%;
        background: var(--primary-color);
    }

    /* A book */

    .book {
        display: flex;
        align-items: flex-start;
        gap: 22px;
    }

    .book .cover {
        flex: none;
        width: 260px;
    }

    .book .side {
        flex: 1;
        min-width: 0;
    }

    .book .meta {
        color: var(--secondary-text-color);
        font-size: 16px;
    }

    .book h3 {
        margin: 4px 0 14px;
        color: var(--primary-text-color);
        font-size: 24px;
        line-height: 1.2;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .action {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        height: 56px;
        padding: 0 24px 0 16px;
        border-radius: 28px;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        font-size: 19px;
        font-weight: 600;
    }

    .action svg {
        width: 28px;
        height: 28px;
    }

    .action.secondary {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
    }

    .chapters {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 16px;
    }

    .chapter {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 50px;
        padding: 4px 14px;
        border-radius: 12px;
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
        font-size: 16px;
    }

    .chapter.now {
        outline: 2px solid var(--primary-color);
    }

    .chapter b {
        display: flex;
        flex: none;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 15px;
        background: var(--divider-color);
        font-size: 13px;
        font-weight: 600;
    }

    .chapter span {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .chapter em {
        color: var(--secondary-text-color);
        font-size: 14px;
        font-style: normal;
    }

    /* The player bar */

    .player {
        display: flex;
        flex: none;
        align-items: center;
        gap: 14px;
        padding: 8px 16px;
        border-top: 1px solid var(--divider-color);
        background: var(--secondary-background-color);
        box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.25);
    }

    .now-playing {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 14px;
        min-width: 0;
    }

    .now-playing img {
        flex: none;
        width: 64px;
        height: 64px;
        border-radius: 12px;
        object-fit: cover;
    }

    .now-playing .text {
        flex: 1;
        min-width: 0;
    }

    .now-playing .title,
    .now-playing .detail {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .now-playing .title {
        color: var(--primary-text-color);
        font-size: 18px;
        font-weight: 600;
    }

    .now-playing .detail {
        color: var(--secondary-text-color);
        font-size: 14px;
    }

    .now-playing .bar {
        height: 5px;
        margin-top: 7px;
        overflow: hidden;
        border-radius: 3px;
        background: var(--divider-color);
    }

    .now-playing .bar i {
        display: block;
        height: 100%;
        background: var(--primary-color);
    }

    .control {
        flex: none;
        width: 48px;
        height: 48px;
        padding: 12px;
        border-radius: 50%;
        color: var(--primary-text-color);
    }

    .control.main {
        width: 58px;
        height: 58px;
        padding: 15px;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
    }
`
